// src/constants/themeColors.js
// 통계 화면 색상표. 테마에 안 적은 항목은 DEFAULT_THEME_COLORS 값이 쓰인다.
// 키는 useTheme의 THEME_LIST와 동일하게.
export const DEFAULT_THEME_COLORS = {
  // 글자 / 배경
  ink: '#0f5353',          // 글자색
  pageBg: 'transparent',   // 통계 페이지 전체 배경 (transparent = 앱 배경 그대로)
  bg: '#FFFFFF',           // 섹션 박스 배경
  cardBg: '#F4F5FA',       // 요약 카드 배경
  // 박스 테두리
  line: '#68b9ac',         // 박스 테두리, 감정 비율 막대/작성률 바 테두리
  shadow: '#b5dfd9',       // 박스 그림자
  // 차트
  bar: '#0f5353',          // 막대 그래프, 작성률 채움색
  track: '#FFFFFF',        // 작성률 바의 빈 부분 배경
  // 연/월 토글 버튼
  tabActive: '#0f5353',
  tabActiveText: '#FFFFFF',
  tabInactive: '#FFFFFF',
  tabInactiveText: '#0f5353',
  // 감정 5색 (행복→평온→피로→우울→화남)
  happy: '#ffe89d',
  calm: '#c0ffa2',
  tired: '#85d8ff',
  sad: '#626596',
  angry: '#ff9595',
};

export const THEME_COLORS = {
  default_light: {}, // 전부 기본값 사용
  winter_light: {
    ink: '#1F3A5F', bg: '#ffffff', cardBg: '#ffffff',
    line: '#1F3A5F', shadow: '#1F3A5F', bar: '#1F3A5F', track: '#FFFFFF',
    tabActive: '#1F3A5F', tabActiveText: '#ffffff', tabInactive: '#ffffff', tabInactiveText: '#1F3A5F',
  },
  yellow_light: {
    ink: '#5f452e', bg: '#ffffff', cardBg: '#ffffff',
    line: '#ffdd81', shadow: '#ffe07c', bar: '#5f452e', track: '#FFFFFF',
    tabActive: '#5f452e', tabActiveText: '#ffffff', tabInactive: '#ffffff', tabInactiveText: '#5f452e',
  },
  pink_light: {
    ink: '#7A2E4D', bg: '#FFFFFF', cardBg: '#FFFFFF',
    line: '#dd9ab2', shadow: '#f1d5de', bar: '#7A2E4D', track: '#FFFFFF',
    tabActive: '#883b55', tabActiveText: '#FFF1F6', tabInactive: '#FFF1F6', tabInactiveText: '#7A2E4D',
  },
  halloween_light: {
    ink: '#5a3c6b', bg: '#ffffff', cardBg: '#ffffff',
    line: '#c39ed4', shadow: '#dcc5e7', bar: '#5a3c6b', track: '#FFFFFF',
    tabActive: '#5a3c6b', tabActiveText: '#ffffff', tabInactive: '#ffffff', tabInactiveText: '#5a3c6b',
  },
};

// 현재 테마의 색상 = 기본값 + 그 테마에서 덮어쓴 값 (목록에 없는 테마여도 안전)
export function getThemeColors(themeName) {
  return { ...DEFAULT_THEME_COLORS, ...(THEME_COLORS[themeName] ?? {}) };
}