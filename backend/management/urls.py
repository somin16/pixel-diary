from django.urls import path
from .views import AdminItemView

# 관리자 관련 URL 패턴
# /api/v1/admin/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("items/", AdminItemView.as_view(), name="admin-items"),    # 아이템 추가 
]
