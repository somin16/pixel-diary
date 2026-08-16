// src/hooks/mutations/useAuthMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { supabase } from '../../utils/SupabaseClient';
import { useProfileStore } from '../../stores/useProfileStore';

// 이메일 중복 확인 - onBlur 등 특정 시점에 수동 호출
export function useCheckEmail() {
  return useMutation({
    mutationFn: authApi.checkEmail,
  });
}

// 회원가입
export function useSignup() {
  return useMutation({ mutationFn: authApi.signup });
}

// 일반 로그인 - 성공/실패 후 처리는 컴포넌트에서 navigate로 담당
export function useLogin() {
  return useMutation({ mutationFn: authApi.login });
}

// 네이버 소셜 로그인 - AuthRedirect.jsx에서 직접 호출 (이 훅은 미사용, authApi.naverLogin을 바로 씀)
export function useNaverLogin() {
  return useMutation({ mutationFn: authApi.naverLogin });
}

// 로그아웃 - 백엔드 로그아웃 성공 시에만 로컬 세션/캐시 정리
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await authApi.logout(session.refresh_token);
      }
    },
    onSuccess: async () => {
      await supabase.auth.signOut({ scope: 'local' });
      sessionStorage.clear();
      queryClient.clear();
      useProfileStore.getState().clearProfile();
    },
  });
}

// 비밀번호 변경 - 성공 시 새 토큰으로 Supabase 세션 동기화
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: async (data) => {
      if (data?.access_token && data?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }
    },
  });
}

// 비밀번호 재설정 이메일 발송
export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

// 닉네임 변경 - 스토어 동기화는 호출부(Profile.jsx)에서 처리
export function useChangeUsername() {
  return useMutation({
    mutationFn: (userName) => authApi.changeUsername(userName),
  });
}

// 회원 탈퇴 - 성공 시 로컬 세션/캐시 정리
export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.withdraw, // body: { password } 또는 {}
    onSuccess: async () => {
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
      useProfileStore.getState().clearProfile();
    },
  });
}

// 프로필 사진 변경 - 스토어 동기화는 호출부(Profile.jsx)에서 처리
export function useUpdateProfileImage() {
  return useMutation({ mutationFn: authApi.updateProfileImage });
}

// 프로필 사진 초기화 - 스토어 동기화는 호출부(Profile.jsx)에서 처리
export function useResetProfileImage() {
  return useMutation({ mutationFn: authApi.resetProfileImage });
}
