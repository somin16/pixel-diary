import os
import copy
import random
import time
import uuid # 웹소켓 진행률 구독용 client_id 생성
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import extract_access_token, get_user_from_token, get_supabase_headers
from workflows.pixel_art import PIXEL_ART_WORKFLOW  # comfyUI 워크플로우
from config.settings import COMFYUI_URLS, SUPABASE_URL

# 신규: POST(큐잉)와 GET(결과조회) 양쪽에서 쓰는 "결과 저장" 로직을 공용함수로 분리
def _save_generated_image(comfyui_url, image_info, user_id, headers, storage_bucket):
    """
    comfyUI 히스토리에서 얻은 이미지 정보를 다운로드 한 후
    Supabase Storage + ai_image 테이블에 저장하고 (image_id, image_url) 반환
    """
    image_data = requests.get(
        f"{comfyui_url}/view",
        params={"filename": image_info["filename"], "type": image_info["type"]}
    ).content

    # ai_image 테이블에 row 먼저 생성 후 image _id 확보 (기존 로직 유지)
    ai_image_response = requests.post(
        f"{SUPABASE_URL}/rest/v1/ai_image",
        headers={**headers, "Prefer": "return=representation"},
        json={"user_id": user_id},
    )
    if ai_image_response.status_code not in [200, 201]:
        raise Exception(f"ai_image 저장 오류: {ai_image_response.text}")
    image_id = ai_image_response.json()[0].get("id")

    storage_headers = get_supabase_headers()
    storage_headers["Content-Type"] = "image/png"
    storage_headers["x-upsert"] = "true"

    storage_path = f"{user_id}/{image_id}.png"
    upload_response = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{storage_bucket}/{storage_path}",
        headers=storage_headers,
        params={"x-upsert": "true"},
        data=image_data,
    )
    if upload_response.status_code not in [200, 201]:
        # ✅ 업로드 실패 시 방금 만든 row 롤백 (기존엔 post()의 except 블록이 처리했음)
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/ai_image?id=eq.{image_id}",
            headers=get_supabase_headers(),
        )
        raise Exception(f"Storage 업로드 오류: {upload_response.text}")

    image_url = f"{SUPABASE_URL}/storage/v1/object/public/{storage_bucket}/{storage_path}"

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/ai_image?id=eq.{image_id}",
        headers=headers,
        json={"image_url": image_url},
    )

    return image_id, image_url

