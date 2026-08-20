// 코인 관련 API 호출 함수 모음
// 상점(구매), 보관함, 미니게임(보상 지급) 등 여러 도메인에서 공통으로 사용하는 공유 API 파일
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const coinApi = {
  // 1. 현재 보유 코인 잔액을 조회합니다.
  getCoin: () => authFetch(`${BASE_URL}/api/v1/users/coins/`),

  // 2. 코인을 지급하거나 차감합니다.
  //    payload: 호출하는 쪽(구매 로직, 미니게임 보상 로직 등)에서 필요한 값을 담아 전달
  //    (예: 몇 코인을 더하거나 뺄지 등 - 정확한 필드명은 백엔드 명세 확인 필요)
  updateCoin: (payload) => authFetch(`${BASE_URL}/api/v1/users/coins/`, {
    method: 'PATCH', // 기존 값을 부분적으로 수정하는 동작이라 PATCH 사용
    body: JSON.stringify(payload),
  }),
};