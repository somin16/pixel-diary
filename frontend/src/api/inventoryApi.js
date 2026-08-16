// src/api/inventoryApi.js
// 보관함(유저가 보유한 아이템) 관련 API 호출 함수 모음
import { authFetch } from '../utils/AuthHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const inventoryApi = {
  // 1. 현재 로그인한 유저가 보유한 아이템 목록을 조회합니다.
  //    authFetch가 토큰을 자동으로 붙여서 "누구의" 보관함인지 서버가 구분합니다.
  getItem: () => authFetch(`${BASE_URL}/api/v1/users/inventory/`),
};