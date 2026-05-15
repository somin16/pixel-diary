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
export async function authFetch(url, options = {}) {
    // 1. 현재 로그인한 사용자의 세션 정보를 가져옵니다.
    const { data: { session } } = await supabase.auth.getSession();
    
    // 2. 세션에서 액세스 토큰(입장권)을 추출합니다.
    const access_token = session?.access_token;

    // 3. 기본 헤더 설정 (JSON 형식 지정 및 인증 토큰 주입)
    const headers = {
        "Content-Type": "application/json",
        ...(access_token && { Authorization: `Bearer ${access_token}` }), // 토큰이 있을 때만 추가
        ...(options.headers ?? {}), // 사용자가 직접 전달한 헤더가 있다면 덮어쓰기
    };

    // 4. 브라우저 기본 fetch 함수를 호출합니다.
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // 5. 응답 상태가 200~299 범위가 아닌 경우 에러 처리를 합니다.
    if (!response.ok) {
        // 서버에서 보내준 상세 에러 메시지가 있는지 확인합니다.
        const errorBody = await response.text();
        console.error(`[authFetch 에러] 상태코드: ${response.status}`, errorBody);
        
        // 에러를 던져 호출한 쪽에서 catch 할 수 있게 합니다.
        throw new Error(`서버 통신 오류 (상태코드: ${response.status})`);
    }

    // 6. 응답이 비어있는 경우(예: 204 No Content) 처리
    if (response.status === 204) {
        return null;
    }

    // 7. 성공적인 응답을 JSON 형식으로 변환하여 반환합니다.
    return response.json();
}