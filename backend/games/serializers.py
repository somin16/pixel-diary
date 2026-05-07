# Django REST Framework의 시리얼라이저 모듈
from rest_framework import serializers

# 공통 game_score 필드를 가진 베이스 시리얼라이저
class GameBaseScoreSerializer(serializers.Serializer):
    game_score = serializers.IntegerField(
        required=False,
        default=0,
        min_value=0,
        error_messages={
            "invalid": "game_score는 숫자여야 합니다.",
            "min_value": "game_score는 0 이상이어야 합니다.",
        }
    )

# GameScoreSerializer는 공통 필드만 사용
class GameScoreSerializer(GameBaseScoreSerializer):
    pass

# UserCoinSerializer는 보안을 위해 coin 필드 없이 공통 필드만 사용
class UserCoinSerializer(GameBaseScoreSerializer):
    pass

# 티켓 사용 시 요청 데이터 검증 (item_id가 올바른 숫자인지 확인)
class TicketUseSerializer(serializers.Serializer):
    item_id = serializers.IntegerField(
        required=True,
        min_value=1,
        error_messages={
            "invalid": "item_id는 숫자여야 합니다.",
            "min_value": "item_id는 1 이상이어야 합니다.",
            "required": "item_id는 필수입니다.",
        }
    )