// src/api/diaryApi.js
// 일기(Diary) 관련 API 호출 함수만 모아둔 파일 (React Query 코드 없음, 순수 fetch)
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const diaryApi = {
  // 일기 목록 조회
  getList: () => authFetch(`${BASE_URL}/api/v1/diaries/`),

  // 일기 상세 조회
  getDetail: (diaryId) => authFetch(`${BASE_URL}/api/v1/diaries/${diaryId}/`),

  // 일기 작성
  create: (payload) => authFetch(`${BASE_URL}/api/v1/diaries/`, {
    method: 'POST',
    body: JSON.stringify(payload), // { image_id, content }
  }),

  // 일기 수정 (본문)
  update: (diaryId, payload) => authFetch(`${BASE_URL}/api/v1/diaries/${diaryId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload), // { content }
  }),

  // 일기 삭제
  delete: (diaryId) => authFetch(`${BASE_URL}/api/v1/diaries/${diaryId}/`, {
    method: 'DELETE',
  }),

  // 꾸미기 저장 (이모지 / 액자 / 스티커)
  saveDeco: (diaryId, payload) => authFetch(`${BASE_URL}/api/v1/diaries/${diaryId}/deco/`, {
    method: 'POST',
    body: JSON.stringify(payload), // { emoji_id, diary_theme_id, sticker }
  }),

  // 꾸미기 초기화
  deleteDeco: (diaryId) => authFetch(`${BASE_URL}/api/v1/diaries/${diaryId}/deco/`, {
    method: 'DELETE',
  }),
};
