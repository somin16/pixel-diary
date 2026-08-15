// src/api/profileApi.js
// 프로필 조회, 닉네임 수정, 프로필 이미지 수정, 프로필 이미지 삭제 API를 모아둔 파일

import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const profileApi = {
  // 프로필 조회
  getProfile: () => authFetch(`${BASE_URL}/api/v1/profile/`),
  
  // 닉네임 수정
  updateNickname: (payload) => authFetch(`${BASE_URL}/api/v1/auth/username/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),

  // 프로필 이미지 수정
  updateImage: (formData) => authFetch(`${BASE_URL}/api/v1/auth/userimage/`, {
    method: "PATCH",
    body: formData,
  }),

  // 프로필 이미지 삭제 (기본 이미지로 변경)
  deleteImage: () => authFetch(`${BASE_URL}/api/v1/auth/userimage/`, {
    method: "DELETE",
  }),
};