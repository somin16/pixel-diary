// src/api/authApi.js
// 공지사항/일기 등 다른 도메인과 동일하게 utils/AuthHelper의 authFetch를 그대로 사용
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL; // 다른 파일과 변수명 통일 (VITE_API_BASE_URL이 아님)

export const authApi = {
  // 이메일 중복 확인 - 인증 불필요
  checkEmail: (userEmail) =>
    fetch(`${BASE_URL}/api/v1/auth/check-email/?user_email=${encodeURIComponent(userEmail)}`)
      .then(handleResponse),

  // 회원가입 - 인증 불필요
  signup: ({ user_email, user_name, password }) =>
    fetch(`${BASE_URL}/api/v1/auth/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email, user_name, password }),
    }).then(handleResponse),

  // 일반 로그인 - 인증 불필요
  login: ({ user_email, password }) =>
    fetch(`${BASE_URL}/api/v1/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email, password }),
      credentials: 'include',
    }).then(handleResponse),

  // 네이버 로그인 - 인증 불필요 (AuthRedirect.jsx에서 호출)
  naverLogin: (code) =>
    fetch(`${BASE_URL}/api/v1/auth/naver/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(handleResponse),

  // 로그아웃 - authFetch가 토큰 자동 첨부
  logout: (refreshToken) =>
    authFetch(`${BASE_URL}/api/v1/auth/logout/`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // 비밀번호 변경 (로그인 상태에서) - 성공 시 새 토큰도 함께 응답으로 옴
  changePassword: ({ current_password, new_password }) =>
    authFetch(`${BASE_URL}/api/v1/auth/password/`, {
      method: 'PATCH',
      body: JSON.stringify({ current_password, new_password }),
    }),

  // 비밀번호 재설정 이메일 발송 - 인증 불필요
  resetPassword: (userEmail) =>
    fetch(`${BASE_URL}/api/v1/auth/password/reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail }),
    }).then(handleResponse),

  // 닉네임 변경
  changeUsername: (userName) =>
    authFetch(`${BASE_URL}/api/v1/auth/username/`, {
      method: 'PATCH',
      body: JSON.stringify({ user_name: userName }),
    }),

  // 회원 탈퇴 - body는 호출하는 쪽(Account.jsx)에서 로그인 수단에 맞게 구성해서 넘김
  withdraw: (body) =>
    authFetch(`${BASE_URL}/api/v1/auth/withdrawal/`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // 프로필 사진 변경
  updateProfileImage: (file) => {
    const formData = new FormData();
    formData.append('profile_image', file);
    return authFetch(`${BASE_URL}/api/v1/auth/userimage/`, {
      method: 'PATCH',
      body: formData,
    });
  },

  // 프로필 사진 초기화
  resetProfileImage: () =>
    authFetch(`${BASE_URL}/api/v1/auth/userimage/`, {
      method: 'DELETE',
    }),
};

// authFetch에는 이미 자체 에러 처리가 있으므로, 인증 불필요한 순수 fetch용 공통 응답 처리만 여기 둠
async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}
