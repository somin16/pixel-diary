import { create } from 'zustand';

export const useAttendanceStore = create((set) => ({
  // 상태: 오늘 앱을 켜서 출석 DB 조회를 해봤는지 여부 (기본값: false)
  hasCheckedToday: false,

  // 액션: 조회를 완료한 후 상태를 true로 바꿔주는 함수
  setHasCheckedToday: (status) => set({ hasCheckedToday: status }),
}));