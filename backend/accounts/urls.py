from django.urls import path
from .views import CheckEmailView, SignupView, LoginView, LogoutView, ChangePasswordView

# 인증 관련 URL 패턴
# /api/v1/auth/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("check-email", CheckEmailView.as_view(), name="check-email"),      # 이메일 중복 확인
    path("signup", SignupView.as_view(), name="signup"),                    # 일반 회원가입
    path("login", LoginView.as_view(), name="login"),                       # 일반 로그인
    path("logout", LogoutView.as_view(), name="logout"),                    # 일반 로그아웃
    path("password", ChangePasswordView.as_view(), name="change-password"), # 비밀번호 변경
]
