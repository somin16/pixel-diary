from django.urls import path
from .views import PromptTransformView, PromptRestyleView

# /api/v1/prompt/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("transform", PromptTransformView.as_view(), name="prompt-transform"),  # 일기 → 프롬프트 변환
    path("restyle", PromptRestyleView.as_view(), name="prompt-restyle"),     # 프롬프트 추가 수정
]
