from django.urls import path
from .views import AnnouncementListView, AnnouncementDetailView

# 공지사항 조회 관련 URL 패턴
# /api/v1/announcements/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("", AnnouncementListView.as_view(), name="announcements"), # 공지사항 목록 조회
    path("<int:announcement_id>/", AnnouncementDetailView.as_view(), name="announcements-detail"),  # 공지사항 상세 조회
]