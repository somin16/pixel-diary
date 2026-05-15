/**
 * ISO 날짜 문자열을 'YY년 MM월 DD일' 형식으로 변환합니다.
 *
 * ─ 처리하는 두 가지 날짜 형식 ────────────────────────────────────────────
 *   1. "+09:00" 포함 (백엔드 API 응답): "2026-05-14T07:07:59+09:00"
 *      → 이미 한국 시간(KST)이므로 추가 변환 없이 그대로 사용
 *
 *   2. "Z" 또는 타임존 정보 없음 (Supabase 직접 응답 등): "2026-05-14T07:07:59Z"
 *      → UTC 기준이므로 한국 시간으로 변환하기 위해 +9시간 추가
 *
 * ─ 왜 두 가지를 구분해야 하나요? ─────────────────────────────────────────
 *   JavaScript의 new Date()는 "+09:00"이 붙어있으면 자동으로 KST로 인식합니다.
 *   하지만 "Z"(UTC)가 붙어있으면 한국보다 9시간 뒤진 UTC 기준으로 파싱합니다.
 *   → 구분 없이 무조건 +9시간을 더하면, 이미 KST인 경우 하루가 밀리는 버그 발생!
 *
 * @param {string} dateStr - ISO 형식 날짜 문자열
 * @returns {string} - 예: '26년 05월 14일'
 */
export const formatDisplayDate = (dateStr) => {
    // 날짜 문자열이 없으면 기본값 반환 (에러 방지)
    if (!dateStr) return "00년 00월 00일";

    // 문자열을 Date 객체로 변환
    const d = new Date(dateStr);

    // 유효하지 않은 날짜인 경우 기본값 반환 (예: 잘못된 형식의 문자열)
    if (isNaN(d.getTime())) return "00년 00월 00일";

    // "+09:00" 또는 "+09"가 포함되어 있으면 이미 한국 시간(KST)
    // → 추가 변환 불필요
    const isKST = dateStr.includes('+09:00') || dateStr.includes('+09');

    // KST가 아닌 경우(UTC 등) → 9시간을 밀리초로 더해서 한국 시간으로 변환
    // 9시간 = 9 * 60분 * 60초 * 1000밀리초 = 32,400,000ms
    const base = isKST ? d : new Date(d.getTime() + 9 * 60 * 60 * 1000);

    // 연도 뒤 2자리 추출 (예: 2026 → "26")
    const year = base.getFullYear().toString().slice(-2);

    // 월 추출 후 2자리로 맞추기 (getMonth()는 0부터 시작하므로 +1 필요)
    // padStart(2, '0'): 1자리 숫자 앞에 "0" 채우기 (예: 5 → "05")
    const month = (base.getMonth() + 1).toString().padStart(2, '0');

    // 일 추출 후 2자리로 맞추기
    const day = base.getDate().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${day}일`;
};