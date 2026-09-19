// src/api/promptApi.js
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const promptApi = {
  // 일기 내용을 영어 프롬프트로 변환
  convert: (diary) => authFetch(`${BASE_URL}/api/v1/prompt/`, {
    method: 'POST',
    body: JSON.stringify({ diary }),
  }),

  // 태그(추가/제거) 반영해서 프롬프트 재변환
  refine: ({ prompt, request, remove }) => authFetch(`${BASE_URL}/api/v1/prompt/`, {
    method: 'PATCH',
    body: JSON.stringify({ prompt, request, remove }),
  }),
};
