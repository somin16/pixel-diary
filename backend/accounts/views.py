import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


def get_supabase_headers():
    return {
        "apikey": os.getenv("SUPABASE_SERVICE_KEY"),
        "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
        "Content-Type": "application/json",
    }


class CheckEmailView(APIView):
    """
    GET /api/v1/auth/check-email?user_email=user@example.com
    이메일 중복 여부 확인
    """

    def get(self, request):
        user_email = request.query_params.get("user_email", "").strip()

        if not user_email:
            return Response(
                {"message": "이메일을 입력해주세요.", "is_available": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase Admin API로 유저 목록 조회
            response = requests.get(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers,
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            users = response.json().get("users", [])
            existing_emails = [user.get("email") for user in users]
            is_available = user_email not in existing_emails

            message = "사용 가능한 이메일입니다." if is_available else "이미 사용 중인 이메일입니다."

            return Response(
                {"message": message, "is_available": is_available},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(f"=== CHECK EMAIL ERROR ===\n{e}\n========================")
            return Response(
                {"message": "이메일 확인 중 오류가 발생했습니다.", "is_available": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SignupView(APIView):
    """
    POST /api/v1/auth/signup
    일반 회원가입 (이메일, 비밀번호, 닉네임)
    """

    def post(self, request):
        user_email = request.data.get("user_email", "").strip()
        password = request.data.get("password", "").strip()
        user_name = request.data.get("user_name", "").strip()

        # 필수값 검증
        if not all([user_email, password, user_name]):
            return Response(
                {"message": "이메일, 비밀번호, 닉네임은 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"message": "비밀번호는 최소 8자 이상이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase Admin API로 유저 생성
            response = requests.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers,
                json={
                    "email": user_email,
                    "password": password,
                    "user_metadata": {"user_name": user_name},
                    "email_confirm": True,
                },
            )

            if response.status_code == 422:
                return Response(
                    {"message": "이미 사용 중인 이메일입니다."},
                    status=status.HTTP_409_CONFLICT,
                )

            if response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {response.text}")

            user = response.json()

            return Response(
                {"user_id": user.get("id"), "message": "회원가입이 완료되었습니다."},
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            print(f"=== SIGNUP ERROR ===\n{e}\n===================")
            return Response(
                {"message": "회원가입 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )