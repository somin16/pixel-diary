import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import extract_access_token, get_user_from_token, get_supabase_headers


class ItemPurchaseView(APIView):
    """아이템 구매 API"""

    def post(self, request, item_id):
        """
        POST /api/v1/items/{item_id}/purchase/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - item_count를 받아 인벤토리에 아이템 추가
        - 구매한 item_id, current_coin, inventory_id 반환
        """
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 요청 Body에서 item_count 추출 (기본값 1)
        item_count = request.data.get("item_count", 1)

        # item_count 유효성 검증
        if not isinstance(item_count, int) or item_count < 1:
            return Response(
                {"message": "item_count는 1 이상의 정수여야 합니다."},
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

            # 아이템 정보 조회
            item_response = requests.get(
                f"{supabase_url}/rest/v1/items",
                headers=headers,
                params={
                    "item_id": f"eq.{item_id}",
                    "select": "item_id,item_price,item_stackable",
                },
            )

            if item_response.status_code != 200 or not item_response.json():
                return Response(
                    {"message": "아이템을 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            item = item_response.json()[0]
            item_stackable = item.get("item_stackable")
            item_price = item.get("item_price")

            # item_stackable이 False인 경우 중복 구매 제한
            if not item_stackable:
                existing_response = requests.get(
                    f"{supabase_url}/rest/v1/inventory",
                    headers=headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "item_id": f"eq.{item_id}",
                        "select": "inventory_id",
                    },
                )

                if existing_response.json():
                    return Response(
                        {"message": "이미 보유한 아이템입니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # 관리자 권한 확인
            role = user.get("user_metadata", {}).get("role", "")
            is_admin = role == "admin"

            if not is_admin:
                # 일반 유저인 경우 코인 잔액 확인
                user_response = requests.get(
                    f"{supabase_url}/rest/v1/users",
                    headers=headers,
                    params={"user_id": f"eq.{user_id}", "select": "coin"},
                )

                if user_response.status_code != 200 or not user_response.json():
                    return Response(
                        {"message": "유저 정보를 찾을 수 없습니다."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                current_coin = user_response.json()[0].get("coin")

                # 코인 잔액 확인
                if current_coin < item_price * item_count:
                    return Response(
                        {"message": "코인이 부족합니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # item_stackable이 True인 경우 기존 인벤토리 확인 후 item_count 증가
            # item_stackable이 False인 경우 중복 구매 제한
            if item_stackable:
                existing_response = requests.get(
                    f"{supabase_url}/rest/v1/inventory",
                    headers=headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "item_id": f"eq.{item_id}",
                        "select": "inventory_id,item_count",
                    },
                )

                if existing_response.json():
                    # 기존 row가 있으면 item_count 증가
                    existing = existing_response.json()[0]
                    inventory_response = requests.patch(
                        f"{supabase_url}/rest/v1/inventory?inventory_id=eq.{existing.get('inventory_id')}",
                        headers={**headers, "Prefer": "return=representation"},
                        json={"item_count": existing.get("item_count") + item_count},
                    )
                else:
                    # 기존 row가 없으면 새로 생성
                    inventory_response = requests.post(
                        f"{supabase_url}/rest/v1/inventory",
                        headers={**headers, "Prefer": "return=representation"},
                        json={
                            "user_id": user_id,
                            "item_id": item_id,
                            "item_count": item_count,
                        },
                    )
            else:
                # item_stackable이 False인 경우 새로 생성
                inventory_response = requests.post(
                    f"{supabase_url}/rest/v1/inventory",
                    headers={**headers, "Prefer": "return=representation"},
                    json={
                        "user_id": user_id,
                        "item_id": item_id,
                        "item_count": item_count,
                    },
                )

            if inventory_response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {inventory_response.text}")

            inventory = inventory_response.json()[0]

            # 관리자가 아닌 경우에만 코인 차감
            if not is_admin:
                updated_coin = current_coin - item_price * item_count
                requests.patch(
                    f"{supabase_url}/rest/v1/users?user_id=eq.{user_id}",
                    headers=headers,
                    json={"coin": updated_coin},
                )
            else:
                updated_coin = None  # 관리자는 코인 차감 없음

            return Response(
                {
                    "item_id": item_id,
                    "used_coin": item_price * item_count if not is_admin else None,  # 사용한 코인
                    "current_coin": updated_coin,  # 남은 코인
                    "inventory_id": inventory.get("inventory_id"),
                    "message": "아이템을 구매했습니다.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as error:
            print(f"=== ITEM PURCHASE ERROR ===\n{error}\n==========================")
            return Response(
                {"message": "아이템 구매 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InventoryView(APIView):
    """인벤토리 조회 API"""

    def get(self, request):
        """
        GET /api/v1/users/inventory/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 해당 유저의 인벤토리 목록 반환
        - 각 아이템의 item_id, item_count 반환
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

            # Supabase inventory 테이블에서 해당 유저의 인벤토리 조회
            response = requests.get(
                f"{supabase_url}/rest/v1/inventory",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "item_id,item_count",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            return Response(
                {
                    "items": response.json(),
                    "message": "보유한 아이템 목록입니다.",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== INVENTORY LIST ERROR ===\n{error}\n===========================")
            return Response(
                {"message": "인벤토리 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DecorationItemView(APIView):
    """꾸미기 아이템 목록 조회 API"""

    def get(self, request):
        """
        GET /api/v1/users/deco-item/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 해당 유저가 보유한 꾸미기 아이템(emoji, diary_theme, sticker) 목록 반환
        - item_type별로 분류하여 반환
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

            # 인벤토리에서 해당 유저의 아이템 목록 조회 후 items 테이블과 조인
            response = requests.get(
                f"{supabase_url}/rest/v1/inventory",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "item_id,item_count,items(item_id,item_name,item_type,item_image_url)",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Supabase API 오류: {response.text}")

            # 꾸미기 아이템 타입 필터링 및 분류
            decoration_types = ["emoji", "diary_theme", "sticker"]
            emojis = []
            diary_themes = []
            stickers = []

            for inventory_item in response.json():
                item = inventory_item.get("items")
                if not item or item.get("item_type") not in decoration_types:
                    continue

                item_data = {
                    "item_id": item.get("item_id"),
                    "name": item.get("item_name"),
                    "image_url": item.get("item_image_url"),
                    "item_count": inventory_item.get("item_count"),
                }

                if item.get("item_type") == "emoji":
                    emojis.append(item_data)
                elif item.get("item_type") == "diary_theme":
                    diary_themes.append(item_data)
                elif item.get("item_type") == "sticker":
                    stickers.append(item_data)

            return Response(
                {
                    "emojis": emojis,
                    "diary_themes": diary_themes,
                    "stickers": stickers,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== DECORATION ITEM LIST ERROR ===\n{error}\n==================================")
            return Response(
                {"message": "꾸미기 아이템 목록 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
