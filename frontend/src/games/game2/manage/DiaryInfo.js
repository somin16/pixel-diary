// =====================================================
// 일기 정보 정리
// 일기 목록을 받아서 두 가지를 뽑아냅니다.
//   1) todayEmotion      : 오늘 쓴 일기의 감정 (없으면 null) → 데일리 모드에 사용
//   2) unlockedEmotions  : 지금까지 한 번이라도 쓴 감정들   → 무한 모드 해금에 사용
// =====================================================

// diaries : 서버에서 받은 일기 목록 (배열)
export function buildDiaryInfo(diaries) {

    // 배열이 아닌 값이 오면 빈 목록으로 처리 (오류 방지)
    const list = Array.isArray(diaries) ? diaries : [];

    // 한국 시간 기준 오늘 날짜 (예: "2026-10-06")
    // 서버가 주는 created_at이 한국 시간(+09:00) 문자열이라 앞 10글자가 날짜입니다.
    const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    // 쓴 적 있는 감정 목록 (중복 제거)
    const unlockedEmotions = [
        ...new Set(list.map((diary) => diary.emotion).filter(Boolean))
    ];

    // 오늘 날짜에 쓴 일기 찾기
    const todayDiary = list.find(
        (diary) => diary.created_at?.slice(0, 10) === todayKst
    );

    return {
        todayEmotion: todayDiary?.emotion ?? null,
        unlockedEmotions
    };
}
