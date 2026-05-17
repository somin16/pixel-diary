import { useState, useEffect } from 'react';
import { useTheme } from '../../store/useThemeStore'; // 테마 전역상태관리 커스텀 훅
import { getAssetUrl } from "../../utils/AssetHelper"; // 이미지 에셋 경로 유틸 함수
import { formatDisplayDate } from '../../utils/DateFormatter'; // 날짜 포맷 변환 유틸 함수
import { useNavigate } from 'react-router-dom'; // 페이지 이동 훅
import { authFetch } from '../../utils/AuthHelper';
import ListDiaryItem from '../../components/diary/ListDiaryItem'; // 일기 목록 개별 아이템 컴포넌트

/**
 * 일기 목록 화면 (갤러리 형태)
 *
 * ─ 캐시(sessionStorage) 전략 ──────────────────────────────────────────────
 *   처음 마운트 시에만 API를 호출하고 결과를 sessionStorage에 저장합니다.
 *   이후 재방문 시에는 저장된 데이터를 바로 사용하여 로딩 없이 즉시 목록을 표시합니다.
 *
 *   캐시가 삭제(무효화)되는 경우:
 *   - 새 일기 저장 완료 (DiaryForm의 handleFinalSave)
 *   → 캐시 삭제 후 다음 방문 시 API 재호출하여 최신 목록 반영
 * ──────────────────────────────────────────────────────────────────────────
 */
export default function ListDiary() {
    const navigate = useNavigate();
    const currentTheme = useTheme((state) => state.currentTheme);

    // 일기 목록 데이터 상태
    const [diaries, setDiaries] = useState([]);
    // 로딩 중 여부 상태 (true: 로딩 중, false: 완료)
    const [loading, setLoading] = useState(true);

    // ── 일기 목록 조회 함수 ─────────────────────────────────────────────────
    const fetchDiaries = async () => {
        try {
            setLoading(true);

            // sessionStorage 캐시 확인
            const cached = sessionStorage.getItem('diary_list');
            if (cached) {
                // 캐시 있음 → API 호출 없이 즉시 목록 표시 (로딩 화면 없음)
                setDiaries(JSON.parse(cached));
                setLoading(false);
                return; // 이후 코드 실행 안 함
            }

            // Promise.all로 최소 1초 대기 유지
            const [data] = await Promise.all([
                authFetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/`),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            const list = data.diaries || [];

            // 다음 방문 시 재사용할 수 있도록 sessionStorage에 저장
            sessionStorage.setItem('diary_list', JSON.stringify(list));
            setDiaries(list);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            // 성공/실패 상관없이 로딩 종료
            setLoading(false);
        }
    };

    // 컴포넌트가 화면에 처음 나타날 때 한 번만 실행
    useEffect(() => {
        fetchDiaries();
    }, []);

    return (
        <div
            className="w-full h-screen overflow-hidden flex flex-col"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
                backgroundSize: '100% 100%',
            }}
        >
            <div className='flex-1 overflow-y-auto no-scrollbar pb-[120%]'>
                {loading ? (
                    // 로딩 중: 바운스 애니메이션 텍스트 표시
                    <div className="flex justify-center mt-[50%] text-3xl text-[#4A4A4A] font-bold animate-bounce">
                        일기를 불러오는 중...
                    </div>
                ) : (
                    // 로딩 완료: 3열 그리드로 일기 목록 표시
                    <div
                        className="grid grid-cols-3 gap-x-[3%] gap-y-[4%] p-[2%] items-start"
                        style={{ gridAutoRows: 'min-content' }}
                    >
                        {diaries.map((diary) => (
                            <ListDiaryItem
                                key={diary.diary_id} // React 리스트 렌더링 시 고유 키 필요
                                // imageUrl={diary.image_url} ← 현재 목록 API에서 미포함, 추후 활성화
                                currentTheme={currentTheme}
                                date={formatDisplayDate(diary.created_at)} // "2026-05-14T..." → "26년 05월 14일"
                                // 클릭 시 상세보기로 이동
                                // state로 diaryId 전달 → DiaryDetail에서 API 호출에 사용
                                onClick={() => navigate(
                                    `/diary/${diary.diary_id}`,
                                    { state: { diaryId: diary.diary_id, diaryDate: diary.created_at } }
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}