from django.urls import path
from .views import PromptConvertView, PromptModifyView

urlpatterns = [
    path("convert", PromptConvertView.as_view(), name="prompt-convert"),  # 일기 → 프롬프트 변환
    path("modify", PromptModifyView.as_view(), name="prompt-modify"),     # 프롬프트 수정
]
