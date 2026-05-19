import os
import copy
import random
import time
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import extract_access_token, get_user_from_token, get_supabase_headers


class AIGenerateView(APIView):
    """AI 그림 생성(임시 저장) API"""

    COMFYUI_URL = "http://localhost:8188"
    STORAGE_BUCKET = "diary-images"

    WORKFLOW = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "12": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["4", 0],
                "clip": ["4", 1],
                "lora_name": "pixel-art-xl.safetensors",
                "strength_model": 0.8,
                "strength_clip": 1
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["12", 1], "text": ""}
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["12", 1], "text": ""}
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["12", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
                "seed": 0,
                "steps": 30,
                "cfg": 7,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "15": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["8", 0],
                "upscale_method": "nearest-exact",
                "width": 512, "height": 512, "crop": "disabled"
            }
        },
        "18": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["15", 0],
                "upscale_method": "nearest-exact",
                "width": 1024, "height": 1024, "crop": "disabled"
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"images": ["18", 0], "filename_prefix": "ComfyUI"}
        }
    }

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

        try:
            user_id = user.get("id")
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # 1. ComfyUI 워크플로우에 프롬프트 삽입 후 전송
            workflow = copy.deepcopy(self.WORKFLOW)
            workflow["6"]["inputs"]["text"] = positive_prompt
            workflow["7"]["inputs"]["text"] = negative_prompt
            workflow["3"]["inputs"]["seed"] = random.randint(0, 2 ** 32 - 1)

            prompt_response = requests.post(
                f"{self.COMFYUI_URL}/prompt",
                json={"prompt": workflow}
            )
            if prompt_response.status_code != 200:
                raise Exception(f"ComfyUI 오류: {prompt_response.text}")

            prompt_id = prompt_response.json().get("prompt_id")

            # 3. 이미지 생성 완료까지 폴링 (5초 간격, 최대 5분)
            image_data = None
            for _ in range(60):
                time.sleep(5)
                history = requests.get(f"{self.COMFYUI_URL}/history/{prompt_id}").json()
                if prompt_id in history:
                    for output in history[prompt_id].get("outputs", {}).values():
                        if "images" in output:
                            img_info = output["images"][0]
                            image_data = requests.get(
                                f"{self.COMFYUI_URL}/view",
                                params={"filename": img_info["filename"], "type": img_info["type"]}
                            ).content
                            break
                    if image_data:
                        break

            if not image_data:
                raise Exception("이미지 생성 시간 초과 (5분)")

            # 4. ai_image 테이블에 row 먼저 생성해서 image_id 확보
            # image_id를 파일명으로 사용해야 하므로 Storage 업로드 전에 생성
            ai_image_response = requests.post(
                f"{supabase_url}/rest/v1/ai_image",
                headers={**headers, "Prefer": "return=representation"},
                json={"user_id": user_id},
            )
            if ai_image_response.status_code not in [200, 201]:
                raise Exception(f"ai_image 저장 오류: {ai_image_response.text}")

            image_id = ai_image_response.json()[0].get("id")

            # 5. Supabase Storage에 업로드 — {user_id}/{image_id}.png
            # 재생성 시 preview.png 덮어쓰기 문제 해결: image_id별 고유 파일로 저장
            storage_headers = get_supabase_headers()
            storage_headers["Content-Type"] = "image/png"
            storage_headers["x-upsert"] = "true"

            storage_path = f"{user_id}/{image_id}.png"
            upload_response = requests.post(
                f"{supabase_url}/storage/v1/object/{self.STORAGE_BUCKET}/{storage_path}",
                headers=storage_headers,
                data=image_data,
            )
            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Storage 업로드 오류: {upload_response.text}")

            image_url = f"{supabase_url}/storage/v1/object/public/{self.STORAGE_BUCKET}/{storage_path}"

            # 6. ai_image.image_url 업데이트
            requests.patch(
                f"{supabase_url}/rest/v1/ai_image?id=eq.{image_id}",
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
            return Response(
                {"message": "ComfyUI 서버에 연결할 수 없습니다. ComfyUI가 실행 중인지 확인해주세요."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            print(f"=== DIARY AI GENERATE ERROR ===\n{error}\n===============================")
            return Response(
                {"message": "이미지 생성 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request):
        """
        DELETE /api/v1/ai-generate/
        - 저장 안 하고 나갈 때 호출
        - 해당 유저의 is_temp=true 이미지 전체 삭제 (Storage + ai_image 테이블)
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

        try:
            user_id = user.get("id")
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # is_temp=true인 이미지 목록 조회
            temp_response = requests.get(
                f"{supabase_url}/rest/v1/ai_image",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "is_temp": "eq.true",
                    "select": "id",
                },
            )
            temp_ids = [row.get("id") for row in temp_response.json()]

            if temp_ids:
                storage_headers = get_supabase_headers()
                storage_headers["Content-Type"] = "application/json"
                prefixes = [f"{user_id}/{temp_id}.png" for temp_id in temp_ids]
                requests.delete(
                    f"{supabase_url}/storage/v1/object/{self.STORAGE_BUCKET}",
                    headers=storage_headers,
                    json={"prefixes": prefixes},
                )
                requests.delete(
                    f"{supabase_url}/rest/v1/ai_image?user_id=eq.{user_id}&is_temp=eq.true",
                    headers=headers,
                )

            return Response(
                {"message": "임시 이미지가 삭제되었습니다."},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== AI IMAGE CLEANUP ERROR ===\n{error}\n==============================")
            return Response(
                {"message": "임시 이미지 삭제 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
