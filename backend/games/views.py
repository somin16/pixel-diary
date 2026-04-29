# 환경변수(.env 파일) 읽기 위한 기본 파이썬 모듈
import os

# 외부 API(Supabase)에 HTTP 요청 보낼 때 사용
import requests

# Django REST Framework - API 뷰를 클래스로 만들 때 사용
from rest_framework.views import APIView

# API 응답을 JSON 형태로 반환할 때 사용
from rest_framework.response import Response

# HTTP 상태코드 모음 (200, 201, 401, 500 등)
from rest_framework import status

# utils.py에서 토큰 관련 함수 가져오기
from utils import extract_access_token, get_user_from_token

# 시리얼라이저 가져오기
from .serializers import GameScoreSerializer # 게임 결과 저장 시리얼라이저
from .serializers import UserCoinSerializer # 보유 재화 조회 및 추가 시리얼라이저


def get_supabase_headers():
    """
    Supabase에 요청할 때 필요한 헤더 반환
    """
    return {
        # Supabase 서비스 키 (환경변수에서 읽어옴)
        "apikey": os.getenv("SUPABASE_SERVICE_KEY"),
        # Bearer 토큰 방식으로 인증
        "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
        # JSON 형식으로 데이터 주고받기
        "Content-Type": "application/json",
    }


class GameScoreView(APIView):

    "게임 결과 저장 api"

    # POST 요청이 오면 실행 (id = URL에서 받은 게임 번호)
    def post(self, request, id):

        """
        게임 결과 저장
        POST /api/v1/games/1/scores/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - game_score를 받아 Supabase game_result 테이블에 저장 
        - result_name,game_score,played_at,rank의 완료 메시지 반환
        """

        # ── 1. 토큰 추출 ──────────────────────────────────
        # Authorization 헤더에서 access_token 추출
        access_token = extract_access_token(request)

        # 토큰이 없으면 400 에러 반환
        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 토큰으로 Supabase에서 유저 정보 조회
        user = get_user_from_token(access_token)

        # 유저 정보가 없으면 401 에러 반환
        if not user:
            return Response(
                {"message": "유효하지 않은 토큰입니다."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 유저 ID 추출 (uuid 형식)
        user_id = user.get("id")

        # 유저 닉네임 추출
        user_name = user.get("user_metadata", {}).get("nickname", "유저")

        # ── 2. 시리얼라이저로 데이터 검증 ─────────────────
        # try 밖에 있어서 400 에러가 그대로 반환됨!
        serializer = GameScoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        game_score = serializer.validated_data["game_score"]

        try:
            # ── 3. Supabase에 게임 결과 저장 ──────────────────
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # game_result 테이블에 데이터 저장
            save_response = requests.post(
                f"{supabase_url}/rest/v1/game_result",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    "game_id": id,            # URL에서 받은 게임 번호
                    "user_id": user_id,       # 토큰에서 가져온 유저 ID (uuid)
                    "game_score": game_score, # 검증된 점수
                    "earned_coin": 0,         # 보상 재화 (나중에 공식 나오면 수정)
                },
            )

            # 저장 실패 시 예외 발생
            if save_response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {save_response.text}")

            # 저장된 데이터 첫 번째 항목 꺼내기
            saved = save_response.json()[0]

            # ── 4. 랭킹 계산 ──────────────────────────────────
            # 같은 game_id 에서 내 점수보다 높은 사람 수 조회
            rank_response = requests.get(
                f"{supabase_url}/rest/v1/game_result"
                f"?game_id=eq.{id}&game_score=gt.{game_score}&select=result_id",
                headers=headers,
            )
            # 나보다 높은 사람 수 + 1 = 내 등수
            rank = len(rank_response.json()) + 1

            # ── 5. 성공 응답 반환 ─────────────────────────────
            return Response(
                {                                   
                    "result_name": user_name,                    # 유저 닉네임
                    "game_score": str(saved.get("game_score")),  # 게임 점수
                    "played_at": saved.get("played_at"),         # 플레이 날짜
                    "rank": rank,                                # 등수
                    "message": "게임 결과 저장을 성공하였습니다.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as error:
            # 개발 중 오류 확인용 (개발 완료 후 삭제 예정)
            print(f"=== GAME SCORE ERROR ===\n{error}\n========================")
            return Response(
                {"message": "게임 점수 저장 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class UserCoinView(APIView):
    """보유 재화 추가 및 조회 API"""

    def patch(self, request):
        """
        PATCH api/v1/users/coins/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - game_score, coin을 받아서 재화 추가
        - 추가된 total_coin 반환
        """
        # ── 1. 토큰 추출 ──────────────────────────────────
        access_token = extract_access_token(request)

        if not access_token:
            return Response(
                {"message": "Authorization 헤더에 유효한 Bearer 토큰이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 2. 유저 조회 (시리얼라이저 검증 전에 먼저 수행) ──
        user = get_user_from_token(access_token)

        if not user:
            return Response(
                {"message": "유효하지 않은 토큰입니다."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = user.get("id")

        # ── 3. 시리얼라이저로 데이터 검증 ─────────────────
        serializer = AddUserCoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        game_score = serializer.validated_data["game_score"]
        coin = serializer.validated_data["coin"]

        try:
            supabase_url = os.getenv("SUPABASE_URL")
            headers = get_supabase_headers()

            # ── 4. 현재 코인 조회 ──────────────────────────
            get_response = requests.get(
                f"{supabase_url}/rest/v1/users?user_id=eq.{user_id}&select=coin",
                headers=headers,
            )

            if get_response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {get_response.text}")

            data = get_response.json()

            if not data:
                return Response(
                    {"message": "유저 정보를 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            current_coin = data[0].get("coin", 0)

            # ── 5. 코인 업데이트 ───────────────────────────
            # 나중에 game_score 환산 공식 나오면 여기 수정!
            total_coin = current_coin + coin

            update_response = requests.patch(
                f"{supabase_url}/rest/v1/users?user_id=eq.{user_id}",
                headers={**headers, "Prefer": "return=representation"},
                json={"coin": total_coin},
            )

            if update_response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {update_response.text}")

            # ── 6. 성공 응답 반환 ─────────────────────────
            return Response(
                {
                    "total_coin": total_coin,
                    "message": "재화가 추가되었습니다.",
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== ADD USER COIN ERROR ===\n{error}\n==========================")
            return Response(
                {"message": "재화 추가 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get(self, request):
        """
        보유 재화 조회 
        GET api/v1/users/coins/
        - Authorization 헤더의 access_token으로 현재 유저 확인
        - 현재 보유 coin 반환
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

        try:
            supabase_url = os.getenv("SUPABASE_URL") # Supabase URL 및 헤더 설정
            headers = get_supabase_headers()

            get_response = requests.get(
                f"{supabase_url}/rest/v1/users?user_id=eq.{user_id}&select=coin",
                headers=headers,
            )

            if get_response.status_code not in [200, 201]:
                raise Exception(f"Supabase API 오류: {get_response.text}")

            data = get_response.json()

            if not data:
                return Response(
                    {"message": "유저 정보를 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # 현재 보유 코인
            coin = data[0].get("coin", 0)

            return Response(
                {
                    "message": "보유 재화 조회 성공",
                    "coin": coin,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print(f"=== GET USER COIN ERROR ===\n{error}\n==========================")
            return Response(
                {"message": "재화 조회 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )        