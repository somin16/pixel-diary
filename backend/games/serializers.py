# Django REST Framework의 시리얼라이저 모듈
from rest_framework import serializers

class GameScoreSerializer(serializers.Serializer):
    # game_score 필드 - 정수형, 기본값 null
    game_score = serializers.IntegerField(
        required=False,   # 키가 없어도 됨
        default=None,     # 기본값은 null
        allow_null=True,  # null 허용 (검증은 views.py에서 따로 함)
        min_value=0,      # 0 이상이어야 함
        error_messages={
            "invalid": "game_score는 숫자여야 합니다.",
            "min_value": "game_score는 0 이상이어야 합니다.",
        }
    )