/**
 * ISO 날짜 문자열을 'YY년 MM월 DD일' 형식으로 변환합니다.
 * @param {string} dateStr - 예: '2026-03-31' 또는 '2026-03-31T10:00:00'
 * @returns {string} - 예: '26년 03월 31일'
 */
export const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "00년 00월 00일"; // 에러 방지용 방어 코드
    
    const d = new Date(dateStr);
    
    // 유효하지 않은 날짜인 경우 처리
    if (isNaN(d.getTime())) return "00년 00월 00일";

    const year = d.getFullYear().toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${day}일`;
};