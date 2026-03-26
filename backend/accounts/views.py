import os
import re
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


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


def get_supabase_anon_headers():
    """
    Supabase 로그인 API 요청에 필요한 헤더 반환
    - 로그인은 anon key를 사용
    """
    return {
        "apikey": os.getenv("SUPABASE_ANON_KEY"),
        "Content-Type": "application/json",
    }


def validate_email_format(email):
    """
    이메일 형식 유효성 검사
    - 정규식을 사용하여 이메일 형식인지 확인
    - 올바른 형식 예시: user@example.com
    - 반환값: 올바른 형식이면 True, 아니면 False
    """
    email_regex = r'^[a-zA-Z0-9.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))


class CheckEmailView(APIView):
    """이메일 중복 여부 확인 API"""

    def get(self, request):
        """
        GET /api/v1/auth/check-email?user_email=user@example.com
        - 쿼리 파라미터로 이메일을 받아 Supabase에 등록된 이메일인지 확인
        - 사용 가능 여부를 is_available(true/false)로 반환
        """
        # 쿼리 파라미터에서 이메일 추출 (앞뒤 공백 제거)
        user_email = request.query_params.get("user_email", "").strip()

        # 이메일 미입력 시 400 반환
        if not user_email:
            return Response(
                {"message": "이메일을 입력해주세요.", "is_available": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 이메일 형식 검증 (예: user@example.com 형식이 아니면 400 반환)
        if not validate_email_format(user_email):
            return Response(
                {"message": "이메일 형식이 올바르지 않습니다.", "is_available": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase Admin API로 전체 유저 목록 조회
            response = requests.get(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers,
            )

            # Supabase API 호출 실패 시 예외 발생
            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            # 등록된 유저 목록에서 이메일만 추출 후 중복 여부 확인
            users = response.json().get("users", [])
            existing_emails = [user.get("email") for user in users]
            is_available = user_email not in existing_emails

            # 중복 여부에 따라 메시지 설정
            message = "사용 가능한 이메일입니다." if is_available else "이미 사용 중인 이메일입니다."

            return Response(
                {"message": message, "is_available": is_available},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== CHECK EMAIL ERROR ===\n{error}\n========================")
            return Response(
                {"message": "이메일 확인 중 오류가 발생했습니다.", "is_available": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SignupView(APIView):
    """일반 회원가입 API"""

    def post(self, request):
        """
        POST /api/v1/auth/signup
        - 이메일, 비밀번호, 닉네임을 받아 Supabase Auth에 유저 생성
        - 생성된 유저의 ID와 완료 메시지 반환
        """
        # 요청 Body에서 필수값 추출 (앞뒤 공백 제거)
        user_email = request.data.get("user_email", "").strip()
        password = request.data.get("password", "").strip()
        user_name = request.data.get("user_name", "").strip()

        # 필수값(이메일, 비밀번호, 닉네임) 누락 시 400 반환
        if not all([user_email, password, user_name]):
            return Response(
                {"message": "이메일, 비밀번호, 닉네임은 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 이메일 형식 검증 (예: user@example.com 형식이 아니면 400 반환)
        if not validate_email_format(user_email):
            return Response(
                {"message": "이메일 형식이 올바르지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 비밀번호 최소 길이 검증 (8자 미만이면 400 반환)
        if len(password) < 8:
            return Response(
                {"message": "비밀번호는 최소 8자 이상이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase Admin API로 유저 생성 (email_confirm=True: 이메일 인증 없이 바로 가입 처리)
            response = requests.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers,
                json={
                    "email": user_email,
                    "password": password,
                    "user_metadata": {"user_name": user_name},  # 닉네임은 메타데이터로 저장
                    "email_confirm": True,
                },
            )

            # 이미 등록된 이메일인 경우 409 반환
            if response.status_code == 422:
                return Response(
                    {"message": "이미 사용 중인 이메일입니다."},
                    status=status.HTTP_409_CONFLICT,
                )

            # 그 외 실패 응답인 경우 예외 발생
            if response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {response.text}")

            user = response.json()

            return Response(
                {"user_id": user.get("id"), "message": "회원가입이 완료되었습니다."},
                status=status.HTTP_201_CREATED,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== SIGNUP ERROR ===\n{error}\n===================")
            return Response(
                {"message": "회원가입 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        

class LoginView(APIView):
    """일반 로그인 API"""
 
    def post(self, request):
        """
        POST /api/v1/auth/login
        - 이메일, 비밀번호를 받아 Supabase Auth로 로그인
        - 로그인 성공 시 access_token, refresh_token 반환
        """
        # 요청 Body에서 필수값 추출 (앞뒤 공백 제거)
        user_email = request.data.get("user_email", "").strip()
        password = request.data.get("password", "").strip()
 
        # 필수값(이메일, 비밀번호) 누락 시 400 반환
        if not all([user_email, password]):
            return Response(
                {"message": "이메일과 비밀번호는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # 이메일 형식 검증 (예: user@example.com 형식이 아니면 400 반환)
        if not validate_email_format(user_email):
            return Response(
                {"message": "이메일 형식이 올바르지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_anon_headers()
 
            # Supabase Auth API로 로그인 요청
            response = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers=headers,
                json={
                    "email": user_email,
                    "password": password,
                },
            )
 
            # 이메일 또는 비밀번호가 틀린 경우 401 반환
            if response.status_code == 400:
                return Response(
                    {"message": "이메일 또는 비밀번호가 올바르지 않습니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            # 그 외 실패 응답인 경우 예외 발생
            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")
 
            data = response.json()
 
            return Response(
                {
                    "access_token": data.get("access_token"),
                    "refresh_token": data.get("refresh_token"),
                    "message": "로그인되었습니다.",
                },
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== LOGIN ERROR ===\n{error}\n==================")
            return Response(
                {"message": "로그인 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        

class LogoutView(APIView):
    """일반 로그아웃 API"""
 
    def post(self, request):
        """
        POST /api/v1/auth/logout
        - Authorization 헤더의 access_token과 Body의 refresh_token으로 토큰 무효화
        - 로그아웃 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출 (Bearer 토큰 방식)
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token = auth_header.split("Bearer ")[1].strip()
 
        # 요청 Body에서 refresh_token 추출
        refresh_token = request.data.get("refresh_token", "").strip()
 
        # refresh_token 누락 시 400 반환
        if not refresh_token:
            return Response(
                {"message": "refresh_token이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
 
            # 로그아웃은 access_token을 Authorization 헤더로 전달
            headers = {
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
 
            # Supabase Auth API로 토큰 무효화 요청
            response = requests.post(
                f"{supabase_url}/auth/v1/logout",
                headers=headers,
                json={"refresh_token": refresh_token},
            )
 
            # 그 외 실패 응답인 경우 예외 발생
            if response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {response.text}")
 
            return Response(
                {"message": "로그아웃되었습니다."},
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== LOGOUT ERROR ===\n{error}\n==================")
            return Response(
                {"message": "로그아웃 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )