import os
import copy
import random
import time
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timezone, timedelta
from utils import extract_access_token, get_user_from_token, get_supabase_headers
from prompt.views import call_llm_model_engine_type, FIXED_PREFIX, FIXED_SUFFIX, NEGATIVE_PROMPT


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
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 값 추출
        content = request.data.get("content", "").strip()
        image_id = request.data.get("image_id", None)                          # ▼ 이미지 URL (선택)
        positive_prompt = request.data.get("positive_prompt", None)            # ▼ 긍정 프롬프트 (선택)
        negative_prompt = request.data.get("negative_prompt", None)            # ▼ 부정 프롬프트 (선택)

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

            # Supabase diaries 테이블에 일기 저장
            response = requests.post(
                f"{supabase_url}/rest/v1/diaries",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    "user_id": user_id,
                    "content": content,
                    "image_id": image_id,
                    "positive_prompt": positive_prompt,
                    "negative_prompt": negative_prompt,
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
                    "select": "id,content,image_id,created_at",
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
                    "image_url": diary.get("image_id"),
                    "created_at": created_at_kst,
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

        # 요청 Body에서 값 추출
        content = request.data.get("content", "").strip()
        image_id = request.data.get("image_id", None)               # ▼ 이미지 URL (선택)
        positive_prompt = request.data.get("positive_prompt", None) # ▼ 긍정 프롬프트 (선택)
        negative_prompt = request.data.get("negative_prompt", None) # ▼ 부정 프롬프트 (선택)

        if not any([content, image_id, positive_prompt, negative_prompt]):
            return Response(
                {"message": "수정할 값이 없습니다."},
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

            # 수정할 필드만 포함
            update_data = {"updated_at": now_kst}
            if content:
                update_data["content"] = content
            if image_id is not None:
                update_data["image_id"] = image_id
            if positive_prompt is not None:
                update_data["positive_prompt"] = positive_prompt
            if negative_prompt is not None:
                update_data["negative_prompt"] = negative_prompt

            update_response = requests.patch(
                f"{supabase_url}/rest/v1/diaries?id=eq.{diary_id}&user_id=eq.{user_id}",
                headers={**headers, "Prefer": "return=representation"},
                json=update_data,
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
                    "select": "id,content,image_id,positive_prompt,negative_prompt,created_at",
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
                    "image_url": diary.get("image_id"),
                    "positive_prompt": diary.get("positive_prompt"),
                    "negative_prompt": diary.get("negative_prompt"),
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


class DiaryImageGenerateView(APIView):
    """ComfyUI 이미지 생성 및 Supabase Storage 저장 API"""

    COMFYUI_URL = "http://localhost:8188"
    STORAGE_BUCKET = "diary-images"

    # ▼ ComfyUI 워크플로우 (API format)
    # ▼ 모델: sd_xl_base_1.0.safetensors / LoRA: pixel-art-xl.safetensors
    WORKFLOW = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "12": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["4", 0],
                "clip": ["4", 1],
                "lora_name": "pixel-art-xl.safetensors",
                "strength_model": 0.8,
                "strength_clip": 1
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["12", 1], "text": ""}  # ▼ positive prompt 자리
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["12", 1], "text": ""}  # ▼ negative prompt 자리
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["12", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
                "seed": 0,          # ▼ 매 요청마다 랜덤 시드 적용
                "steps": 30,
                "cfg": 7,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "15": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["8", 0],
                "upscale_method": "nearest-exact",
                "width": 512, "height": 512, "crop": "disabled"
            }
        },
        "18": {
            "class_type": "ImageScale",
            "inputs": {
                "image": ["15", 0],
                "upscale_method": "nearest-exact",
                "width": 1024, "height": 1024, "crop": "disabled"
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"images": ["18", 0], "filename_prefix": "ComfyUI"}
        }
    }

    def post(self, request, diary_id):
        """
        POST /api/v1/diaries/{diary_id}/generate/
        - positive_prompt, negative_prompt를 ComfyUI에 전달해 이미지 생성
        - 생성된 이미지를 Supabase Storage에 업로드 (기존 이미지 덮어쓰기)
        - diaries 테이블의 image_id(URL) 업데이트

        Body: {
            "positive_prompt": "...",  (필수)
            "negative_prompt": "..."   (선택)
        }
        """
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_user_from_token(access_token)
        if not user:
            return Response(
                {"message": "유효하지 않은 토큰입니다."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = user.get("id")
        positive_prompt = request.data.get("positive_prompt", "").strip()
        negative_prompt = request.data.get("negative_prompt", "").strip()

        if not positive_prompt:
            return Response(
                {"message": "positive_prompt는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 1. 워크플로우에 프롬프트와 랜덤 시드 삽입
            workflow = copy.deepcopy(self.WORKFLOW)
            workflow["6"]["inputs"]["text"] = positive_prompt
            workflow["7"]["inputs"]["text"] = negative_prompt
            workflow["3"]["inputs"]["seed"] = random.randint(0, 2 ** 32 - 1)

            # 2. ComfyUI에 워크플로우 전송
            prompt_response = requests.post(
                f"{self.COMFYUI_URL}/prompt",
                json={"prompt": workflow}
            )
            if prompt_response.status_code != 200:
                raise Exception(f"ComfyUI 오류: {prompt_response.text}")

            prompt_id = prompt_response.json().get("prompt_id")

            # 3. 이미지 생성 완료까지 폴링 (5초 간격, 최대 5분)
            image_data = None
            for _ in range(60):
                time.sleep(5)
                history = requests.get(f"{self.COMFYUI_URL}/history/{prompt_id}").json()

                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for output in outputs.values():
                        if "images" in output:
                            img_info = output["images"][0]
                            image_data = requests.get(
                                f"{self.COMFYUI_URL}/view",
                                params={"filename": img_info["filename"], "type": img_info["type"]}
                            ).content
                            break
                    if image_data:
                        break

            if not image_data:
                raise Exception("이미지 생성 시간 초과 (5분)")

            # 4. Supabase Storage에 업로드 (같은 경로로 덮어쓰기)
            supabase_url = os.getenv("SUPABASE_URL")
            storage_headers = get_supabase_headers()
            storage_headers["Content-Type"] = "image/png"
            storage_headers["x-upsert"] = "true"  # ▼ 기존 이미지 덮어쓰기

            storage_path = f"{user_id}/{diary_id}.png"
            upload_response = requests.post(
                f"{supabase_url}/storage/v1/object/{self.STORAGE_BUCKET}/{storage_path}",
                headers=storage_headers,
                data=image_data,
            )

            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Storage 업로드 오류: {upload_response.text}")

            image_url = f"{supabase_url}/storage/v1/object/public/{self.STORAGE_BUCKET}/{storage_path}"

            # 5. diaries 테이블 업데이트
            update_response = requests.patch(
                f"{supabase_url}/rest/v1/diaries?id=eq.{diary_id}&user_id=eq.{user_id}",
                headers={**get_supabase_headers(), "Prefer": "return=representation"},
                json={
                    "image_id": image_url,
                    "positive_prompt": positive_prompt,
                    "negative_prompt": negative_prompt,
                },
            )

            if update_response.status_code not in [200, 204]:
                raise Exception(f"DB 업데이트 오류: {update_response.text}")

            return Response(
                {"image_url": image_url, "message": "이미지 생성 완료"},
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.ConnectionError:
            return Response(
                {"message": "ComfyUI 서버에 연결할 수 없습니다. ComfyUI가 실행 중인지 확인해주세요."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            print(f"=== IMAGE GENERATE ERROR ===\n{error}\n===========================")
            return Response(
                {"message": "이미지 생성 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DiaryGenerateView(APIView):
    """일기 작성 → 프롬프트 생성 → 이미지 생성 → 저장 통합 API"""

    COMFYUI_URL = "http://localhost:8188"
    STORAGE_BUCKET = "diary-images"

    WORKFLOW = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "12": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["4", 0], "clip": ["4", 1],
                "lora_name": "pixel-art-xl.safetensors",
                "strength_model": 0.8, "strength_clip": 1
            }
        },
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["12", 1], "text": ""}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["12", 1], "text": ""}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["12", 0], "positive": ["6", 0], "negative": ["7", 0],
                "latent_image": ["5", 0], "seed": 0, "steps": 30,
                "cfg": 7, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1
            }
        },
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "15": {"class_type": "ImageScale", "inputs": {"image": ["8", 0], "upscale_method": "nearest-exact", "width": 512, "height": 512, "crop": "disabled"}},
        "18": {"class_type": "ImageScale", "inputs": {"image": ["15", 0], "upscale_method": "nearest-exact", "width": 1024, "height": 1024, "crop": "disabled"}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["18", 0], "filename_prefix": "ComfyUI"}}
    }

    def post(self, request):
        """
        POST /api/v1/diaries/generate/
        - 일기 작성 → 프롬프트 생성 → ComfyUI 이미지 생성 → Supabase 저장 한 번에 처리

        Body: {
            "diary": "오늘 비가 왔다.",  (필수)
            "request": "고양이 추가",    (선택)
            "remove": "비를 없애줘"      (선택)
        }
        """
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_user_from_token(access_token)
        if not user:
            return Response(
                {"message": "유효하지 않은 토큰입니다."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = user.get("id")
        diary_content = request.data.get("diary", "").strip()
        user_request = request.data.get("request", "").strip()
        remove = request.data.get("remove", "").strip()

        if not diary_content:
            return Response(
                {"message": "diary를 입력해주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase_url = os.getenv("SUPABASE_URL")

            # 1. LLM으로 프롬프트 생성
            scene = call_llm_model_engine_type([{
                "role": "user",
                "content": (
                    f"You are an image prompt generator. Transform the following Korean diary entry into a natural English image generation prompt for ComfyUI pixel art.\n"
                    f"IMPORTANT: Your entire response must be in English only. Do NOT output any Korean text.\n"
                    f"Rules:\n"
                    f"- Write in natural descriptive phrases (not just keywords)\n"
                    f"- Up to 100 words, be vivid and expressive\n"
                    f"- Describe the scene, mood, characters, setting, weather, and atmosphere in detail\n"
                    f"- Do NOT use style words like 'pixel', 'pixelated', '8-bit', 'retro' in the scene description\n"
                    f"- Output the scene description only, no extra explanation\n\n"
                    f"Diary: {diary_content}"
                )
            }])

            if user_request:
                scene = call_llm_model_engine_type([{
                    "role": "user",
                    "content": (
                        f"You are given a scene description from an image generation prompt. Add or emphasize the requested element while keeping ALL original details.\n"
                        f"Output only the scene description in one line. No explanations, no extra text.\n"
                        f"Do NOT include any style tokens like '(pixel art:1.2)', '(medium shot:1.4)' or similar tags.\n"
                        f"Original scene: {scene}\n"
                        f"Additional request (may be in Korean): {user_request}\n"
                        f"Rules: natural descriptive English, under 100 words, one line only."
                    )
                }])

            positive_prompt = f"{FIXED_PREFIX}, {scene}, {FIXED_SUFFIX}"

            remove_keywords = ""
            if remove:
                remove_keywords = call_llm_model_engine_type([{
                    "role": "user",
                    "content": (
                        f"transform the following removal request into short English keywords for a ComfyUI negative prompt.\n"
                        f"Output only comma-separated English keywords, no explanation.\n"
                        f"Request (may be in Korean): {remove}"
                    )
                }])
            negative_prompt = f"{NEGATIVE_PROMPT}, {remove_keywords}" if remove_keywords else NEGATIVE_PROMPT

            # 2. ComfyUI 워크플로우에 프롬프트 삽입 후 전송
            workflow = copy.deepcopy(self.WORKFLOW)
            workflow["6"]["inputs"]["text"] = positive_prompt
            workflow["7"]["inputs"]["text"] = negative_prompt
            workflow["3"]["inputs"]["seed"] = random.randint(0, 2 ** 32 - 1)

            prompt_response = requests.post(
                f"{self.COMFYUI_URL}/prompt",
                json={"prompt": workflow}
            )
            if prompt_response.status_code != 200:
                raise Exception(f"ComfyUI 오류: {prompt_response.text}")

            prompt_id = prompt_response.json().get("prompt_id")

            # 4. 이미지 생성 완료까지 폴링 (5초 간격, 최대 5분)
            image_data = None
            for _ in range(60):
                time.sleep(5)
                history = requests.get(f"{self.COMFYUI_URL}/history/{prompt_id}").json()
                if prompt_id in history:
                    for output in history[prompt_id].get("outputs", {}).values():
                        if "images" in output:
                            img_info = output["images"][0]
                            image_data = requests.get(
                                f"{self.COMFYUI_URL}/view",
                                params={"filename": img_info["filename"], "type": img_info["type"]}
                            ).content
                            break
                    if image_data:
                        break

            if not image_data:
                raise Exception("이미지 생성 시간 초과 (5분)")

            # 3. Supabase Storage에 임시 업로드 (preview.png, upsert로 덮어쓰기)
            storage_headers = get_supabase_headers()
            storage_headers["Content-Type"] = "image/png"
            storage_headers["x-upsert"] = "true"

            storage_path = f"{user_id}/preview.png"
            upload_response = requests.post(
                f"{supabase_url}/storage/v1/object/{self.STORAGE_BUCKET}/{storage_path}",
                headers=storage_headers,
                data=image_data,
            )
            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Storage 업로드 오류: {upload_response.text}")

            image_url = f"{supabase_url}/storage/v1/object/public/{self.STORAGE_BUCKET}/{storage_path}"

            return Response(
                {
                    "image_url": image_url,
                    "positive_prompt": positive_prompt,
                    "negative_prompt": negative_prompt,
                },
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.ConnectionError:
            return Response(
                {"message": "ComfyUI 서버에 연결할 수 없습니다. ComfyUI가 실행 중인지 확인해주세요."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            print(f"=== DIARY GENERATE ERROR ===\n{error}\n============================")
            return Response(
                {"message": "이미지 생성 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
