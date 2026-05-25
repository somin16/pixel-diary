import { create } from 'zustand'; // 전역 상태 관리 라이브러리 zustand 불러오기
import { persist } from 'zustand/middleware'; // 사용자의 테마 정보를 자동 저장하는 persist 미들웨어 불러오기

/**테마 목록
 *
 * 전체 테마 목록은 프론트엔드에 하드코딩
 * DB에 새로운 테마 이름이 추가되더라도 프론트엔드 폴더(Asset) 내부에 해당 테마용 이미지 파일이 없으면 화면이 깨짐
 * 따라서 '실제 이미지 에셋'과 함께 프론트엔드 코드에서 명시적으로 관리
 */
export const THEME_LIST = [
  'winter_light', // TODO : 아래로 새로운 테마 추가
  'yellow_light',
];

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
        // THEME_LIST에 존재하는 테마일 때만 변경을 허용 (방어 로직)
        if (THEME_LIST.includes(newTheme)) {
          console.log(`[Theme Change]: ${newTheme} 테마로 변경되었습니다`);
          set({ currentTheme: newTheme });
        } else {
          console.warn(`[Theme Error]: '${newTheme}'는 존재하지 않는 테마입니다.`);
        }
      },

      // 테마 리셋 메서드 (기본값으로 리셋 시 사용)
      resetTheme: () => set({ currentTheme: 'winter_light' }),

    }),
    {
      // persist 설정
      // 로컬 스토리지에 저장될 키 이름
      name: 'canvas-theme-storage',
    }
  )
);

