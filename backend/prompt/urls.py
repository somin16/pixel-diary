from django.urls import path
from .views import PromptConvertView, PromptModifyView

# /api/v1/prompt/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("transform", PromptConvertView.as_view(), name="prompt-transform"),  # 일기 → 프롬프트 변환
    path("restyle", PromptModifyView.as_view(), name="prompt-restyle"),     # 프롬프트 추가 수정
]
