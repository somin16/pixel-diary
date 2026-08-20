// src/api/attendanceApi.js
// 출석 기록 조회, 출석 체크 실행 API를 모아둔 파일

import { authFetch } from "../utils/AuthHelper";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const attendanceApi = {
  // 출석 기록 조회 (GET)
  getAttendance: async () => {
    const response = await authFetch(`${BASE_URL}/api/v1/profile/attendance/`, {
      method: "GET",
    });
    return response;
  },

  // 출석 체크 실행 (POST)
  checkAttendance: async () => {
    const response = await authFetch(`${BASE_URL}/api/v1/profile/attendance/`, {
      method: "POST",
    });
    return response;
  },

  // 앱 접속 시 만료된 출석 기록 초기화
  resetIfExpired: async () => {
    const response = await authFetch(`${BASE_URL}/api/v1/profile/attendance/reset/`, {
      method: "POST",
    });
    return response;
  },
};