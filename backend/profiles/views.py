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


class ProfileView(APIView):
    """프로필 조회 API"""

    def get(self, request):
        """
        GET /api/v1/profile/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 이메일, 닉네임은 Supabase Auth에서 조회
        - 코인, 게임 최고 점수는 users 테이블에서 조회
        - 유저 정보 반환
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

            user_id = user.get("id")
            email = user.get("email")
            user_name = user.get("user_metadata", {}).get("user_name")

            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # users 테이블에서 코인, 게임 최고 점수 조회
            user_response = requests.get(
                f"{supabase_url}/rest/v1/users",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "coin,game_top_score",
                },
            )

            # 오류 방지 방어 코드
            if user_response.status_code != 200 or not user_response.json():
                return Response(
                    {"message": "유저 정보를 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            user_data = user_response.json()[0]

            return Response(
                {
                    "email": email,
                    "name": user_name,
                    "coin": user_data.get("coin"),
                    "game_top_score": user_data.get("game_top_score"),
                    "message": "프로필 조회 성공",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== PROFILE ERROR ===\n{error}\n====================")
            return Response(
                {"message": "프로필 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
