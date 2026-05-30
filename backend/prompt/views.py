import os
import re
import requests as http_requests
from groq import Groq
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# backend/.env 파일에서 환경변수 로드
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

# ▼ Ollama 로컬 서버 설정 (ollama pull qwen2.5:7b 필요)
OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen2.5:7b"

# ▼ Groq 모델명 (.env의 GROQ_API_KEY 필요)
GROQ_MODEL = "qwen/qwen3-32b"

# ▼ Cerebras 모델명 (.env의 CEREBRAS_API_KEY 필요)
CEREBRAS_MODEL = "qwen-3-235b-a22b-instruct-2507"


# ============================================================
# 프롬프트 구조
#
#   [FIXED_PREFIX] + [llm_model_engine_type이 생성한 장면 설명] + [FIXED_SUFFIX]
#
# FIXED_PREFIX: 픽셀아트 스타일을 고정하는 토큰 (항상 앞에 붙음)
# FIXED_SUFFIX: 시점 등 후처리 토큰 (항상 뒤에 붙음)
# NEGATIVE_PROMPT: 이미지에서 제외할 요소들 (ComfyUI 부정 프롬프트에 입력)
# ============================================================

# ▼ 픽셀아트 스타일 고정 토큰 - 바꾸면 그림체가 달라집니다
FIXED_PREFIX = "(pixel art:1.3), (chibi:1.2), (medium shot:1.4), front view, eye level, East Asian, low resolution, retro video game style, flat coloring, simplistic shapes, sharp pixel edges, consistent pixel grid, cute, soft pastel colors, kawaii"

# ▼ 시점 토큰 - 수정 가능 (예: isometric view:0.8, wide shot:1.2 등)
FIXED_SUFFIX = "(character focus:1.3)"

# ▼ 부정 프롬프트 - 이미지에 나오지 않았으면 하는 요소들
NEGATIVE_PROMPT = "(realistic:1.4), (smooth skin:1.3), (photorealistic:1.3), anti-aliasing, blurry, gradient shading, soft edges, 3d render, distorted limbs, ugly face, deformed face, (close up face:1.3), neon, dark, busy background, noise, artifacts, grain, dirty, messy, cluttered, isometric, overhead view, top down, bird's eye view, aerial view"


def call_llm_model_engine_type(messages, llm_model_engine_type="groq"):
    """
    llm_model_engine_type 호출
    - llm_model_engine_type="groq"     : Groq API (기본값, .env의 GROQ_API_KEY 필요)
    - llm_model_engine_type="local"    : Ollama 로컬 (ollama pull qwen2.5:7b 필요)
    - llm_model_engine_type="cerebras" : Cerebras API (.env의 CEREBRAS_API_KEY 필요)
    """
    if llm_model_engine_type == "local":
        response = http_requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False}
        )
        return response.json()["message"]["content"].strip()
    elif llm_model_engine_type == "cerebras":
        client = Cerebras(api_key=os.getenv("CEREBRAS_API_KEY"))
        response = client.chat.completions.create(
            model=CEREBRAS_MODEL,
            messages=messages
        )
        return response.choices[0].message.content.strip()
    else:  # "groq" 기본값
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages
        )
        content = response.choices[0].message.content.strip()
        # ▼ Qwen3 thinking 모드의 <think>...</think> 블록 제거
        return re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()


