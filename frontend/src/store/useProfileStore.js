import { create } from 'zustand';
import { authFetch } from '../utils/AuthHelper';

export const useProfileStore = create((set, get) => ({
  nickname: "로딩중...",
  email: "불러오는 중...",
  profileImage: null,
  isFetched: false, // 데이터 로드 완료 상태

  // 프로필 데이터 조회
  fetchProfile: async () => {
    // 이미 데이터를 불러왔다면 API 중복 호출 방지
    if (get().isFetched) return; 

    try {
      const data = await authFetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/`,
        { method: "GET" }
      );
      
      set({
        nickname: data.name || "이름 없음",
        email: data.email || "이메일 없음",
        isFetched: true, 
      });
    } catch (error) {
      console.error("프로필 정보 로드 실패:", error);
      set({ nickname: "정보 없음", email: "오류 발생" });
    }
  },

  // 프로필 수정 후 상태 즉시 동기화
  updateProfileLocally: (newName, newImage) => {
    set({ nickname: newName, profileImage: newImage });
  },

  // 로그아웃 시 스토어 초기화 (메모리 정리)
  clearProfile: () => {
    set({
      nickname: "로딩중...",
      email: "불러오는 중...",
      profileImage: null,
      isFetched: false,
    });
  }
}));