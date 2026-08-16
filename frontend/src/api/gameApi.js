import { authFetch } from '../utils/AuthHelper';

// 티켓 아이디
const TICKET_ITEM_ID = 40;

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// 게임 API
export const gameApi = {

  // 점수 저장
  submitFinalScore: (gameId, finalScore) => {
    const body = { game_score: finalScore };
    return authFetch(`${BASE_URL}/api/v1/games/${gameId}/scores/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  // 티켓 사용
  removeTicket: () => {
    return authFetch(`${BASE_URL}/api/v1/users/inventory/tickets/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: TICKET_ITEM_ID }),
    })
  },
};