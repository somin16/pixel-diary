import os
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
GROQ_MODEL = "llama-3.3-70b-versatile"

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
FIXED_PREFIX = "(pixel art:1.2), (medium shot:1.4), (centered:1.2), low resolution, retro video game style, flat coloring, simplistic shapes, detailed with individual pixels"

# ▼ 시점 토큰 - 수정 가능 (예: isometric view:0.8, wide shot:1.2 등)
FIXED_SUFFIX = "(Close-up:0.8)"

# ▼ 부정 프롬프트 - 이미지에 나오지 않았으면 하는 요소들
NEGATIVE_PROMPT = "(landscape focus:1.5), small figure, busy background, dark, neon, (realistic:1.3), 3d, distorted limbs"


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
        return response.choices[0].message.content.strip()


class PromptTransformView(APIView):
    """
    일기 → 픽셀아트 프롬프트 변환 API

    POST /api/v1/prompt/transform
    Body: {
        "llm_model_engine_type": "groq",                        (필수 / groq, local, cerebras)
        "diary": "오늘 비가 와서 집에서 독서를 했다.",              (필수)
        "gender": "girl",                                        (선택 / 예: man, boy, woman 등)
        "age": 20                                                (선택 / 자연수, gender와 함께 입력 시 인물모드)
    }

    - gender와 age 둘 다 입력 → 인물 중심 프롬프트 (주인공이 화면 중앙에 등장)
    - gender와 age 둘 다 생략 → 풍경/사물 중심 프롬프트 (인물 없음)
    - 둘 중 하나만 입력      → 400 에러

    Response:
    {
        "model": "사용한 LLM 모델명",
        "positive_prompt": "FIXED_PREFIX + LLM 생성 장면 + FIXED_SUFFIX",
        "negative_prompt": "NEGATIVE_PROMPT 고정값"
    }
    """

    def post(self, request):
        diary = request.data.get("diary", "").strip()
        gender = request.data.get("gender", "").strip()  # ▼ 주인공 성별 (선택 / girl, man 등)
        age_raw = request.data.get("age", "").strip()    # ▼ 주인공 나이 (선택 / 자연수, gender와 함께 입력)
        llm_model_engine_type = request.data.get("llm_model_engine_type", "").strip()  # ▼ groq / local / cerebras
        # ▼ gender, age 둘 다 있으면 인물모드 / 둘 다 없으면 풍경모드 / 하나만 있으면 400
        is_character_mode = False
        if gender and age_raw:
            try:
                age = int(age_raw)
                if age <= 0:
                    return Response(
                        {"message": "age는 1 이상의 정수여야 합니다."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                is_character_mode = True
            except (ValueError):
                return Response(
                    {"message": "age는 1 이상의 정수여야 합니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif gender or age_raw:
            # 둘 중 하나만 입력된 경우
            return Response(
                {"message": "gender와 age는 둘 다 입력하거나 둘 다 생략해야 합니다. (인물 중심 프롬프트를 원하시면 둘 다 입력해주세요)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not llm_model_engine_type:
            return Response(
                {"message": "llm_model_engine_type을 입력해주세요. (groq / local / cerebras)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_llm_types = ["groq", "local", "cerebras"]
        if llm_model_engine_type not in valid_llm_types:
            return Response(
                {"message": f"llm_model_engine_type은 {', '.join(valid_llm_types)} 중 하나여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not diary:
            return Response(
                {"message": "diary를 입력해주세요."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ▼ 인물모드 / 풍경모드에 따라 LLM 지시 규칙과 부정 프롬프트 분기
        if is_character_mode:
            character_rule = f"- The main character is a {age}-year-old {gender} (the diary writer) and must be clearly visible and centered"
            current_negative_prompt = NEGATIVE_PROMPT
        else:
            character_rule = "- The scene must be a landscape or an environment description WITHOUT any human characters or figures"
            # ▼ 풍경모드에서는 landscape focus 제외 (풍경이 잘 나오도록)
            current_negative_prompt = NEGATIVE_PROMPT.replace("(landscape focus:1.5), ", "")

        try:
            scene = call_llm_model_engine_type([{
                "role": "user",
                "content": (
                    # ▼ LLM에게 주는 지시문 (영어로 작성해야 영어 프롬프트가 나옵니다)
                    # ▼ Rules 항목을 수정하면 프롬프트 스타일이 달라집니다
                    f"transform the following diary entry into a natural English image generation prompt for ComfyUI pixel art.\n"
                    f"Rules:\n"
                    f"{character_rule}\n"  # ▼ 인물모드/풍경모드에 따라 동적으로 변하는 규칙
                    f"- Write in natural descriptive phrases (not just keywords)\n"   # 자연스러운 문장 (키워드만 나열 금지)
                    f"- Up to 100 words, be vivid and expressive\n"                  # 최대 100단어, 생동감 있게
                    f"- Describe the scene, mood, characters, setting, weather, and atmosphere in detail\n"  # 장면/분위기/날씨 등 묘사
                    f"- Output in English only, no extra explanation\n\n"            # 영어만 출력, 설명 없이
                    f"Diary: {diary}"
                )
            }], llm_model_engine_type=llm_model_engine_type)

            positive_prompt = f"{FIXED_PREFIX}, {scene}, {FIXED_SUFFIX}"  # ▼ 앞뒤 고정 토큰과 합치기

            model_used = OLLAMA_MODEL if llm_model_engine_type == "local" else CEREBRAS_MODEL if llm_model_engine_type == "cerebras" else GROQ_MODEL
            return Response({
                "model": model_used,
                "positive_prompt": positive_prompt,
                "negative_prompt": current_negative_prompt,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PromptRestyleView(APIView):
    """
    기존 프롬프트 수정 API

    기존 내용을 절대 삭제하거나 줄이지 않고, 요청한 요소만 추가/강조합니다.
    수정 요청은 한국어로 입력해도 됩니다.

    POST /api/v1/prompt/restyle
    Body: {
        "llm_model_engine_type": "groq",                        (필수 / groq, local, cerebras)
        "prompt": "Prompt-transform 응답의 positive_prompt 값",  (필수)
        "request": "고양이를 추가해줘",                           (선택 / 추가·강조할 요소, 한국어 가능)
        "remove": "비를 없애줘"                                   (선택 / 제거할 요소, 부정 프롬프트에 자동 추가)
    }

    Response:
    {
        "model": "사용한 LLM 모델명",
        "positive_prompt": "기존 내용 유지 + 요청 반영된 프롬프트",
        "negative_prompt": "NEGATIVE_PROMPT + remove 키워드"
    }
    """

    def post(self, request):
        original_prompt = request.data.get("prompt", "").strip()
        user_request = request.data.get("request", "").strip()  # ▼ 추가/강조할 요소 (한국어 가능)
        remove = request.data.get("remove", "").strip()         # ▼ 제거할 요소 (한국어 가능, 부정 프롬프트에 자동 추가)
        llm_model_engine_type = request.data.get("llm_model_engine_type", "").strip()  # ▼ groq / local / cerebras

        if not llm_model_engine_type:
            return Response(
                {"message": "llm_model_engine_type을 입력해주세요. (groq / local / cerebras)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_llm_types = ["groq", "local", "cerebras"]
        if llm_model_engine_type not in valid_llm_types:
            return Response(
                {"message": f"llm_model_engine_type은 {', '.join(valid_llm_types)} 중 하나여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

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
                    f"Output only the restyle scene description in one line. No explanations, no extra text.\n"
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