import os
import copy
import random
import time
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import extract_access_token, get_user_from_token, get_supabase_headers
from workflows.pixel_art import PIXEL_ART_WORKFLOW  # comfyUI 워크플로우
from config.settings import COMFYUI_URLS, SUPABASE_URL

class AIGenerateView(APIView):
    """AI 그림 생성(임시 저장) API"""

    # 슈파베이스 스토리지 버켓
    STORAGE_BUCKET = "diary-images"

    # 폴링 넘버, 폴링 : 이미지 생성이 끝났는지 주기적으로 계속 물어보는 것
    POLL_INTERVAL_SEC = 5    # 5초 간격으로
    POLL_MAX_ATTEMPTS = 60   # 최대 60번 물어봄  (5초 × 60 = 최대 5분)


    def post(self, request):
        """
        POST /api/v1/ai-generate/
        - positive_prompt, negative_prompt 받아서 ComfyUI로 이미지 생성
        - Supabase Storage에 업로드 ({user_id}/preview.png) // 수정 필요함 임시저장이 아닌 생성한 모든 이미지가 저장되던가 프리뷰로 계속 보여주다가 마지막 저장을 할때 일기와 함깨 이미지를 저장하던가
        - ai_image 테이블에 저장 (diary_id=NULL)
        - image_id, image_url 반환
        """
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_user_from_token(access_token)
        if not user:
            return Response(
                {"message": "유효하지 않은 토큰입니다."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        positive_prompt = request.data.get("positive_prompt", "").strip()
        negative_prompt = request.data.get("negative_prompt", "").strip()

        if not positive_prompt:
            return Response(
                {"message": "positive_prompt는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_id = None # try 블록 바깥에 선언해야 except에서 접근 가능

        try:
            user_id = user.get("id")
            headers = get_supabase_headers()

            # -- comfyUI 서버 선택 (여러 대면 랜덤 분산, 1대면 항상 그 서버) -- 
            comfyui_url = random.choice(COMFYUI_URLS) # env 파일에 서버url, 도메인 있어야 작동

            # ComfyUI 워크플로우에 프롬프트 삽입 후 전송
            workflow = copy.deepcopy(PIXEL_ART_WORKFLOW)    # 따로 분리된 워크플로우 불러와서 사용
            workflow["6"]["inputs"]["text"] = positive_prompt
            workflow["7"]["inputs"]["text"] = negative_prompt
            workflow["3"]["inputs"]["seed"] = random.randint(0, 2 ** 32 - 1)

            prompt_response = requests.post(
                f"{comfyui_url}/prompt",
                json={"prompt": workflow}
            )
            if prompt_response.status_code != 200:
                raise Exception(f"ComfyUI 오류: {prompt_response.text}")

            prompt_id = prompt_response.json().get("prompt_id")

            # 이미지 생성 완료까지 폴링: 이미지 생성이 끝났는지 주기적으로 계속 물어봄
            image_data = None
            for _ in range(self.POLL_MAX_ATTEMPTS): # 최대 몇번 물어볼지
                time.sleep(self.POLL_INTERVAL_SEC) # 몇 초 기다렸다가 다시 물어봄
                history = requests.get(f"{comfyui_url}/history/{prompt_id}").json() # 끝났어?
                if prompt_id in history: # 끝났으면 이미지 가져옴
                    for output in history[prompt_id].get("outputs", {}).values():
                        if "images" in output:
                            img_info = output["images"][0]
                            image_data = requests.get(
                                f"{comfyui_url}/view",
                                params={"filename": img_info["filename"], "type": img_info["type"]}
                            ).content
                            break
                    if image_data:
                        break # 이미지 가져오면 루프 탈출

            if not image_data:
                raise Exception("이미지 생성 시간 초과 (5분)")

            # ai_image 테이블에 row 먼저 생성해서 image_id 확보
            # image_id를 파일명으로 사용해야 하므로 Storage 업로드 전에 생성
            ai_image_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/ai_image",
                headers={**headers, "Prefer": "return=representation"},
                json={"user_id": user_id},
            )
            if ai_image_response.status_code not in [200, 201]:
                raise Exception(f"ai_image 저장 오류: {ai_image_response.text}")

            image_id = ai_image_response.json()[0].get("id")

            # Supabase Storage에 업로드 — {user_id}/{image_id}.png    image_id별 고유 파일로 저장
            storage_headers = get_supabase_headers()
            storage_headers["Content-Type"] = "image/png"
            storage_headers["x-upsert"] = "true"

            storage_path = f"{user_id}/{image_id}.png"
            upload_response = requests.post(
                f"{SUPABASE_URL}/storage/v1/object/{self.STORAGE_BUCKET}/{storage_path}",
                headers=storage_headers,
                data=image_data,
            )
            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Storage 업로드 오류: {upload_response.text}")

            image_url = f"{SUPABASE_URL}/storage/v1/object/public/{self.STORAGE_BUCKET}/{storage_path}"

            # 6. ai_image.image_url 업데이트
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/ai_image?id=eq.{image_id}",
                headers=headers,
                json={"image_url": image_url},
            )

            return Response(
                {
                    "image_id": image_id,
                    "image_url": image_url,
                },
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.ConnectionError:
            return Response( # 어느 서버에서 실패했는지 로그에 남김
                {"message": f"ComfyUI 서버({comfyui_url})에 연결할 수 없습니다. ComfyUI가 실행 중인지 확인해주세요."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== DIARY AI GENERATE ERROR ===\n{error}\n===============================")

            # Storage 업로드 실패 시 롤백
            if image_id:
                try:
                    requests.delete(
                        f"{SUPABASE_URL}/rest/v1/ai_image?id=eq.{image_id}",
                        headers=get_supabase_headers(),
                    )
                except Exception as rollback_error:
                    print(f"=== 롤백 실패 (id={image_id}): {rollback_error} ===")
                    
            return Response(
                {"message": "이미지 생성 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )