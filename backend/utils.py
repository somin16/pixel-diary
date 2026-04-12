import os
import requests


def extract_access_token(request):
    """
    Authorization 헤더에서 access_token 추출
    - 유효한 Bearer 토큰이면 access_token 반환
    - 유효하지 않으면 None 반환
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split("Bearer ")[1].strip()


def get_user_from_token(access_token):
    """
    access_token으로 Supabase에서 유저 정보 조회
    - 유효한 토큰이면 유저 정보 반환
    - 유효하지 않으면 None 반환
    """
    supabase_url = os.getenv("SUPABASE_URL")
    headers = {
        "apikey": os.getenv("SUPABASE_ANON_KEY"),
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    response = requests.get(f"{supabase_url}/auth/v1/user", headers=headers)

    if response.status_code == 200:
        return response.json()
    return None
