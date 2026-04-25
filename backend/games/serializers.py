# Django REST Framework의 시리얼라이저 모듈
from rest_framework import serializers

class GameScoreSerializer(serializers.Serializer):
    # game_score 필드 - 정수형, 기본값 null
    game_score = serializers.IntegerField(
        required=False,   # 키가 없어도 됨
        default=0,     # 기본값은 0
        min_value=0,      # 0 이상이어야 함
        error_messages={
            "invalid": "game_score는 숫자여야 합니다.",
            "min_value": "game_score는 0 이상이어야 합니다.",
        }
    )

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

# AddUserCoinSerializer는 공통 필드 + coin 추가
class AddUserCoinSerializer(GameBaseScoreSerializer):
    coin = serializers.IntegerField(
        required=False,
        default=0,
        min_value=0,
        error_messages={
            "invalid": "coin은 숫자여야 합니다.",
            "min_value": "coin은 0 이상이어야 합니다.",
        }
    )