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
        
        
class ChangePasswordView(APIView):
    """비밀번호 변경 API"""
 
    def patch(self, request):
        """
        PATCH /api/v1/auth/password
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - current_password로 기존 비밀번호 검증 후 new_password로 변경
        - 변경 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출 (Bearer 토큰 방식)
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token = auth_header.split("Bearer ")[1].strip()
 
        # 요청 Body에서 필수값 추출 (앞뒤 공백 제거)
        current_password = request.data.get("current_password", "").strip()
        new_password = request.data.get("new_password", "").strip()
 
        # 필수값 누락 시 400 반환
        if not all([current_password, new_password]):
            return Response(
                {"message": "현재 비밀번호와 새 비밀번호는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # 새 비밀번호 최소 길이 검증 (8자 미만이면 400 반환)
        if len(new_password) < 8:
            return Response(
                {"message": "새 비밀번호는 최소 8자 이상이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # 현재 비밀번호와 새 비밀번호가 같은 경우 400 반환
        if current_password == new_password:
            return Response(
                {"message": "새 비밀번호는 현재 비밀번호와 달라야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
 
            # access_token으로 현재 유저 정보 조회
            user_headers = {
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            user_response = requests.get(
                f"{supabase_url}/auth/v1/user",
                headers=user_headers,
            )
 
            if user_response.status_code != 200:
                return Response(
                    {"message": "유효하지 않은 토큰입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            # 현재 유저 이메일 추출
            user_email = user_response.json().get("email")
 
            # 현재 비밀번호 검증 (로그인 시도로 확인)
            verify_headers = {
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Content-Type": "application/json",
            }
            verify_response = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers=verify_headers,
                json={"email": user_email, "password": current_password},
            )
 
            # 현재 비밀번호가 틀린 경우 401 반환
            if verify_response.status_code != 200:
                return Response(
                    {"message": "현재 비밀번호가 올바르지 않습니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            # Supabase Admin API로 비밀번호 변경
            admin_headers = get_supabase_headers()
            user_id = user_response.json().get("id")
            change_response = requests.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=admin_headers,
                json={"password": new_password},
            )
 
            # 비밀번호 변경 실패 시 예외 발생
            if change_response.status_code != 200:
                raise Exception(f"Supabase API 오류: {change_response.text}")
 
            # 새 비밀번호로 다시 로그인하여 새 토큰 발급
            new_token_response = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers=verify_headers,
                json={"email": user_email, "password": new_password},
            )
 
            # 새 토큰 발급 실패 시 예외 발생
            if new_token_response.status_code != 200:
                raise Exception(f"새 토큰 발급 오류: {new_token_response.text}")
 
            new_token_data = new_token_response.json()
 
            return Response(
                {
                    "message": "비밀번호가 변경되었습니다.",
                    "access_token": new_token_data.get("access_token"),
                    "refresh_token": new_token_data.get("refresh_token"),
                },
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== CHANGE PASSWORD ERROR ===\n{error}\n============================")
            return Response(
                {"message": "비밀번호 변경 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        

class WithdrawalView(APIView):
    """회원 탈퇴 API"""

    def post(self, request):
        """
        POST /api/v1/auth/withdrawal
        - Authorization 헤더의 access_token으로 사용자 식별
        - Body의 password로 본인 확인 후 계정 삭제
        """
        
        # 1. Authorization 헤더에서 access_token 추출
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token = auth_header.split("Bearer ")[1].strip()
        
        # 2. 요청 Body에서 password 추출
        password = request.data.get("password", "").strip()

        # Body에서 비밀번호 추출 및 검증 (비밀번호 누락 시 400 반환)
        if not password:
            return Response(
                {"message": "본인 확인을 위해 비밀번호가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_KEY") # 계정 삭제를 위해 Service Key 필요

            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}", # 관리자 권한으로 요청
                "Content-Type": "application/json",
            }

            # 3. 먼저 access_token을 사용하여 현재 사용자의 UID를 가져옴
            user_info_res = requests.get(
                f"{supabase_url}/auth/v1/user",
                headers={"apikey": os.getenv("SUPABASE_ANON_KEY"), "Authorization": f"Bearer {access_token}"}
            )

            if user_info_res.status_code != 200:
                return Response({"message": "유효하지 않은 토큰입니다."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = user_info_res.json().get("id")

            # 4. 비밀번호로 본인 계정 재검증 로직
            email = user_info_res.json().get("email")
            login_check = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers={"apikey": os.getenv("SUPABASE_ANON_KEY")},
                json={"email": email, "password": password}
            )

            #입력한 비밀번호가 일치하지 않을 경우 401 반환
            if login_check.status_code != 200:
                return Response({"message": "비밀번호가 일치하지 않습니다."}, status=status.HTTP_401_UNAUTHORIZED)

            # 5. Supabase Admin API를 통한 계정 삭제
            # 주의: 이 작업은 되돌릴 수 없으며 관련 데이터가 모두 삭제됩니다.
            delete_res = requests.delete(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=headers
            )


            # 계정 삭제 실패 시 예외 발생
            if delete_res.status_code not in [200, 204]:
                raise Exception(f"Supabase 계정 삭제 오류: {delete_res.text}")

            return Response(
                {"message": "회원 탈퇴가 완료되었습니다."},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== WITHDRAWAL ERROR ===\n{error}\n========================")
            return Response(
                {"message": "회원 탈퇴 중 오류가 발생했습니다."},

                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangeUsernameView(APIView):
    """유저 이름 변경 API"""
 
    def patch(self, request):
        """
        PATCH /api/v1/auth/username
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - user_name으로 닉네임 변경
        - 변경 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출 (Bearer 토큰 방식)
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token = auth_header.split("Bearer ")[1].strip()
 
        # 요청 Body에서 user_name 추출 (앞뒤 공백 제거)
        user_name = request.data.get("user_name", "").strip()
 
        # user_name 누락 시 400 반환
        if not user_name:
            return Response(
                {"message": "변경할 닉네임을 입력해주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
 
            # access_token으로 현재 유저 정보 조회
            user_headers = {
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            user_response = requests.get(
                f"{supabase_url}/auth/v1/user",
                headers=user_headers,
            )
 
            # 유효하지 않은 토큰인 경우 401 반환
            if user_response.status_code != 200:
                return Response(
                    {"message": "유효하지 않은 토큰입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            # 현재 유저 id 추출
            user_id = user_response.json().get("id")
 
            # Supabase Admin API로 닉네임 변경 (user_metadata에 저장)
            admin_headers = get_supabase_headers()
            change_response = requests.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=admin_headers,
                json={"user_metadata": {"user_name": user_name}},
            )
 
            # 닉네임 변경 실패 시 예외 발생
            if change_response.status_code != 200:
                raise Exception(f"Supabase API 오류: {change_response.text}")
 
            return Response(
                {"message": "유저 이름이 변경되었습니다."},
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== CHANGE USERNAME ERROR ===\n{error}\n============================")
            return Response(
                {"message": "유저 이름 변경 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserImageView(APIView):
    """프로필 사진 변경 / 기본 프로필 사진으로 변경 API"""
 
    def patch(self, request):
        """
        PATCH /api/v1/auth/userimage
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - profile_image 파일을 Supabase Storage에 업로드
        - 업로드된 이미지 URL과 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출 (Bearer 토큰 방식)
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token = auth_header.split("Bearer ")[1].strip()
 
        # 요청에서 이미지 파일 추출
        profile_image = request.FILES.get("profile_image")
 
        # 이미지 파일 누락 시 400 반환
        if not profile_image:
            return Response(
                {"message": "프로필 이미지를 첨부해주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
 
            # access_token으로 현재 유저 정보 조회
            user_headers = {
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            user_response = requests.get(
                f"{supabase_url}/auth/v1/user",
                headers=user_headers,
            )
 
            # 유효하지 않은 토큰인 경우 401 반환
            if user_response.status_code != 200:
                return Response(
                    {"message": "유효하지 않은 토큰입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            # 현재 유저 id 추출 후 저장 경로 설정 (유저별 고유 경로)
            user_id = user_response.json().get("id")
            file_extension = profile_image.name.split(".")[-1]
            file_path = f"{user_id}/profile.{file_extension}"
 
            # Supabase Storage에 이미지 업로드
            storage_headers = {
                "apikey": os.getenv("SUPABASE_SERVICE_KEY"),
                "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
                "Content-Type": profile_image.content_type,
                "x-upsert": "true",  # 같은 경로에 파일이 있으면 덮어쓰기
            }
            upload_response = requests.post(
                f"{supabase_url}/storage/v1/object/profiles/{file_path}",
                headers=storage_headers,
                data=profile_image.read(),
            )
 
            # 업로드 실패 시 예외 발생
            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Supabase Storage 오류: {upload_response.text}")
 
            # 업로드된 이미지의 공개 URL 생성
            image_url = f"{supabase_url}/storage/v1/object/public/profiles/{file_path}"
 
            # Supabase Admin API로 유저 메타데이터에 이미지 URL 저장
            admin_headers = get_supabase_headers()
            requests.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=admin_headers,
                json={"user_metadata": {"profile_image_url": image_url}},
            )
 
            return Response(
                {"image_url": image_url, "message": "프로필 사진이 변경되었습니다."},
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== CHANGE USER IMAGE ERROR ===\n{error}\n==============================")
            return Response(
                {"message": "프로필 사진 변경 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
 
    def delete(self, request):
        """
        DELETE /api/v1/auth/userimage
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - Supabase Storage에서 프로필 사진 삭제
        - 유저 메타데이터의 profile_image_url을 None으로 초기화
        - 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출 (Bearer 토큰 방식)
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token = auth_header.split("Bearer ")[1].strip()
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
 
            # access_token으로 현재 유저 정보 조회
            user_headers = {
                "apikey": os.getenv("SUPABASE_ANON_KEY"),
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            user_response = requests.get(
                f"{supabase_url}/auth/v1/user",
                headers=user_headers,
            )
 
            # 유효하지 않은 토큰인 경우 401 반환
            if user_response.status_code != 200:
                return Response(
                    {"message": "유효하지 않은 토큰입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            user_data = user_response.json()
            user_id = user_data.get("id")
 
            # 현재 프로필 사진 URL 확인
            profile_image_url = user_data.get("user_metadata", {}).get("profile_image_url")
 
            # 프로필 사진이 없는 경우 400 반환
            if not profile_image_url:
                return Response(
                    {"message": "이미 기본 프로필 사진입니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
 
            # Supabase Storage에서 프로필 사진 삭제
            # Storage 삭제 API는 파일 경로 배열을 JSON으로 전달해야 함
            storage_headers = get_supabase_headers()
            file_extension = profile_image_url.split(".")[-1]
            file_path = f"{user_id}/profile.{file_extension}"
 
            delete_response = requests.delete(
                f"{supabase_url}/storage/v1/object/profiles",
                headers=storage_headers,
                json={"prefixes": [file_path]},
            )
 
            # 삭제 실패 시 예외 발생
            if delete_response.status_code not in [200, 204]:
                raise Exception(f"Supabase Storage 오류: {delete_response.text}")
 
            # 유저 메타데이터의 profile_image_url을 None으로 초기화
            admin_headers = get_supabase_headers()
            requests.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=admin_headers,
                json={"user_metadata": {"profile_image_url": None}},
            )
 
            return Response(
                {"message": "기본 프로필 사진으로 변경되었습니다."},
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== DELETE USER IMAGE ERROR ===\n{error}\n==============================")
            return Response(
                {"message": "기본 프로필 사진 변경 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResetPasswordView(APIView):
    """비밀번호 재설정 이메일 발송 API"""
 
    def post(self, request):
        """
        POST /api/v1/auth/password/reset
        - 가입한 이메일을 받아 Supabase Auth로 비밀번호 재설정 링크 발송
        - 발송 완료 메시지 반환
        """
        # 요청 Body에서 이메일 추출 (앞뒤 공백 제거)
        user_email = request.data.get("user_email", "").strip()
 
        # 이메일 미입력 시 400 반환
        if not user_email:
            return Response(
                {"message": "이메일을 입력해주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # 이메일 형식 검증
        if not validate_email_format(user_email):
            return Response(
                {"message": "이메일 형식이 올바르지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_anon_headers()
 
            # Supabase Auth API로 비밀번호 재설정 이메일 발송
            response = requests.post(
                f"{supabase_url}/auth/v1/recover",
                headers=headers,
                json={"email": user_email},
            )
 
            # 실패 응답인 경우 예외 발생
            if response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {response.text}")
 
            return Response(
                {"message": "비밀번호 재설정 링크가 이메일로 발송되었습니다."},
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== RESET PASSWORD ERROR ===\n{error}\n===========================")
            return Response(
                {"message": "비밀번호 재설정 이메일 발송 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TokenRefreshView(APIView):
    """토큰 갱신 API"""
 
    def post(self, request):
        """
        POST /api/v1/auth/refresh
        - Body의 refresh_token으로 만료된 access_token 재발급
        - 갱신된 access_token 반환
        """
        # 요청 Body에서 refresh_token 추출 (앞뒤 공백 제거)
        refresh_token = request.data.get("refresh_token", "").strip()
 
        # refresh_token 누락 시 400 반환
        if not refresh_token:
            return Response(
                {"message": "refresh_token이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_anon_headers()
 
            # Supabase Auth API로 토큰 갱신 요청
            response = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=refresh_token",
                headers=headers,
                json={"refresh_token": refresh_token},
            )
 
            # 유효하지 않거나 만료된 refresh_token인 경우 401 반환
            if response.status_code == 400:
                return Response(
                    {"message": "유효하지 않거나 만료된 refresh_token입니다."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
 
            # 그 외 실패 응답인 경우 예외 발생
            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")
 
            data = response.json()
 
            return Response(
                {"access_token": data.get("access_token")},
                status=status.HTTP_200_OK,
            )
 
        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== TOKEN REFRESH ERROR ===\n{error}\n==========================")
            return Response(
                {"message": "토큰 갱신 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
