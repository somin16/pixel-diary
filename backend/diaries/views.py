import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timezone, timedelta
from utils import extract_access_token, get_user_from_token, get_supabase_headers


def check_inventory_item(supabase_url, headers, user_id, item_id, expected_type, item_label):
    """
    인벤토리 보유 여부 및 아이템 타입 확인
    - 보유하지 않은 아이템이면 에러 메시지 반환
    - 타입이 다르면 에러 메시지 반환
    - 정상이면 None 반환
    """
    check = requests.get(
        f"{supabase_url}/rest/v1/inventory",
        headers=headers,
        params={
            "user_id": f"eq.{user_id}",
            "item_id": f"eq.{item_id}",
            "select": "inventory_id,items(item_type)",
        },
    )
    if not check.json():
        return f"보유하지 않은 {item_label} 아이템입니다."
    if check.json()[0].get("items", {}).get("item_type") != expected_type:
        return f"{item_label} 아이템이 아닙니다."
    return None


class DiaryView(APIView):
    """일기 작성 및 저장, 목록 조회 API"""

    def post(self, request):
        """
        일기 작성 및 저장
        POST /api/v1/diaries
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - image_id, content를 받아 Supabase diaries 테이블에 저장
        - 저장된 diary_id와 완료 메시지 반환
        - 같은 날짜에 일기를 중복으로 작성 불가 (중복 체크)
        """
        # Authorization 헤더에서 access_token 추출
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

            # 날짜 중복 체크
            # 같은 유저가 오늘 날짜에 이미 일기를 작성했는지 확인
            kst = timezone(timedelta(hours=9))      # 한국시간으로 변환
            today_kst = datetime.now(kst).strftime("%Y-%m-%d") # 한국시간 기준 오늘날짜 확인

            duplicate_check = requests.get(
                f"{supabase_url}/rest/v1/diaries",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "created_at": f"gte.{today_kst}T00:00:00+09:00",  # 오늘 00:00 이후
                    "select": "id",
                },
            )

            if duplicate_check.json():
                return Response(
                    {"message": "이미 오늘 작성한 일기가 있습니다."},
                    status=status.HTTP_409_CONFLICT,  # 409: 충돌 (중복)
                )

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
            diary_id = diary.get("id")

            # image_id가 있으면 al_image.diary_id 업데이트 (AI 그림과 일기 연결)
            if image_id:
                requests.patch(
                    f"{supabase_url}/rest/v1/al_image?id=eq.{image_id}&user_id=eq.{user_id}",
                    headers=headers,
                    json={"diary_id": diary_id},
                )

            # created_at을 한국 시간으로 변환해서 반환
            kst = timezone(timedelta(hours=9))
            created_at_str = diary.get("created_at")
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            created_at_kst = created_at.astimezone(kst).strftime("%Y-%m-%dT%H:%M:%S+09:00")

            return Response(
                {
                    "diary_id": diary_id,
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
        
    def get(self, request):
        """
        일기 목록 조회
        GET /api/v1/diaries/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 해당 유저의 일기 목록을 최신순으로 반환
        - 각 일기의 diary_id, content, created_at 반환
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

            # Supabase diaries 테이블에서 해당 유저의 일기 목록 조회
            response = requests.get(
                f"{supabase_url}/rest/v1/diaries",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "select": "id,content,created_at",  # 이미지 기능 구현 후 image_id 추가 예정
                },
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            # 날짜 포맷 변환 및 응답 데이터 구성
            kst = timezone(timedelta(hours=9))
            diaries = []
            for diary in response.json():
                created_at_str = diary.get("created_at")
                created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                created_at_kst = created_at.astimezone(kst).strftime("%Y-%m-%dT%H:%M:%S+09:00")

                diaries.append({
                    "diary_id": diary.get("id"),
                    "content": diary.get("content"),
                    "created_at": created_at_kst,
                    # "image_url": diary.get("image_id"),  # 이미지 기능 구현 후 URL로 교체 예정
                })

            return Response(
                {"diaries": diaries},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            # 오류 발생 시 터미널에 출력 (개발 완료 후 삭제 예정)
            print(f"=== DIARY LIST ERROR ===\n{error}\n=========================")
            return Response(
                {"message": "일기 목록 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DiaryDetailView(APIView):
    """일기 상세 조회, 수정, 삭제 API"""

    def patch(self, request, diary_id):
        """
        일기 수정
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
        일기 삭제
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

            # 삭제 실패 시 예외 발생
            if delete_response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {delete_response.text}")

            # 빈 리스트면 일기가 없거나 본인 일기가 아닌 경우
            # Supabase PostgREST는 조건절(id, user_id)이 둘 다 맞아야 수정되므로
            # GET으로 먼저 확인할 필요 없이 DELETE 결과로 바로 확인 가능
            if not delete_response.json():
                return Response(
                    {"message": "일기를 찾을 수 없거나 삭제 권한이 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

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

    def get(self, request, diary_id):
        """
        일기 상세 조회
        GET /api/v1/diaries/{diary_id}/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 해당 일기의 내용, 생성일, 꾸미기 아이템 정보 반환
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

            # 해당 일기 조회 (본인 일기인지 확인)
            diary_response = requests.get(
                f"{supabase_url}/rest/v1/diaries",
                headers=headers,
                params={
                    "id": f"eq.{diary_id}",
                    "user_id": f"eq.{user_id}",
                    "select": "id,content,created_at",
                    # "select": "id,content,image_id,created_at",  # 이미지 기능 구현 후 활성화 예정
                },
            )

            if not diary_response.json():
                return Response(
                    {"message": "일기를 찾을 수 없거나 권한이 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            diary = diary_response.json()[0]

            # created_at을 한국 시간으로 변환
            kst = timezone(timedelta(hours=9))
            created_at_str = diary.get("created_at")
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            created_at_kst = created_at.astimezone(kst).strftime("%Y-%m-%dT%H:%M:%S+09:00")

            # diary_deco 테이블에서 꾸미기 정보 조회
            deco_response = requests.get(
                f"{supabase_url}/rest/v1/diary_deco",
                headers=headers,
                params={
                    "diary_id": f"eq.{diary_id}",
                    "select": "emoji_id,diary_theme_id,sticker_id",
                },
            )

            emotion_item = None
            theme_item = None
            sticker_list = []

            if deco_response.json():
                deco = deco_response.json()[0]
                emoji_id = deco.get("emoji_id")
                diary_theme_id = deco.get("diary_theme_id")
                sticker_id = deco.get("sticker_id")

                # emoji 아이템 정보 조회
                if emoji_id:
                    emoji_response = requests.get(
                        f"{supabase_url}/rest/v1/items",
                        headers=headers,
                        params={
                            "item_id": f"eq.{emoji_id}",
                            "select": "item_id",
                            # "select": "item_id,item_image_url",  # 이미지 추가 후 활성화 예정
                        },
                    )
                    if emoji_response.json():
                        emoji = emoji_response.json()[0]
                        emotion_item = {
                            "item_id": emoji.get("item_id"),
                            # "image_url": emoji.get("item_image_url"),  # 이미지 추가 후 활성화 예정
                        }

                # diary_theme 아이템 정보 조회
                if diary_theme_id:
                    theme_response = requests.get(
                        f"{supabase_url}/rest/v1/items",
                        headers=headers,
                        params={
                            "item_id": f"eq.{diary_theme_id}",
                            "select": "item_id,item_type",
                            # "select": "item_id,item_type,item_image_url",  # 이미지 추가 후 활성화 예정
                        },
                    )
                    if theme_response.json():
                        theme = theme_response.json()[0]
                        theme_item = {
                            "item_id": theme.get("item_id"),
                            "item_type": theme.get("item_type"),
                            # "image_url": theme.get("item_image_url"),  # 이미지 추가 후 활성화 예정
                        }

                # sticker 아이템 정보 조회
                if sticker_id:
                    sticker_item_ids = [s.get("item_id") for s in sticker_id]
                    if sticker_item_ids:
                        sticker_response = requests.get(
                            f"{supabase_url}/rest/v1/items",
                            headers=headers,
                            params={
                                "item_id": f"in.({','.join(map(str, sticker_item_ids))})",
                                "select": "item_id",
                                # "select": "item_id,item_image_url",  # 이미지 기능 구현 후 활성화 예정
                            },
                        )
                        # item_id별 아이템 정보 매핑
                        item_map = {item.get("item_id"): item for item in sticker_response.json()}
                        for s in sticker_id:
                            item = item_map.get(s.get("item_id"), {})
                            sticker_list.append({
                                "item_id": s.get("item_id"),
                                "pos_x": s.get("pos_x"),
                                "pos_y": s.get("pos_y"),
                                # "image_url": item.get("item_image_url"),  # 이미지 기능 구현 후 활성화 예정
                            })

            return Response(
                {
                    "diary_id": diary.get("id"),
                    "content": diary.get("content"),
                    # "image_url": diary.get("image_id"),  # 이미지 기능 구현 후 활성화 예정
                    "emotion_item": emotion_item,
                    "theme_item": theme_item,
                    "sticker": sticker_list,
                    "created_at": created_at_kst,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== DIARY DETAIL ERROR ===\n{error}\n=========================")
            return Response(
                {"message": "일기 상세 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DiaryDecoView(APIView):
    """일기 꾸미기, 꾸미기 초기화 API"""

    def post(self, request, diary_id):
        """
        POST /api/v1/diaries/{diary_id}/deco/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - emoji_id, diary_theme_id, sticker를 받아 diary_deco 테이블에 저장
        - 완료 메시지 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 값 추출
        emoji_id = request.data.get("emoji_id", None)
        diary_theme_id = request.data.get("diary_theme_id", None)
        sticker_list = request.data.get("sticker", [])

        # sticker 유효성 검증
        if not isinstance(sticker_list, list):
            return Response(
                {"message": "sticker는 리스트 형식이어야 합니다."},
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
            diary_response = requests.get(
                f"{supabase_url}/rest/v1/diaries",
                headers=headers,
                params={
                    "id": f"eq.{diary_id}",
                    "user_id": f"eq.{user_id}",
                    "select": "id",
                },
            )

            if not diary_response.json():
                return Response(
                    {"message": "일기를 찾을 수 없거나 권한이 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # emoji_id 확인
            if emoji_id:
                error = check_inventory_item(supabase_url, headers, user_id, emoji_id, "emoji", "이모티콘")
                if error:
                    return Response({"message": error}, status=status.HTTP_400_BAD_REQUEST)

            # diary_theme_id 확인
            if diary_theme_id:
                error = check_inventory_item(supabase_url, headers, user_id, diary_theme_id, "diary_theme", "일기장 테마")
                if error:
                    return Response({"message": error}, status=status.HTTP_400_BAD_REQUEST)

            # sticker 인벤토리 보유 및 타입 확인
            if sticker_list:
                sticker_ids = [sticker.get("item_id") for sticker in sticker_list]

                if not all(sticker_ids):
                    return Response(
                        {"message": "sticker의 각 항목에 item_id가 필요합니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # in 연산자로 한 번에 조회
                sticker_check = requests.get(
                    f"{supabase_url}/rest/v1/inventory",
                    headers=headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "item_id": f"in.({','.join(map(str, sticker_ids))})",
                        "select": "inventory_id,item_id,items(item_type)",
                    },
                )

                # 보유 여부 확인
                found_ids = {item.get("item_id") for item in sticker_check.json()}
                for sticker_id in sticker_ids:
                    if sticker_id not in found_ids:
                        return Response(
                            {"message": f"보유하지 않은 스티커 아이템입니다. (item_id: {sticker_id})"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                # 타입 확인
                for item in sticker_check.json():
                    if item.get("items", {}).get("item_type") != "sticker":
                        return Response(
                            {"message": f"스티커 아이템이 아닙니다. (item_id: {item.get('item_id')})"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

            # diary_deco 테이블에 저장 (기존 꾸미기가 있으면 수정, 없으면 새로 생성)
            existing_deco = requests.get(
                f"{supabase_url}/rest/v1/diary_deco",
                headers=headers,
                params={
                    "diary_id": f"eq.{diary_id}",
                    "select": "deco_id",
                },
            )

            if existing_deco.json():
                # 기존 꾸미기가 있으면 수정
                deco_id = existing_deco.json()[0].get("deco_id")
                deco_response = requests.patch(
                    f"{supabase_url}/rest/v1/diary_deco?deco_id=eq.{deco_id}",
                    headers={**headers, "Prefer": "return=representation"},
                    json={
                        "emoji_id": emoji_id,
                        "diary_theme_id": diary_theme_id,
                        "sticker_id": sticker_list,
                    },
                )
            else:
                # 없으면 새로 생성
                deco_response = requests.post(
                    f"{supabase_url}/rest/v1/diary_deco",
                    headers={**headers, "Prefer": "return=representation"},
                    json={
                        "diary_id": diary_id,
                        "emoji_id": emoji_id,
                        "diary_theme_id": diary_theme_id,
                        "sticker_id": sticker_list,
                    },
                )

            if deco_response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {deco_response.text}")

            return Response(
                {"message": "꾸미기 아이템 추가 성공."},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== DIARY DECO ERROR ===\n{error}\n=======================")
            return Response(
                {"message": "일기 꾸미기 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, diary_id):
        """
        DELETE /api/v1/diaries/{diary_id}/deco/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 해당 일기의 diary_deco 정보 삭제
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
            diary_response = requests.get(
                f"{supabase_url}/rest/v1/diaries",
                headers=headers,
                params={
                    "id": f"eq.{diary_id}",
                    "user_id": f"eq.{user_id}",
                    "select": "id",
                },
            )

            if not diary_response.json():
                return Response(
                    {"message": "일기를 찾을 수 없거나 권한이 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # diary_deco 테이블에서 해당 일기의 꾸미기 정보 삭제
            delete_response = requests.delete(
                f"{supabase_url}/rest/v1/diary_deco?diary_id=eq.{diary_id}",
                headers={**headers, "Prefer": "return=representation"},
            )

            if delete_response.status_code not in [200, 204]:
                raise Exception(f"Supabase API 오류: {delete_response.text}")

            if not delete_response.json():
                return Response(
                    {"message": "꾸미기 정보를 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(
                {"message": "해당 일기의 모든 꾸미기 아이템이 삭제되었습니다."},
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== DIARY DECO DELETE ERROR ===\n{error}\n==============================")
            return Response(
                {"message": "일기 꾸미기 초기화 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
