import { supabase } from "./SupabaseClient";

/**
 * @typedef {Object} FetchOptions
 * @property {string} [method] - HTTP 요청 메서드 (GET, POST, PUT, DELETE 등)
 * @property {Object} [headers] - 추가적인 HTTP 헤더
 * @property {string|FormData|Object} [body] - 요청 본문 데이터
 */

/**
 * Supabase 인증 토큰을 자동으로 포함하여 서버와 통신하는 도우미 함수입니다.
 * 
 * @async
 * @function authFetch
 * @param {string} url - 요청을 보낼 API 엔드포인트 주소
 * @param {FetchOptions} [options={}] - fetch API에 전달할 추가 옵션
 * @returns {Promise<any>} 서버로부터 받은 JSON 응답 데이터
 * @throws {Error} 서버 응답이 성공(2xx)이 아니거나 네트워크 오류 발생 시 에러를 던집니다.
 * 
 * @example
 * // 사용 예시: 일기 삭제
 * try {
 *   const result = await authFetch('https://api.example.com/v1/diary/2024-05-20', {
 *     method: 'DELETE'
 *   });
 *   console.log('삭제 성공:', result);
 * } catch (error) {
 *   console.error('삭제 실패:', error.message);
 * }
 */

// ── 토큰 갱신 함수 ────────────────────────────────────────────────────
// 백엔드 갱신 API를 호출해서 새 access_token을 받아옵니다.
// 갱신 성공 시 새 토큰 반환, 실패 시 null 반환
async function refreshAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentRefresh_token = session?.refresh_token;

    if (!currentRefresh_token) return null;

    // 우리가 만든 토큰 갱신 API 호출
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: currentRefresh_token }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const newAccessToken = data.access_token ?? null;

    if (!newAccessToken) return null;

    // 핵심 추가: Supabase 클라이언트 상태도 함께 업데이트
    // 이렇게 해야 다음 authFetch 호출 때 갱신된 토큰을 가져올 수 있음
    await supabase.auth.setSession({
      access_token: newAccessToken,
      refresh_token: data.refresh_token ?? currentRefresh_token,
      // 백엔드가 refresh_token을 새로 안 주면 기존 것 그대로 유지
    });

    return newAccessToken;
  } catch {
    return null;
  }
}


export async function authFetch(url, options = {}) {
  // 현재 로그인한 사용자의 세션 정보를 가져옵니다.
  const { data: { session } } = await supabase.auth.getSession();

  let access_token = session?.access_token;

  // 공통 요청 함수 (토큰만 바꿔서 재사용하기 위해 분리)
  const doFetch = (token) => {
    // 1. 기본 헤더 조립 (토큰 및 옵션으로 넘어온 헤더)
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers ?? {}),
    };

    // 2. 넘겨받은 데이터(body)가 FormData(파일)가 아닐 경우에만 JSON 타입 추가
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    // 3. 완성된 헤더를 fetch에 담아서 요청
    return fetch(url, {
      ...options,
      headers,
    });
  };

  // 1차 요청
  let response = await doFetch(access_token);

  // ── 401 발생 시 토큰 갱신 후 재시도 ────────────────────────────────
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // 새 토큰으로 재시도
      response = await doFetch(newToken);
    } else {
      // 갱신 실패 → 로그인 페이지로 이동
      await supabase.auth.signOut();
      window.location.href = "/auth/login";
      throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }
  }

  // 응답 상태가 200~299 범위가 아닌 경우 에러 처리를 합니다.
  if (!response.ok) {
    // 서버에서 보내준 상세 에러 메시지가 있는지 확인합니다.
    const errorBody = await response.text();
    console.error(`[authFetch 에러] 상태코드: ${response.status}`, errorBody);

    // apiError 객체 생성 코드
    const apiError = new Error(`서버 통신 오류 (상태코드: ${response.status})`);

    // 호출한 쪽에서 'error.status'로 바로 꺼내 쓸 수 있게 커스텀 필드를 주입
    apiError.status = response.status;

    // (선택) 서버가 보낸 JSON 메시지까지 파싱해서 첨부하고 싶다면 구조화
    try {
      apiError.response = {
        status: response.status,
        data: JSON.parse(errorBody)
      };
    } catch {
      apiError.response = {
        status: response.status,
        data: { message: errorBody }
      };
    }
    // 완성된 커스텀 에러 객체를 던짐
    throw apiError;
  }

  // 응답이 비어있는 경우(예: 204 No Content) 처리
  if (response.status === 204) {
    return null;
  }

  // 성공적인 응답을 JSON 형식으로 변환하여 반환합니다.
  return response.json();
}