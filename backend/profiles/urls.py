from django.urls import path
from .views import ProfileView, AttendanceView

# 프로필 및 설정 관련 앱
# /api/v1/profile/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("", ProfileView.as_view(), name="profile"),    # 프로필 조회
    path("attendance/", AttendanceView.as_view(), name="attendance"),   #출석 체크
]