class PromptView(APIView):
    """
    프롬프트 변환 및 수정 API
    """


    def post(self, request):
        """
        프롬프트 변환
        POST  /api/v1/prompt/
        - Authorization 헤더의 access_token으로 현재 유저 확인 (이후에 추가 예정)
        - 일기를 받아서 긍정/부정 프롬프트로 변환
        - model, positive_prompt, negative_prompt 반환
        """
        diary = request.data.get("diary", "").strip()
        user_request = request.data.get("request", "").strip()  # ▼ 추가·강조할 요소 (선택 / 한국어 가능)
        remove = request.data.get("remove", "").strip()         # ▼ 제거할 요소 (선택 / 한국어 가능)
        llm_model_engine_type = "groq"                          # ▼ Qwen(Groq)으로 고정

        if not diary:
            return Response(
                {"message": "diary를 입력해주세요."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            scene = call_llm_model_engine_type([{
                "role": "user",
                "content": (
                    # ▼ LLM에게 주는 지시문 (영어로 작성해야 영어 프롬프트가 나옵니다)
                    # ▼ Rules 항목을 수정하면 프롬프트 스타일이 달라집니다
                    f"You are an image prompt generator. Transform the following Korean diary entry into a natural English image generation prompt for ComfyUI pixel art.\n"
                    f"IMPORTANT: Your entire response must be in English only. Do NOT output any Korean text.\n"
                    f"Rules:\n"
                    f"- Always start with the main character's action and emotion first, then describe the setting\n"  # 인물 행동/감정 먼저
                    f"- The character must be the central focus of the scene, not the background\n"          # 인물이 주인공
                    f"- Include a simple background that sets the scene (e.g. a café, a street, a bedroom), but keep it minimal\n"  # 배경은 단순하게 유지
                    f"- Limit objects to 3 or fewer, only include items directly relevant to the diary\n"    # 관련 없는 소품 제한
                    f"- Write in natural descriptive phrases (not just keywords)\n"                          # 자연스러운 문장 (키워드만 나열 금지)
                    f"- Up to 80 words, be vivid and expressive\n"                                          # 최대 80단어로 줄여서 간결하게
                    f"- When describing food, specify clearly (e.g. 'fried chicken on a plate') to avoid confusion with animals\n"  # 음식/동물 혼동 방지
                    f"- Do NOT use style words like 'pixel', 'pixelated', '8-bit', 'retro' in the scene description\n"             # 스타일 단어 금지 (FIXED_PREFIX에서 처리)
                    f"- Output the scene description only, no extra explanation\n\n"
                    f"Diary: {diary}"
                )
            }], llm_model_engine_type=llm_model_engine_type)

            # ▼ request가 있으면 생성된 장면에 추가/강조 적용
            if user_request:
                scene = call_llm_model_engine_type([{
                    "role": "user",
                    "content": (
                        f"You are given a scene description from an image generation prompt. Add or emphasize the requested element while keeping ALL original details.\n"
                        f"Output only the scene description in one line. No explanations, no extra text.\n"
                        f"Do NOT include any style tokens like '(pixel art:1.2)', '(medium shot:1.4)', '(Close-up:0.8)' or similar tags in your output.\n"
                        f"Original scene: {scene}\n"
                        f"Additional request (may be in Korean): {user_request}\n"
                        f"Rules: keep main character as described, natural descriptive English, under 100 words, one line only."
                    )
                }], llm_model_engine_type=llm_model_engine_type)

            positive_prompt = f"{FIXED_PREFIX}, {scene}, {FIXED_SUFFIX}"  # ▼ 앞뒤 고정 토큰과 합치기

            # ▼ remove가 있으면 LLM으로 부정 프롬프트 키워드 변환 후 추가
            remove_keywords = ""
            if remove:
                remove_keywords = call_llm_model_engine_type([{
                    "role": "user",
                    "content": (
                        f"transform the following removal request into short English keywords for a ComfyUI negative prompt.\n"
                        f"Output only comma-separated English keywords, no explanation.\n"
                        f"Request (may be in Korean): {remove}"
                    )
                }], llm_model_engine_type=llm_model_engine_type)

            negative_prompt = f"{NEGATIVE_PROMPT}, {remove_keywords}" if remove_keywords else NEGATIVE_PROMPT

            model_used = OLLAMA_MODEL if llm_model_engine_type == "local" else CEREBRAS_MODEL if llm_model_engine_type == "cerebras" else GROQ_MODEL
            return Response({
                "model": model_used,
                "positive_prompt": positive_prompt,
                "negative_prompt": negative_prompt,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def patch(self, request):
        """
        프롬프트 수정
        PATCH /api/v1/prompt/
        - Authorization 헤더의 access_token으로 현재 유저 확인 (이후에 추가 예정)
        - 기존 변환된 긍정 프롬프트의 추가/제거 요청을 받아 프롬프트 수정
        - model, positive_prompt, negative_prompt 반환
        """
        original_prompt = request.data.get("prompt", "").strip()
        user_request = request.data.get("request", "").strip()  # ▼ 추가/강조할 요소 (한국어 가능)
        remove = request.data.get("remove", "").strip()         # ▼ 제거할 요소 (한국어 가능, 부정 프롬프트에 자동 추가)
        llm_model_engine_type = "groq"                          # ▼ Qwen(Groq)으로 고정

        if not original_prompt:
            return Response(
                {"message": "수정할 프롬프트가 없습니다. Prompt-Transform을 먼저 실행해주세요."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # ▼ remove가 있으면 LLM으로 ComfyUI 부정 프롬프트용 영어 키워드로 변환
            remove_keywords = ""
            if remove:
                remove_keywords = call_llm_model_engine_type([{
                    "role": "user",
                    "content": (
                        f"transform the following removal request into short English keywords for a ComfyUI negative prompt.\n"
                        f"Output only comma-separated English keywords, no explanation.\n"
                        f"Request (may be in Korean): {remove}"
                    )
                }], llm_model_engine_type=llm_model_engine_type)

            # ▼ request가 없으면 LLM 호출 없이 부정 프롬프트만 업데이트하여 반환
            if not user_request:
                negative_prompt = f"{NEGATIVE_PROMPT}, {remove_keywords}" if remove_keywords else NEGATIVE_PROMPT
                return Response({
                    "positive_prompt": original_prompt,
                    "negative_prompt": negative_prompt,
                }, status=status.HTTP_200_OK)

            restyle_scene = call_llm_model_engine_type([{
                "role": "user",
                "content": (
                    # ▼ 기존 내용 유지하면서 추가/강조만 하도록 지시
                    f"You are given a scene description from an image generation prompt. Add or emphasize the requested element while keeping ALL original details.\n"
                    f"Output only the scene description in one line. No explanations, no extra text.\n"
                    f"Do NOT include any style tokens like '(pixel art:1.2)', '(medium shot:1.4)', '(Close-up:0.8)' or similar tags in your output.\n"
                    f"Original scene: {original_prompt}\n"
                    f"Additional request (may be in Korean): {user_request}\n"
                    f"Rules: keep main character as described, natural descriptive English, under 100 words, one line only."
                )
            }], llm_model_engine_type=llm_model_engine_type)

            restyle_prompt = f"{FIXED_PREFIX}, {restyle_scene}, {FIXED_SUFFIX}"  # ▼ 고정 토큰 다시 붙이기

            # ▼ remove 영어 키워드를 부정 프롬프트에 추가
            negative_prompt = f"{NEGATIVE_PROMPT}, {remove_keywords}" if remove_keywords else NEGATIVE_PROMPT

            model_used = OLLAMA_MODEL if llm_model_engine_type == "local" else CEREBRAS_MODEL if llm_model_engine_type == "cerebras" else GROQ_MODEL
            return Response({
                "model": model_used,
                "positive_prompt": restyle_prompt,
                "negative_prompt": negative_prompt,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )