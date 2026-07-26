// src/utils/queryKeys.js
// 모든 React Query key를 여기서 한 번에 관리
// 새 도메인 추가할 때도 반드시 여기부터 추가하고 시작

export const queryKeys = {
  // ---------------------- 프로필 / 재화 ----------------------
  profile: ['profile'],                 // 프로필 조회
  coins: ['coins'],                     // 보유 재화 조회

  // ---------------------- 출석 ----------------------
  attendance: ['attendance'],           // 출석 기록 조회

  // ---------------------- 일기 (Diary & Gallery) ----------------------
  diaries: ['diaries'],                 // 일기 목록 전체
  diaryDetail: (diaryId) => ['diaries', diaryId], // date가 아니라 실제 DB diary id(int8) 기준

  // ---------------------- 상점 / 보관함 ----------------------
  items: ['items'],                     // 상점 아이템 목록
  decoItems: ['decoItems'],             // 꾸미기 아이템 목록 (emoji, diary_theme, sticker)
  inventory: ['inventory'],             // 내 보관함

  // ---------------------- 미니게임 / 랭킹 ----------------------
  gameRankings: (gameId) => ['games', gameId, 'rankings'], // 게임별 랭킹
  tickets: (itemId) => ['tickets', itemId],                // 인벤토리 티켓

  // ---------------------- 공지사항 ----------------------
  announcements: ['announcements'],                    // 공지 목록
  announcementDetail: (id) => ['announcements', id],   // 공지 상세

  // ---------------------- 설정 ----------------------
  settings: ['settings'],               // 앱 설정 (테마, 알림 여부)

  // ---------------------- 관리자 전용 ----------------------
  adminUsers: (page, keyword) => ['admin', 'users', page, keyword], // 전체 유저 조회 (페이지네이션)
  adminStats: (startDate, endDate, metricType) => ['admin', 'stats', startDate, endDate, metricType], // 서비스 통계

  // ---------------------- 2학기 신규: 캐릭터 육성 ----------------------
  character: ['character'],             // 캐릭터 상태 조회 (API 확정되면 endpoint 맞춰 조정)
};