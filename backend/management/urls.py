from django.urls import path
from .views import AdminItemView
from .views import AdminAnnouncementView
from .views import AdminUserView

# 관리자 관련 URL 패턴
# /api/v1/admin/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("items/", AdminItemView.as_view(), name="admin-items"),    # 아이템 추가 
    path('announcements/', AdminAnnouncementView.as_view(), name="admin-announcements"),    # 공지사항 작성
    path("announcements/<int:announcement_id>/", AdminAnnouncementView.as_view(), name="admin-announcements-detail"),  # 공지사항 삭제, 수정
    path("users/", AdminUserView.as_view(), name="admin-users"),                    # 전체 유저 조회
    path("users/<str:user_id>/", AdminUserView.as_view(), name="admin-users-detail"),  # 유저 삭제(탈퇴)
]
