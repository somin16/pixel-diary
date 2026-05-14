from django.urls import path
from .views import DiaryView, DiaryDetailView, DiaryDecoView, DiaryImageGenerateView, DiaryGenerateView

# 일기 관련 URL 패턴
# /api/v1/diaries/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("", DiaryView.as_view(), name="diaries"),                                          # 일기 작성 및 저장
    path("generate/", DiaryGenerateView.as_view(), name="diary-generate-all"),              # 일기+프롬프트+이미지 통합 생성
    path("<int:diary_id>/", DiaryDetailView.as_view(), name="diary-detail"),                # 일기 수정/삭제, 상세 조회
    path("<int:diary_id>/deco/", DiaryDecoView.as_view(), name="diary-deco"),               # 일기 꾸미기
    path("<int:diary_id>/generate/", DiaryImageGenerateView.as_view(), name="diary-generate"),  # 이미지 생성
]
