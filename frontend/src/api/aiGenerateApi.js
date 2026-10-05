// src/api/aiGenerateApi.js
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const aiGenerateApi = {
  // 1단계: 큐잉만 하고 즉시 응답 (client_id, prompt_id, comfyui_url 반환)
  start: (payload) => authFetch(`${BASE_URL}/api/v1/ai-generate/`, {
    method: 'POST',
    body: JSON.stringify(payload), // { positive_prompt, negative_prompt }
  }),

  // 3단계: 완료 후 결과 이미지 조회
  getResult: (promptId, comfyuiUrl) => authFetch(
    `${BASE_URL}/api/v1/ai-generate/${promptId}/result/?comfyui_url=${encodeURIComponent(comfyuiUrl)}`
  ),

  // 임시 이미지 전체 삭제
  deleteTemp: () => authFetch(`${BASE_URL}/api/v1/ai-generate/`, {
    method: 'DELETE',
  }),
};