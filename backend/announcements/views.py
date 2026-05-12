import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import get_supabase_headers


class AnnouncementListView(APIView):
    """공지사항 목록 조회 API (공개)"""

    def get(self, request): # django의 APIView에서 모든 메서드는 request를 기본 파라미터로 받아야 에러가 안난다고 합니다 실제로는 request에 받는 값은 없습니다
        """
        GET /api/v1/announcements/
        - 토큰 불필요 (공개 데이터)
        - 전체 공지사항 목록 반환 (최신순)
        - announcement_id, title, category, view_count, created_at, updated_at 반환
        """
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase announcements 테이블에서 목록 조회 (최신순 정렬)
            response = requests.get(
                f"{supabase_url}/rest/v1/announcements",
                headers=headers,
                params={
                    "select": "announcement_id,title,content,category,view_count,created_at,updated_at",
                    "order": "created_at.desc",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            announcements = response.json()

            # content 앞 100자만 잘라서 preview로 내려줌
            for announcement in announcements:
                content = announcement.get("content", "")
                announcement["content_preview"] = content[:100]
                del announcement["content"]  # content 전체는 제거

            return Response(
                {
                    "announcements": announcements,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== ANNOUNCEMENT LIST ERROR ===\n{error}\n===============================")
            return Response(
                {"message": "공지사항 목록 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
class AnnouncementDetailView(APIView):
    """공지사항 상세 조회 API (공개)"""

    def get(self, request, announcement_id): # django의 APIView에서 모든 메서드는 request를 기본 파라미터로 받아야 에러가 안난다고 합니다 실제로는 request에 받는 값은 없습니다
        """
        GET /api/v1/announcements/{announcement_id}/
        - 토큰 불필요 (공개 데이터)
        - 특정 공지사항 상세 내용 반환
        - 조회 시 view_count 1 증가 (조회수)
        - announcement_id, title, content, category, view_count, created_at, updated_at 반환
        """
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # 해당 공지사항 존재 여부 확인
            response = requests.get(
                f"{supabase_url}/rest/v1/announcements",
                headers=headers,
                params={
                    "select": "announcement_id,title,content,category,view_count,created_at,updated_at",
                    "announcement_id": f"eq.{announcement_id}",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            data = response.json()

            # 공지사항을 찾을 수 없는 경우 404 반환
            if not data:
                return Response(
                    {"message": "공지사항을 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            announcement = data[0]

            # view_count 1 증가 (조회수)
            requests.patch(
                f"{supabase_url}/rest/v1/announcements",
                headers=headers,
                params={"announcement_id": f"eq.{announcement_id}"},
                json={"view_count": announcement["view_count"] + 1},
            )

            return Response(
                {
                    "message": "공지사항을 불러왔습니다.",
                    "announcement_id": announcement.get("announcement_id"),
                    "title": announcement.get("title"),
                    "content": announcement.get("content"),
                    "category": announcement.get("category"),
                    "view_count": announcement.get("view_count") + 1,  # 증가된 값 반환 (조회수)
                    "created_at": announcement.get("created_at"),
                    "updated_at": announcement.get("updated_at"),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== ANNOUNCEMENT DETAIL ERROR ===\n{error}\n=================================")
            return Response(
                {"message": "공지사항 상세 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )