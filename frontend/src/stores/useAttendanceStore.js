import { create } from 'zustand';

export const useAttendanceStore = create((set) => ({
  // 마지막으로 출석 다이얼로그를 띄운 날짜 
  lastPromptedDate: null, 
  setLastPromptedDate: (dateString) => set({ lastPromptedDate: dateString }),
}));