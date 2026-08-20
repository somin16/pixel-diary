import { useTheme } from '../../stores/useThemeStore'; // 테마 전역상태관리 커스텀 훅
import { getAssetUrl } from "../../utils/AssetHelper"; // 이미지 에셋 경로 유틸 함수
import { formatDisplayDate } from '../../utils/DateFormatter'; // 날짜 포맷 변환 유틸 함수
import { useNavigate } from 'react-router-dom'; // 페이지 이동 훅
import { useDiaries } from '../../hooks/queries/useDiaryQueries';
import ListDiaryItem from '../../components/diary/ListDiaryItem'; // 일기 목록 개별 아이템 컴포넌트

/**
 * 일기 목록 화면 (갤러리 형태)
 *
 * 목록 데이터는 React Query 캐시(queryKeys.diaries)를 사용합니다.
 * 일기 저장/수정/삭제 시 관련 mutation들이 이 캐시를 자동으로 무효화하므로
 * 이 화면에서 직접 캐시를 관리(sessionStorage 등)할 필요가 없습니다.
 */
export default function ListDiary() {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const { data, isLoading, isError } = useDiaries();
  const diaries = data?.diaries || [];

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
        backgroundSize: '100% 100%',
      }}
    >
      <div className='flex-1 overflow-y-auto no-scrollbar pb-[120%]'>
        {isLoading ? (
          // 로딩 중: 바운스 애니메이션 텍스트 표시
          <div className="flex justify-center mt-[50%] text-3xl text-[#4A4A4A] font-bold animate-bounce">
            일기를 불러오는 중...
          </div>
        ) : isError ? (
          <div className="flex justify-center mt-[50%] text-sm text-gray-500 font-bold">
            일기 목록을 불러오지 못했습니다.
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
                imageUrl={diary.image_url}
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
