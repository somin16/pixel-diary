from django.urls import path
from .views import PromptView

# /api/v1/prompt/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("", PromptView.as_view(), name="prompt"),  # POST: 프롬프트 변환 / PATCH: 프롬프트 수정
]
