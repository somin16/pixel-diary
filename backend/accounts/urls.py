from django.urls import path
from .views import CheckEmailView, SignupView, LoginView, LogoutView, ChangePasswordView, WithdrawalView, ChangeUsernameView, UserImageView, ResetPasswordView, TokenRefreshView, NaverLoginView

# 인증 관련 URL 패턴
# /api/v1/auth/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("check-email/", CheckEmailView.as_view(), name="check-email"),          # 이메일 중복 확인
    path("signup/", SignupView.as_view(), name="signup"),                        # 일반 회원가입
    path("login/", LoginView.as_view(), name="login"),                           # 일반 로그인
    path("logout/", LogoutView.as_view(), name="logout"),                        # 일반 로그아웃
    path("password/", ChangePasswordView.as_view(), name="change-password"),     # 비밀번호 변경
    path("password/reset/", ResetPasswordView.as_view(), name="reset-password"), # 비밀번호 재설정
    path("withdrawal/", WithdrawalView.as_view(), name='withdrawal'),            # 일반 회원탈퇴
    path("username/", ChangeUsernameView.as_view(), name="change-username"),     # 유저 이름 변경
    path("userimage/", UserImageView.as_view(), name="userimage"),               # 프로필 사진 변경 / 기본으로 변경
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),          # 토큰 갱신
    path("naver/", NaverLoginView.as_view(), name="naver-login"),                # 네이버 로그인
]
