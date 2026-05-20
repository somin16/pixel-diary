from django.urls import path
from .views import AIGenerateView

# AI 그림 생성 관련 URL 패턴
# /api/v1/ai-generate/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("", AIGenerateView.as_view(), name="ai-generate"),  # AI 그림 생성(임시 저장), 임시 이미지 삭제

]


