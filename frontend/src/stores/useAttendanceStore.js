import { create } from 'zustand';

export const useAttendanceStore = create((set) => ({
  // "오늘 출석 여부"가 아니라 "이번 세션에 홈에서 팝업을 띄울지 판단했는지"
  // 홈에서 출석 다이얼로그를 한 번 띄웠다면 홈으로 다시 갔을 때 출석 다이얼로그를 띄우지 않음
  hasPromptedThisSession: false,
  setHasPromptedThisSession: (status) => set({ hasPromptedThisSession: status }),
}));