class AIGenerateView(APIView):
    """AI 그림 생성 큐잉 API(즉시 응답)""" # 큐잉만 담당

    # 슈파베이스 스토리지 버켓
    STORAGE_BUCKET = "diary-images"

    # # 폴링 넘버, 폴링 : 이미지 생성이 끝났는지 주기적으로 계속 물어보는 것
    # POLL_INTERVAL_SEC = 5    # 5초 간격으로
    # POLL_MAX_ATTEMPTS = 60   # 최대 60번 물어봄  (5초 × 60 = 최대 5분)

    # 이 뷰에서는 더 이상 폴링 X

    def post(self, request):
        """
        POST /api/v1/ai-generate/
        - positive_prompt, negative_prompt 받아서 ComfyUI에 큐잉만 하고 즉시 응답 
        - 실제 완료 확인/저장은 GET /api/v1/ai-generate/{prompt_id}/result/ 에서 처리 
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
            # workflow["3"]["inputs"]["seed"] = 20260529              
            # 테스트용 고정 시드 (나중에 random.randint(0, 2 ** 32 - 1) 로 복구)

            # seed 값을 변수로 분리하여 로깅 가능하게 함 백엔드 서버 터미널에 나옴
            seed = random.randint(0, 2 ** 32 - 1)
            print(f"[ComfyUI] 생성 seed 값: {seed}")  # 콘솔 출력
            workflow["3"]["inputs"]["seed"] = seed

            client_id = str(uuid.uuid4()) # !! 진행률 웹소켓 구독용

            prompt_response = requests.post(
                f"{comfyui_url}/prompt",
                json={"prompt": workflow, "client_id": client_id} # client_id 추가 전송
            )
            if prompt_response.status_code != 200:
                raise Exception(f"ComfyUI 오류: {prompt_response.text}")

            prompt_id = prompt_response.json().get("prompt_id")

            # 기존: 여기서 최대 5분(POLL_MAX_ATTEMPTS × POLL_INTERVAL_SEC) 폴링하며 대기 → 전체 삭제
            # 변경: 큐잉 정보만 즉시 반환. 프론트가 client_id로 진행률 웹소켓 연결 후
            #          완료 감지되면 GET .../{prompt_id}/result/ 호출

            return Response(
                {
                    "client_id": client_id,
                    "prompt_id": prompt_id,
                    "comfyui_url": comfyui_url, # result 조회 시 같은 서버로 가야함 (전달)
                },
                status=status.HTTP_202_ACCEPTED, # 200 -> 202 (처리 중이라는 의미로 변경)
            )

        except requests.exceptions.ConnectionError:
            return Response( # 어느 서버에서 실패했는지 로그에 남김
                {"message": f"ComfyUI 서버({comfyui_url})에 연결할 수 없습니다. ComfyUI가 실행 중인지 확인해주세요."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== DIARY AI GENERATE ERROR ===\n{error}\n===============================")
  
            return Response(
                {"message": "이미지 생성 요청 중 오류가 발생했습니다."}, # 요청 실패로 변경
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request):
        """
        DELETE /api/v1/ai-generate/
        - 저장 안 하고 나갈 때 호출
        - 해당 유저의 is_temp=true 이미지 전체 삭제 (Storage + ai_image 테이블)
        - 실패, 성공 message와 삭제된 이미지 개수 반환
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
            headers = get_supabase_headers()

            # is_temp=true인 이미지 목록 조회
            temp_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/ai_image",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "is_temp": "eq.true",
                    "select": "id",
                },
            )
            if temp_response.status_code != 200:    # 응답 코드 확인 후 실패 시 파싱 크래시
                raise Exception(f"임시 이미지 조회 실패: {temp_response.text}")
            temp_ids = [row["id"] for row in temp_response.json() if row.get("id")] # id가 None인 비정상 데이터 방어적 필터링

            if temp_ids:
                storage_headers = get_supabase_headers()
                storage_headers["Content-Type"] = "application/json"
                prefixes = [f"{user_id}/{temp_id}.png" for temp_id in temp_ids]
                
                storage_res = requests.delete(
                    f"{SUPABASE_URL}/storage/v1/object/{self.STORAGE_BUCKET}",
                    headers=storage_headers,
                    json={"prefixes": prefixes},
                )
                if storage_res.status_code not in [200, 204]:
                    raise Exception(f"Storage 삭제 실패: {storage_res.text}")

                db_res = requests.delete(
                    f"{SUPABASE_URL}/rest/v1/ai_image?user_id=eq.{user_id}&is_temp=eq.true",
                    headers=headers,
                )
                # Storage는 이미 삭제됐지만  DB 삭제 실패 -> 고아 row 발생
                # 자동 복구 불가능하므로 user_id, temp_ids 상세로그 남김
                if db_res.status_code not in [200, 204]:
                    print(f"=== DB 삭제 실패 (Storage는 삭제됨, user_id={user_id}, temp_ids={temp_ids}) ===")
                    raise Exception(f"DB 삭제 실패: {db_res.text}")

            return Response({
                "message": "임시 이미지가 삭제되었습니다.",
                "deleted_count": len(temp_ids),  # 삭제된 이미지 수, 0이면 프론트에서 중복 호출 감지 가능
            }, status=200)

        except Exception as error:
            print(f"=== AI IMAGE CLEANUP ERROR ===\n{error}\n==============================")
            return Response(
                {"message": "임시 이미지 삭제 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# 신규 클래스: 생성 완료 여부 확인 + 완료 시 Storage/DB 저장까지 처리
class AIGenerateResultView(APIView):
    """AI 그림 생성 결과 조회 API"""

    STORAGE_BUCKET = "diary-images"

    def get(self, request, prompt_id):
        """
        GET /api/v1/ai-generate/{prompt_id}/result/?comfyui_url=...
        - 아직 생성 중이면 202 + {"status": "processing"}
        - 완료됐으면 Storage 업로드 + DB 저장까지 처리 후 image_id, image_url 반환
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

        comfyui_url = request.query_params.get("comfyui_url")
        if not comfyui_url:
            return Response(
                {"message": "comfyui_url 쿼리 파라미터가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            history = requests.get(f"{comfyui_url}/history/{prompt_id}").json()

            if prompt_id not in history:
                # 아직 생성 중 — 프론트는 보통 웹소켓 완료 신호를 받은 뒤 호출하므로
                # 정상 흐름에서는 거의 안 나오지만, 방어적으로 처리
                return Response({"status": "processing"}, status=status.HTTP_202_ACCEPTED)

            image_info = None
            for output in history[prompt_id].get("outputs", {}).values():
                if "images" in output:
                    image_info = output["images"][0]
                    break

            if not image_info:
                raise Exception("생성 완료됐지만 이미지 정보를 찾을 수 없습니다.")

            user_id = user.get("id")
            headers = get_supabase_headers()

            image_id, image_url = _save_generated_image(
                comfyui_url, image_info, user_id, headers, self.STORAGE_BUCKET
            )

            return Response(
                {"status": "done", "image_id": image_id, "image_url": image_url},
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.ConnectionError:
            return Response(
                {"message": f"ComfyUI 서버({comfyui_url})에 연결할 수 없습니다."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            print(f"=== AI GENERATE RESULT ERROR ===\n{error}\n===============================")
            return Response(
                {"message": "이미지 결과 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ) 