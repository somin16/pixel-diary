import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timezone, timedelta
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
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 필수값 추출 (앞뒤 공백 제거)
        image_id = request.data.get("image_id", None)  # image_id는 현재 선택사항 입니다. (넣지 않아도 작동에 문제가 없습니다.)
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

            # created_at을 한국 시간으로 변환해서 반환
            kst = timezone(timedelta(hours=9))
            created_at_str = diary.get("created_at")
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            created_at_kst = created_at.astimezone(kst).strftime("%Y-%m-%dT%H:%M:%S+09:00")

            return Response(
                {
                    "diary_id": diary.get("id"),
                    "created_at": created_at_kst,
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


class DiaryDetailView(APIView):
    """일기 상세 조회, 수정, 삭제 API"""

    def patch(self, request, diary_id):
        """
        PATCH /api/v1/diaries/{diary_id}
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - content를 받아 Supabase diaries 테이블에서 해당 일기 수정
        - 수정된 updated_at 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 content 추출
        content = request.data.get("content", "").strip()

        # content 누락 시 400 반환
        if not content:
            return Response(
                {"message": "content는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

            kst = timezone(timedelta(hours=9))
            now_kst = datetime.now(kst).strftime("%Y-%m-%dT%H:%M:%S+09:00")

            # 해당 일기가 본인 것인지 확인
            update_response = requests.patch(
                f"{supabase_url}/rest/v1/diaries?id=eq.{diary_id}&user_id=eq.{user_id}",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    "content": content,
                    "updated_at": now_kst,
                },
            )

            if update_response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {update_response.text}")

            # 빈 리스트면 일기가 없거나 본인 일기가 아닌 경우
            # Supabase PostgREST는 조건절(id, user_id)이 둘 다 맞아야 수정되므로
            # GET으로 먼저 확인할 필요 없이 PATCH 결과로 바로 확인 가능
            if not update_response.json():
                return Response(
                    {"message": "일기를 찾을 수 없거나 수정 권한이 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            
            updated_diary = update_response.json()[0]
            
            updated_at_str = updated_diary.get("updated_at")

            # updated_at이 NULL인 경우 created_at 사용
            if not updated_at_str:
                updated_at_str = updated_diary.get("created_at")

            # updated_at을 한국 시간으로 변환해서 반환
            updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
            updated_at_kst = updated_at.astimezone(kst).strftime("%Y-%m-%dT%H:%M:%S+09:00")

            return Response(
                {
                    "updated_at": updated_at_kst,
                    "message": "일기가 성공적으로 수정되었습니다.",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== DIARY UPDATE ERROR ===\n{error}\n=========================")
            return Response(
                {"message": "일기 수정 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, diary_id):
        """
        DELETE /api/v1/diaries/{diary_id}
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 해당 일기가 본인 것인지 확인 후 삭제
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

            user_id = user.get("id")
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # 해당 일기가 본인 것인지 확인
            delete_response = requests.delete(
                f"{supabase_url}/rest/v1/diaries?id=eq.{diary_id}&user_id=eq.{user_id}",
                headers={**headers, "Prefer": "return=representation"},
            )

            # 빈 리스트면 일기가 없거나 본인 일기가 아닌 경우
            # Supabase PostgREST는 조건절(id, user_id)이 둘 다 맞아야 수정되므로
            # GET으로 먼저 확인할 필요 없이 DELETE 결과로 바로 확인 가능
            if not delete_response.json():
                return Response(
                    {"message": "일기를 찾을 수 없거나 삭제 권한이 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # 삭제 실패 시 예외 발생
            if delete_response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {delete_response.text}")

            return Response(
                {"message": "일기가 삭제되었습니다."},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== DIARY DELETE ERROR ===\n{error}\n=========================")
            return Response(
                {"message": "일기 삭제 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
