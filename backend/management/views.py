import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timezone
from utils import extract_access_token, get_user_from_token, get_supabase_headers


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
        if not all(
            [item_name, item_type, item_price is not None, item_info]
        ):  # 문자열은 빈 문자열이면 자동으로 False로 처리 (is not None이 없어도 누락 감지 가능)
            return Response(
                {
                    "message": "item_name, item_type, item_price, item_info는 필수입니다."
                },  # item_image_url은 현재 이미지가 아직 없으므로 필수값에서 제외
                status=status.HTTP_400_BAD_REQUEST,
            )

        # item_type 유효성 검증
        valid_item_types = ["app_theme", "diary_theme", "sticker", "emoji", "ticket"]
        if item_type not in valid_item_types:
            return Response(
                {
                    "message": f"item_type은 {', '.join(valid_item_types)} 중 하나여야 합니다."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # item_price 유효성 검증 (정수가 아니거나 음수인 경우 400 반환)
        if not isinstance(item_price, int):
            return Response(
                {"message": "item_price는 숫자여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if item_price < 0:
            return Response(
                {"message": "item_price는 0 이상이어야 합니다."},
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
                    "item_image_url": item_image_url
                    or None,  # 값이 없으면 None으로 저장
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
            print(
                f"=== ADMIN ITEM CREATE ERROR ===\n{error}\n=============================="
            )
            return Response(
                {"message": "아이템 추가 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminAnnouncementView(APIView):
    """공지사항 작성,수정 및 삭제 API (관리자 전용)"""

    def post(self, request):
        """
        공지사항 작성
        POST /api/v1/admin/announcements/
        - Authorization 헤더의 access_token으로 관리자 권한 확인
        - title, content, category를 받아 Supabase announcements 테이블에 저장
        - 저장된 announcement_id, created_at과 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 값 추출
        title = request.data.get("title", "").strip()
        content = request.data.get("content", "").strip()
        category = request.data.get("category", "").strip()  # category는 선택값

        # 필수값 누락 시 400 반환
        if not all([title, content]):
            return Response(
                {"message": "제목과 내용은 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

            # Supabase announcements 테이블에 공지사항 저장
            response = requests.post(
                f"{supabase_url}/rest/v1/announcements",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    "title": title,
                    "content": content,
                    "category": category or None,  # 값이 없으면 None으로 저장
                },
            )

            # 저장 실패 시 예외 발생
            if response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {response.text}")

            announcement = response.json()[0]

            return Response(
                {
                    "message": "공지사항이 등록되었습니다.",
                    "announcement_id": announcement.get("announcement_id"),
                    "created_at": announcement.get("created_at"),
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(
                f"=== ADMIN ANNOUNCEMENT CREATE ERROR ===\n{error}\n======================================="
            )
            return Response(
                {"message": "공지사항 작성 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, announcement_id):
        """
        공지사항 삭제
        DELETE /api/v1/admin/announcements/{announcement_id}/
        - Authorization 헤더의 access_token으로 관리자 권한 확인
        - 해당 공지사항 삭제
        - 삭제 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

            # Supabase announcements 테이블에서 공지사항 삭제
            response = requests.delete(
                f"{supabase_url}/rest/v1/announcements",
                headers={**headers, "Prefer": "return=representation"},
                params={"announcement_id": f"eq.{announcement_id}"},
            )

            if response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {response.text}")

            # 공지사항을 찾을 수 없는 경우 404 반환
            if not response.json():
                return Response(
                    {"message": "공지사항을 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(
                {"message": "공지사항이 삭제되었습니다."},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(
                f"=== ADMIN ANNOUNCEMENT DELETE ERROR ===\n{error}\n======================================="
            )
            return Response(
                {"message": "공지사항 삭제 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
    def patch(self, request, announcement_id):
        """
        공지사항 수정
        PATCH /api/v1/admin/announcements/{announcement_id}/
        - Authorization 헤더의 access_token으로 관리자 권한 확인
        - title, content, category 중 하나 이상을 받아 Supabase announcements 테이블에서 해당 공지사항 수정
        - 수정된 announcement_id, updated_at과 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 값 추출
        title = request.data.get("title", "").strip()
        content = request.data.get("content", "").strip()
        category = request.data.get("category", "").strip()  # 선택값

        # title, content, category 중 하나 이상 필요
        if not any([title, content, category]):
            return Response(
                {"message": "title, content, category 중 하나 이상 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

            # 수정할 필드만 업데이트 데이터에 포함
            update_data = {}
            if title:
                update_data["title"] = title
            if content:
                update_data["content"] = content
            if category:
                update_data["category"] = category

            # 수정 시간 추가
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

            # Supabase announcements 테이블에서 공지사항 수정
            response = requests.patch(
                f"{supabase_url}/rest/v1/announcements",
                headers={**headers, "Prefer": "return=representation"},
                params={"announcement_id": f"eq.{announcement_id}"},
                json=update_data,
            )

            if response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {response.text}")

            # 존재하지 않는 공지사항인 경우 404 반환
            if not response.json():
                return Response(
                    {"message": "존재하지 않는 공지사항입니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            announcement = response.json()[0]

            return Response(
                {
                    "message": "공지사항이 수정되었습니다.",
                    "announcement_id": announcement.get("announcement_id"),
                    "updated_at": announcement.get("updated_at"),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== ADMIN ANNOUNCEMENT UPDATE ERROR ===\n{error}\n=======================================")
            return Response(
                {"message": "공지사항 수정 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
class AdminUserView(APIView):
    """전체 유저 조회 API (관리자 전용)"""

    def get(self, request):
        """
        전체 유저 조회
        GET /api/v1/admin/users/
        Query Params:
            - page_number (int, optional): 페이지 번호 (기본값: 1)
            - page_size (int, optional): 페이지당 유저 수 (기본값: 20)
            - search_keyword (str, optional): 유저명(user_name) 검색어
        Response:
            - success (bool)
            - message (str)
            - data.users (list): 유저 목록
            - data.total_pages (int): 전체 페이지 수
        """
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 관리자 권한 검증
            user = get_user_from_token(access_token)
            if not user:
                return Response(
                    {"message": "유효하지 않은 토큰입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            role = user.get("user_metadata", {}).get("role", "")
            if role != "admin":
                return Response(
                    {"message": "관리자 권한이 필요합니다."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Query Params 파싱
            page_number = int(request.query_params.get("page_number", 1))
            page_size = int(request.query_params.get("page_size", 20))
            search_keyword = request.query_params.get("search_keyword", "").strip()

            # 페이지 범위 계산
            range_start = (page_number - 1) * page_size

            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase users 테이블에서 유저 목록 조회
            params = {
                "select": "user_id,user_name, coin, gender, age",
                "order": "user_name.desc",
                "offset": range_start,
                "limit": page_size,
            }

            # 검색어가 있으면 이메일 또는 닉네임 필터 추가
            if search_keyword:
                params["user_name"] = f"ilike.*{search_keyword}*"

            response = requests.get(
                f"{supabase_url}/rest/v1/users",
                headers={**headers, "Prefer": "count=exact"},
                params=params,
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            # Content-Range 헤더에서 전체 유저 수 추출 (e.g. "0-19/100")
            content_range = response.headers.get("Content-Range", "0/0")
            total_count = int(content_range.split("/")[-1]) if "/" in content_range else 0
            total_pages = (total_count + page_size - 1) // page_size  # 올림 나눗셈

            return Response(
                {
                    "message": "유저 목록 조회 성공",
                    "data": {
                        "users": response.json(),
                        "total_pages": total_pages,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== ADMIN USER LIST ERROR ===\n{error}\n=============================")
            return Response(
                {"success": False, "message": "유저 목록 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
