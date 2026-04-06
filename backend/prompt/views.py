import os
from groq import Groq
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

FIXED_PREFIX = "(pixel art:1.2), (medium shot:1.4), (centered:1.2), low resolution, retro video game style, flat coloring, simplistic shapes, detailed with individual pixels"
FIXED_SUFFIX = "(Close-up:0.8)"
NEGATIVE_PROMPT = "(landscape focus:1.5), small figure, busy background, dark, neon, (realistic:1.3), 3d, distorted limbs"


def get_groq_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


class PromptConvertView(APIView):
    """
    일기 → 픽셀아트 프롬프트 변환 API

    POST /api/v1/prompt/convert/
    Body: { "diary": "오늘 비가 와서 집에서 독서를 했다." }

    Response:
    {
        "positive_prompt": "...",
        "negative_prompt": "..."
    }
    """

    def post(self, request):
        diary = request.data.get("diary", "").strip()

        if not diary:
            return Response(
                {"error": "diary 필드가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = get_groq_client()
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"Convert the following diary entry into a natural English image generation prompt for ComfyUI pixel art.\n"
                            f"Rules:\n"
                            f"- The main character is always a young woman (the diary writer) and must be clearly visible and centered\n"
                            f"- Write in natural descriptive phrases (not just keywords)\n"
                            f"- Up to 100 words, be vivid and expressive\n"
                            f"- Describe the scene, mood, characters, setting, weather, and atmosphere in detail\n"
                            f"- Output in English only, no extra explanation\n\n"
                            f"Diary: {diary}"
                        )
                    }
                ]
            )
            scene = response.choices[0].message.content.strip()
            positive_prompt = f"{FIXED_PREFIX}, {scene}, {FIXED_SUFFIX}"

            return Response({
                "positive_prompt": positive_prompt,
                "negative_prompt": NEGATIVE_PROMPT,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PromptModifyView(APIView):
    """
    기존 프롬프트 수정 API (기존 내용 유지하며 요소 추가)

    POST /api/v1/prompt/modify/
    Body: {
        "prompt": "기존 긍정 프롬프트",
        "request": "고양이를 추가해줘"
    }

    Response:
    {
        "positive_prompt": "...",
        "negative_prompt": "..."
    }
    """

    def post(self, request):
        original_prompt = request.data.get("prompt", "").strip()
        user_request = request.data.get("request", "").strip()

        if not original_prompt or not user_request:
            return Response(
                {"error": "prompt와 request 필드가 모두 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = get_groq_client()
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"You are given a scene description from an image generation prompt. Add or emphasize the requested element while keeping ALL original details.\n"
                            f"Output only the modified scene description in one line. No explanations, no extra text.\n"
                            f"Original scene: {original_prompt}\n"
                            f"Additional request (may be in Korean): {user_request}\n"
                            f"Rules: keep main character as a young woman, natural descriptive English, under 100 words, one line only."
                        )
                    }
                ]
            )
            modified_scene = response.choices[0].message.content.strip()
            modified_prompt = f"{FIXED_PREFIX}, {modified_scene}, {FIXED_SUFFIX}"

            return Response({
                "positive_prompt": modified_prompt,
                "negative_prompt": NEGATIVE_PROMPT,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
