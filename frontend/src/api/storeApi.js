// src/api/storeApi.js
// 상점 관련 API 호출 함수만 모아둔 파일 (React Query 코드 없음, 순수 fetch)
// authFetch를 사용하므로 로그인 토큰이 자동으로 헤더에 붙습니다 (수동으로 Authorization 안 넣어도 됨)
import { authFetch } from '../utils/AuthHelper';

// .env 파일에 정의된 백엔드 서버 주소를 가져옵니다
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const storeApi = {
  // 1. 상점에서 판매 중인 전체 아이템 목록을 조회합니다.
  //    GET 요청이라 별도 method 지정 없이 URL만 넘기면 됩니다 (authFetch 기본값이 GET).
  getItem: () => authFetch(`${BASE_URL}/api/v1/items/`),

  // 2. 아이템을 구매합니다.
  //    itemId: 구매할 아이템의 고유 id (숫자 또는 문자열, 호출하는 쪽에서 넘겨줌)
  //    서버가 URL 경로에 아이템 id를 받아서 어떤 아이템인지 식별합니다 (/items/{itemId}/purchase/).
  buyItem: (itemId) => authFetch(`${BASE_URL}/api/v1/items/${itemId}/purchase/`, {
    method: 'POST', // 구매는 서버 데이터를 변경하는 동작이라 POST 사용
    // item_count: 1 → 현재는 한 번에 1개씩만 구매하는 구조라 고정값으로 보냄
    body: JSON.stringify({ item_count: 1 }),
  }),
};