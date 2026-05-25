# Django에서 URL 경로를 만들 때 사용하는 도구
from django.urls import path

# 같은 폴더의 views.py에서 GameScoreView 가져오기
from .views import GameScoreView,TicketView

# URL 목록
urlpatterns = [
    # /api/v1/games/1/scores/ 처럼 숫자(id)를 받아서 GameScoreView로 연결
    path("games/<int:id>/scores/", GameScoreView.as_view(), name="game-score"),
    #티켓관련
    path("users/inventory/tickets/", TicketView.as_view(), name="ticket"),
]