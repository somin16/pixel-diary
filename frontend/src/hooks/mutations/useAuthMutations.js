// src/hooks/mutations/useAuthMutations.js
//
// 로그인/회원가입/탈퇴 등은 전부 "실행·변경" 동작이라 useMutation이 맞고,
// 그래서 폴더도 queries가 아닌 mutations에 위치함
// (queries 폴더는 나중에 유저 정보 조회 같은 GET용 useQuery 훅을 위한 자리)
//
// 에러 처리는 화면을 통째로 바꿀 필요가 없으므로,
// isError로 조건부 렌더링하기보다 각 mutate 호출부의 onError 콜백(토스트 등)에서 처리
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { supabase } from '../../utils/SupabaseClient';

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

// 닉네임 변경 - 캐시 갱신은 호출부(Profile.jsx)의 refetch()가 담당
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
    },
  });
}

// 프로필 사진 변경 - 캐시 갱신은 호출부(Profile.jsx)의 refetch()가 담당
export function useUpdateProfileImage() {
  return useMutation({ mutationFn: authApi.updateProfileImage });
}

// 프로필 사진 초기화 - 캐시 갱신은 호출부(Profile.jsx)의 refetch()가 담당
export function useResetProfileImage() {
  return useMutation({ mutationFn: authApi.resetProfileImage });
}
