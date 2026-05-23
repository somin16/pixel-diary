# Django REST Framework의 시리얼라이저 모듈
from rest_framework import serializers

# 점수 추가 시리얼라이저
class GameBaseScoreSerializer(serializers.Serializer):

    game_score = serializers.IntegerField(

        # 원래는 디폴트값이 있었지만, 이번엔 값이 있다 없다를 받기에 디폴트값을 지웠습니다
        required = False,
        min_value = 0,
        error_messages = {

            "invalid": "game_score는 숫자여야 합니다.",
            "min_value": "game_score는 0 이상이어야 합니다.",
        }
    )

    coin = serializers.IntegerField(
        required = False,
        min_value = 0,
        error_messages = {

            "invalid": "coin은 숫자여야 합니다.",
            "min_value": "coin은 0 이상이어야 합니다.",
        }
    )

# UserCoinSerializer는 보안을 위해 coin 필드 없이 공통 필드만 사용
class UserCoinSerializer(GameBaseScoreSerializer):
    pass