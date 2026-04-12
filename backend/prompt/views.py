import os
from groq import Groq
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# backend/.env 파일에서 환경변수 로드 (GROQ_API_KEY 필요)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

# ============================================================
# 프롬프트 구조
#
#   [FIXED_PREFIX] + [LLM이 생성한 장면 설명] + [FIXED_SUFFIX]
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


def get_groq_client():
    """Groq API 클라이언트 생성 (.env의 GROQ_API_KEY 사용)"""
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


class PromptTransformView(APIView):
    """
    일기 → 픽셀아트 프롬프트 변환 API

    POST /api/v1/prompt/transform
    Body: {
        "diary": "오늘 비가 와서 집에서 독서를 했다.",
        "gender": "girl",   (선택, 기본값: girl / 예: man, boy, woman 등)
        "age": 20           (선택, 기본값: 20 / 자연수 입력)
    }

    Response:
    {
        "positive_prompt": "FIXED_PREFIX + LLM 생성 장면 + FIXED_SUFFIX",
        "negative_prompt": "NEGATIVE_PROMPT 고정값"
    }
    """

    def post(self, request):
        diary = request.data.get("diary", "").strip()
        gender = request.data.get("gender", "girl").strip()  # ▼ 주인공 성별 (girl / man 등), 기본값: girl
        age = request.data.get("age", 20)                    # ▼ 주인공 나이 (자연수), 기본값: 20

        if not diary:
            return Response(
                {"error": "일기를 작성해주세요."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = get_groq_client()
            response = client.chat.completions.create(
                # ▼ 사용할 LLM 모델 - 바꾸면 다른 모델 사용 가능
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": (
                            # ▼ LLM에게 주는 지시문 (영어로 작성해야 영어 프롬프트가 나옵니다)
                            # ▼ 아래 Rules 항목들을 수정하면 프롬프트 스타일이 달라집니다
                            f"transform the following diary entry into a natural English image generation prompt for ComfyUI pixel art.\n"
                            f"Rules:\n"
                            f"- The main character is a {age}-year-old {gender} (the diary writer) and must be clearly visible and centered\n"  # 주인공: Body에서 받은 성별/나이 적용
                            f"- Write in natural descriptive phrases (not just keywords)\n"  # 자연스러운 문장 (키워드만 나열 금지)
                            f"- Up to 100 words, be vivid and expressive\n"  # 최대 100단어, 생동감 있게
                            f"- Describe the scene, mood, characters, setting, weather, and atmosphere in detail\n"  # 장면/분위기/날씨 등 묘사
                            f"- Output in English only, no extra explanation\n\n"  # 영어만 출력, 설명 없이
                            f"Diary: {diary}"
                        )
                    }
                ]
            )
            scene = response.choices[0].message.content.strip()  # LLM이 생성한 장면 설명 추출
            positive_prompt = f"{FIXED_PREFIX}, {scene}, {FIXED_SUFFIX}"  # 앞뒤 고정 토큰과 합치기

            return Response({
                "positive_prompt": positive_prompt,
                "negative_prompt": NEGATIVE_PROMPT,
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
        "prompt": "Prompt-transform 응답의 positive_prompt 값",
        "request": "고양이를 추가해줘"
    }

    Response:
    {
        "positive_prompt": "기존 내용 유지 + 요청 반영된 프롬프트",
        "negative_prompt": "NEGATIVE_PROMPT 고정값"
    }
    """

    def post(self, request):
        original_prompt = request.data.get("prompt", "").strip()
        user_request = request.data.get("request", "").strip()   # 한국어 가능, 추가/강조할 요소
        remove = request.data.get("remove", "").strip()          # ▼ 제거할 요소 (콤마로 구분), 부정 프롬프트에 자동 추가

        if not original_prompt:
            return Response(
                {"error": "수정할 프롬프트가 없습니다. Prompt-transform를 먼저 실행해주세요."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = get_groq_client()

            # remove가 있으면 LLM으로 영어 키워드로 변환
            remove_keywords = ""
            if remove:
                remove_response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "user",
                            "content": (
                                # ▼ 한국어 제거 요청을 ComfyUI 부정 프롬프트용 영어 키워드로 변환
                                f"transform the following removal request into short English keywords for a ComfyUI negative prompt.\n"
                                f"Output only comma-separated English keywords, no explanation.\n"
                                f"Request (may be in Korean): {remove}"
                            )
                        }
                    ]
                )
                remove_keywords = remove_response.choices[0].message.content.strip()

            # request가 없으면 LLM 호출 없이 부정 프롬프트만 업데이트
            if not user_request:
                negative_prompt = f"{NEGATIVE_PROMPT}, {remove_keywords}" if remove_keywords else NEGATIVE_PROMPT
                return Response({
                    "positive_prompt": original_prompt,
                    "negative_prompt": negative_prompt,
                }, status=status.HTTP_200_OK)

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": (
                            # ▼ 기존 내용 유지하면서 추가만 하도록 지시
                            # ▼ "Add or emphasize" = 기존 삭제 없이 추가/강조만
                            f"You are given a scene description from an image generation prompt. Add or emphasize the requested element while keeping ALL original details.\n"
                            f"Output only the restyle scene description in one line. No explanations, no extra text.\n"
                            f"Original scene: {original_prompt}\n"
                            f"Additional request (may be in Korean): {user_request}\n"  # 한국어 요청도 처리 가능
                            f"Rules: keep main character as described, natural descriptive English, under 100 words, one line only."
                        )
                    }
                ]
            )
            restyle_scene = response.choices[0].message.content.strip()
            restyle_prompt = f"{FIXED_PREFIX}, {restyle_scene}, {FIXED_SUFFIX}"  # 고정 토큰 다시 붙이기

            # remove 영어 키워드를 부정 프롬프트에 추가
            negative_prompt = f"{NEGATIVE_PROMPT}, {remove_keywords}" if remove_keywords else NEGATIVE_PROMPT

            return Response({
                "positive_prompt": restyle_prompt,
                "negative_prompt": negative_prompt,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
