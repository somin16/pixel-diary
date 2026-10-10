// src/api/statisticsApi.js
// 통계 API 호출 전용 파일 (React Query 코드 없음, 순수 fetch)
// adminApi.js와 같은 방식: authFetch가 이미 JSON으로 변환해서 돌려주므로 결과를 그대로 반환
// (실패하면 authFetch가 에러를 throw → 서버 메시지는 error.response.data.message 에 들어있음)
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const statisticsApi = {
  // 통계 조회
  // GET /api/v1/auth/statistics/?year=2026&month=10
  // - month가 null/undefined면 쿼리에서 빼서 "연 단위" 조회
  // - user_id는 보내기 x  (서버가 JWT에서 추출)
  get: ({ year, month }) => {
    // month가 없을 때 파라미터 자체를 생략해야 서버가 연 단위로 처리
    const params = new URLSearchParams({ year: String(year) });
    if (month) params.set('month', String(month));
    return authFetch(`${BASE_URL}/api/v1/auth/statistics/?${params}`);
  },
};
