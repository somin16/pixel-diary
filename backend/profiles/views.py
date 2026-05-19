import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils import extract_access_token, get_user_from_token, get_supabase_headers
from datetime import datetime, timezone, timedelta


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


# 일차별 보상 설정
ATTENDANCE_REWARDS = {      # 보상 수량은 현재 임시로 정해둔 것 입니다.
    1: {"coin": 100, "ticket": 0},
    2: {"coin": 100, "ticket": 0},
    3: {"coin": 100, "ticket": 0},
    4: {"coin": 150, "ticket": 0},
    5: {"coin": 200, "ticket": 1},
    6: {"coin": 250, "ticket": 2},
    7: {"coin": 300, "ticket": 3},
}
TICKET_ITEM_ID = 17     # items 테이블의 ticket 타입 아이템 ID

class AttendanceView(APIView):
    """출석 체크 및 보상, 출석 체크 기록 조회 API"""

    def post(self, request):
        """
        POST /api/v1/profile/attendance/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 오늘 출석 체크 정보 저장
        - 일차별 보상 (코인, 티켓) 지급
        - 7일차 완료 후 초기화
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

            # 한국 시간 기준 오늘 날짜
            kst = timezone(timedelta(hours=9))
            now_kst = datetime.now(kst)
            today = now_kst.date()

            # 출석 기록 조회
            attendance_response = requests.get(
                f"{supabase_url}/rest/v1/attendance",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "attendance_id,current_day,last_checked_at,start_date,attendance_dates",
                },
            )

            if attendance_response.status_code != 200:
                raise Exception(f"Supabase API 오류: {attendance_response.text}")

            attendance_data = attendance_response.json()

            if attendance_data:
                attendance = attendance_data[0]

                # 마지막 출석 시간 문자열을 한국 시간 기준 날짜로 변환
                last_checked_at_str = attendance.get("last_checked_at")
                last_checked_at = datetime.fromisoformat(last_checked_at_str.replace("Z", "+00:00")).astimezone(kst)
                last_checked_date = last_checked_at.date()
                
                # 시작일 문자열을 날짜 객체로 변환 (없으면 마지막 출석일 사용)
                start_date_str = attendance.get("start_date")
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else last_checked_date

                # 기존 출석 날짜 목록 가져오기
                attendance_dates = attendance.get("attendance_dates") or []

                # 오늘 이미 출석한 경우 400 반환
                if last_checked_date == today:
                    return Response(
                        {"message": "오늘 이미 출석 체크를 완료했습니다."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                
                # 첫 출석일로부터 7일이 지난 경우 초기화
                days_since_start = (today - start_date).days
                if days_since_start >= 7:
                    current_day = 1
                    start_date = today
                    attendance_dates = [str(today)]  # 초기화 후 오늘 날짜만
                else:
                    current_day = attendance.get("current_day")
                    if current_day >= 7:
                        current_day = 1
                        start_date = today
                        attendance_dates = [str(today)]  # 7일차 완료 후 초기화
                    else:
                        current_day += 1
                        attendance_dates.append(str(today))  # 오늘 날짜 추가

                # 출석 기록 업데이트
                requests.patch(
                    f"{supabase_url}/rest/v1/attendance?attendance_id=eq.{attendance.get('attendance_id')}",
                    headers=headers,
                    json={
                        "current_day": current_day,
                        "last_checked_at": now_kst.isoformat(),
                        "start_date": str(start_date),
                        "attendance_dates": attendance_dates,
                    },
                )

            else:
                # 첫 출석인 경우 새로 생성
                current_day = 1
                requests.post(
                    f"{supabase_url}/rest/v1/attendance",
                    headers=headers,
                    json={
                        "user_id": user_id,
                        "current_day": current_day,
                        "last_checked_at": now_kst.isoformat(),
                        "start_date": str(today),
                        "attendance_dates": [str(today)],
                    },
                )

            # 일차별 보상 계산
            reward = ATTENDANCE_REWARDS.get(current_day)
            coin_reward = reward.get("coin")
            ticket_reward = reward.get("ticket")

            # users 테이블에서 현재 코인 조회
            user_response = requests.get(
                f"{supabase_url}/rest/v1/users",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "coin",
                },
            )

            # 유저 데이터 확인
            user_data = user_response.json()
            if not user_data:
                return Response(
                    {"message": "사용자 정보를 찾을 수 없습니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            current_coin = user_data[0].get("coin")
            updated_coin = current_coin + coin_reward

            # 코인 업데이트
            coin_res = requests.patch(
                f"{supabase_url}/rest/v1/users?user_id=eq.{user_id}",
                headers=headers,
                json={"coin": updated_coin},
            )

            # 코인 지급 중 오류 발생
            if coin_res.status_code not in [200, 204]:
                return Response(
                    {"message": "보상 지급 중 오류가 발생했습니다."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            total_tickets = 0

            # 티켓 보상이 있는 경우 인벤토리에 추가
            if ticket_reward > 0:
                # 기존 티켓 인벤토리 확인
                existing_ticket = requests.get(
                    f"{supabase_url}/rest/v1/inventory",
                    headers=headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "item_id": f"eq.{TICKET_ITEM_ID}",
                        "select": "inventory_id,item_count",
                    },
                )

                if existing_ticket.json():
                    # 기존 티켓이 있으면 수량 증가
                    existing = existing_ticket.json()[0]
                    new_count = existing.get("item_count") + ticket_reward
                    ticket_res = requests.patch(
                        f"{supabase_url}/rest/v1/inventory?inventory_id=eq.{existing.get('inventory_id')}",
                        headers=headers,
                        json={"item_count": new_count},
                    )
                    if ticket_res.status_code not in [200, 204]:
                        return Response(
                            {"message": "티켓 지급 중 오류가 발생했습니다."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
                    total_tickets = new_count
                else:
                    # 없으면 새로 생성
                    ticket_res = requests.post(
                        f"{supabase_url}/rest/v1/inventory",
                        headers=headers,
                        json={
                            "user_id": user_id,
                            "item_id": TICKET_ITEM_ID,
                            "item_count": ticket_reward,
                        },
                    )
                    # 티켓 지급 중 오류 발생
                    if ticket_res.status_code not in [200, 201]:
                        return Response(
                            {"message": "티켓 지급 중 오류가 발생했습니다."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
                    total_tickets = ticket_reward

            else:
                # 티켓 보상이 없는 경우 현재 보유 티켓 수 조회
                existing_ticket = requests.get(
                    f"{supabase_url}/rest/v1/inventory",
                    headers=headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "item_id": f"eq.{TICKET_ITEM_ID}",
                        "select": "item_count",
                    },
                )
                if existing_ticket.json():
                    total_tickets = existing_ticket.json()[0].get("item_count")

            # 보상 목록 구성
            rewards = []
            rewards.append({"reward_type": "coin", "amount": coin_reward})
            if ticket_reward > 0:
                rewards.append({"reward_type": "ticket", "amount": ticket_reward})

            return Response(
                {
                    "attendance_date": str(today),
                    "current_day": current_day,
                    "reward": rewards,
                    "total_coin": updated_coin,
                    "total_tickets": total_tickets,
                    "message": "출석 체크 완료!",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== ATTENDANCE ERROR ===\n{error}\n=======================")
            return Response(
                {"message": "출석 체크 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get(self, request):
        """
        GET /api/v1/profile/attendance/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 출석 기록 조회 (출석 날짜 목록, 총 출석 횟수, 시작일 반환)
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

            # 출석 기록 조회
            attendance_response = requests.get(
                f"{supabase_url}/rest/v1/attendance",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "current_day,start_date,attendance_dates",
                },
            )

            if attendance_response.status_code != 200:
                raise Exception(f"Supabase API 오류: {attendance_response.text}")

            attendance_data = attendance_response.json()

            # 출석 기록이 없는 경우
            if not attendance_data:
                return Response(
                    {
                        "total_count": 0,
                        "week_start_date": None,
                        "attendance_dates": [],
                        "message": "출석 기록이 없습니다.",
                    },
                    status=status.HTTP_200_OK,
                )

            attendance = attendance_data[0]
            attendance_dates = attendance.get("attendance_dates") or []

            return Response(
                {
                    "total_count": len(attendance_dates),
                    "week_start_date": attendance.get("start_date"),
                    "attendance_dates": attendance_dates,
                    "message": "출석 기록 조회 성공",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== ATTENDANCE GET ERROR ===\n{error}\n===========================")
            return Response(
                {"message": "출석 기록 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
