// src/api/profileApi.js
// 프로필 조회 API 파일

import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const profileApi = {
  // 프로필 조회
  getProfile: () => authFetch(`${BASE_URL}/api/v1/profile/`),
  
};