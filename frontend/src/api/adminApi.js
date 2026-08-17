// src/api/adminApi.js
// 관리자 전용 API 호출 함수만 모아둔 파일 (React Query 코드 없음, 순수 fetch)
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const adminApi = {
  // 전체 유저 조회 (페이지네이션 + 검색)
  getUsers: (pageNumber, pageSize, searchKeyword) => {
    const params = new URLSearchParams({
      page_number: pageNumber,
      page_size: pageSize,
      ...(searchKeyword && { search_keyword: searchKeyword }),
    });
    return authFetch(`${BASE_URL}/api/v1/admin/users/?${params}`);
  },

  // 문제 유저 강제 탈퇴
  forceWithdrawUser: (userId) => authFetch(`${BASE_URL}/api/v1/admin/users/${userId}/`, {
    method: 'DELETE',
  }),

  // 공지사항 작성
  createAnnouncement: (payload) => authFetch(`${BASE_URL}/api/v1/admin/announcements/`, {
    method: 'POST',
    body: JSON.stringify(payload), // { title, content, category }
  }),

  // 공지사항 수정
  updateAnnouncement: (announcementId, payload) => authFetch(`${BASE_URL}/api/v1/admin/announcements/${announcementId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  // 공지사항 삭제
  deleteAnnouncement: (announcementId) => authFetch(`${BASE_URL}/api/v1/admin/announcements/${announcementId}/`, {
    method: 'DELETE',
  }),

  // 서비스 통계 조회
  getStats: (startDate, endDate, metricType) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metric_type: metricType,
    });
    return authFetch(`${BASE_URL}/api/v1/admin/stats/?${params}`);
  },

  // 아이템 추가
  addItem: (payload) => authFetch(`${BASE_URL}/api/v1/admin/items/`, {
    method: 'POST',
    body: JSON.stringify(payload), // { item_name, item_type, item_price, item_stackable, item_info, item_image_url }
  }),
};