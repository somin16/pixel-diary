import { create } from 'zustand';// 전역 상태 관리 라이브러리 zustand 불러오기
import { persist } from 'zustand/middleware'; // 사용자의 테마 정보를 자동 저장하는 persist 미들웨어 불러오기
// 새로고침이나 앱 재시작 후에도 테마 설정이 유지됨


// 앱 테마를 관리하는 전역 상태 저장소
export const useTheme = create(
    persist(
        (set) => ({
            // 현재 적용된 테마
            // 초기 테마 설정 (기본값: winter_light) 일단 다른 테마가 생기기 전까지는 펭귄테마가 기본입니다 나중에 변경예정
            currentTheme: 'winter_light',

            // 테마 변경 메서드
            setTheme: (newTheme) => {
                console.log(`[Theme Change]: ${newTheme} 테마로 변경되었습니다`);
                set({ currentTheme: newTheme });
            },

            // 테마 리셋 메서드 (기본값으로 리셋 시 사용)
            resetTheme: () => set({ current: 'winter_light' }),

        }),
        {
            // persist 설정
            // 로컬 스토리지에 저장될 키 이름
            name: 'canvas-theme-storage',
        }
    )
);

