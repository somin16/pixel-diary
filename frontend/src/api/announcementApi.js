// src/api/announcementApi.js
// 공지사항 "조회" API만 모아둔 파일 (일반 유저용, 순수 fetch)

import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const announcementApi = {
  // 공지사항 목록 조회
  getList: () => authFetch(`${BASE_URL}/api/v1/announcements/`),

  // 공지사항 상세 조회
  getDetail: (announcementId) => authFetch(`${BASE_URL}/api/v1/announcements/${announcementId}/`),
};