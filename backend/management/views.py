import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import extract_access_token, get_user_from_token


def get_supabase_headers():
    """
    Supabase API 요청에 필요한 헤더 반환
    - apikey: Supabase 서비스 키
    - Authorization: Bearer 토큰 방식으로 인증
    - Content-Type: JSON 형식으로 데이터 전송
    """
    return {
        "apikey": os.getenv("SUPABASE_SERVICE_KEY"),
        "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
        "Content-Type": "application/json",
    }


class AdminItemView(APIView):
    """아이템 추가 API (관리자 전용)"""

    def post(self, request):
        """
        POST /api/v1/admin/items/
        - Authorization 헤더의 access_token으로 관리자 권한 확인
        - item_name, item_type, item_price, item_stackable, item_info, item_image_url을 받아 Supabase items 테이블에 저장
        - 저장된 item_id와 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 필수값 추출
        item_name = request.data.get("item_name", "").strip()
        item_type = request.data.get("item_type", "").strip()
        item_price = request.data.get("item_price", None)
        item_info = request.data.get("item_info", "").strip()
        item_image_url = request.data.get("item_image_url", "").strip()

        # 필수값 누락 시 400 반환
        if not all([item_name, item_type, item_price is not None, item_info]):  # 문자열은 빈 문자열이면 자동으로 False로 처리 (is not None이 없어도 누락 감지 가능)
            return Response(
                {"message": "item_name, item_type, item_price, item_info는 필수입니다."},    # item_image_url은 현재 이미지가 아직 없으므로 필수값에서 제외
                status=status.HTTP_400_BAD_REQUEST,
            )

        # item_type 유효성 검증
        valid_item_types = ["app_theme", "diary_theme", "sticker", "emoji", "ticket"]
        if item_type not in valid_item_types:
            return Response(
                {"message": f"item_type은 {', '.join(valid_item_types)} 중 하나여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # item_stackable을 item_type에 따라 자동 설정
        # app_theme, diary_theme는 중복 보유 불가 (false)
        # sticker, emoji, ticket은 중복 보유 가능 (true)
        non_stackable_types = ["app_theme", "diary_theme"]
        item_stackable = item_type not in non_stackable_types

        try:
            # access_token으로 유저 정보 조회
            user = get_user_from_token(access_token)

            # 유효하지 않은 토큰인 경우 401 반환
            if not user:
                return Response(
                    {"message": "유효하지 않은 토큰입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # 관리자 권한 확인 (user_metadata의 role이 admin인 경우만 허용)
            role = user.get("user_metadata", {}).get("role", "")
            if role != "admin":
                return Response(
                    {"message": "관리자 권한이 필요합니다."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase items 테이블에 아이템 저장
            response = requests.post(
                f"{supabase_url}/rest/v1/items",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    "item_name": item_name,
                    "item_type": item_type,
                    "item_price": item_price,
                    "item_stackable": item_stackable,
                    "item_info": item_info,
                    "item_image_url": item_image_url or None,   # 값이 없으면 None으로 저장
                },
            )

            # 저장 실패 시 예외 발생
            if response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {response.text}")

            item = response.json()[0]

            return Response(
                {
                    "item_id": item.get("item_id"),
                    "message": "아이템이 등록되었습니다.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== ADMIN ITEM CREATE ERROR ===\n{error}\n==============================")
            return Response(
                {"message": "아이템 추가 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
