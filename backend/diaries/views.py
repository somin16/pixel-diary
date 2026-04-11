import os
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


class DiaryView(APIView):
    """일기 작성 및 저장 API"""

    def post(self, request):
        """
        POST /api/v1/diaries
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - image_id, content를 받아 Supabase diaries 테이블에 저장
        - 저장된 diary_id와 완료 메시지 반환
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
        image_id = request.data.get("image_id", None)  # iamge_id는 현재 선택사항 입니다. (넣지 않아도 작동에 문제가 없습니다.)
        content = request.data.get("content", "").strip()

        if not content:
            return Response(
                {"message": "content는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # 나중에 이미지 생성 기능이 구현되어 image_id가 생기면 아래 코드로 교체
        # image_id = request.data.get("image_id", "").strip()
        # content = request.data.get("content", "").strip()

        # if not all([image_id, content]):
        #     return Response(
        #         {"message": "image_id와 content는 필수입니다."},
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )

        # 글자수 제한 (테스트: 10자, 실제 서비스 시 변경 예정)
        if len(content) > 10:
            return Response(
                {"message": "일기는 10자 이하로 작성해주세요."},
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
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # Supabase diaries 테이블에 일기 저장
            response = requests.post(
                f"{supabase_url}/rest/v1/diaries",
                headers={**headers, "Prefer": "return=representation"},  # 저장된 데이터 반환
                json={
                    "user_id": user_id,
                    "image_id": image_id,
                    "content": content,
                },
            )

            # 저장 실패 시 예외 발생
            if response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {response.text}")

            diary = response.json()[0]

            return Response(
                {
                    "diary_id": diary.get("id"),
                    "message": "일기가 성공적으로 저장되었습니다.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== DIARY CREATE ERROR ===\n{error}\n=========================")
            return Response(
                {"message": "일기 저장 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
