// 티켓 관련 API 호출 함수 모음
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const ticketApi = {
  // 1. 보유 티켓을 조회합니다.
  //    itemId를 넘기면 특정 종류의 티켓만, 안 넘기면 전체 티켓을 조회하는 것으로 추정
  //    (쿼리스트림 ?item_id=... 형태로 URL에 붙임)
  getTicket: (itemId) => {
    const params = itemId ? `?item_id=${itemId}` : ''; // itemId가 있을 때만 쿼리스트링 붙이기
    return authFetch(`${BASE_URL}/api/v1/users/inventory/tickets/${params}`);
  },

  // 2. 티켓을 지급/차감/사용 처리합니다.
  updateTicket: (payload) => authFetch(`${BASE_URL}/api/v1/users/inventory/tickets/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
};