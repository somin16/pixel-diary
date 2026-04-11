from django.urls import path
from .views import DiaryView

# 일기 관련 URL 패턴
# /api/v1/diaries/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("", DiaryView.as_view(), name="diaries"),  # 일기 작성 및 저장
]
