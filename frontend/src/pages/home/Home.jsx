import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 페이지 이동 훅
import { getAssetUrl } from "../../utils/AssetHelper"; // 이미지 에셋 경로 유틸 함수
import { useTheme } from "../../stores/useThemeStore"; // 테마 전역상태관리 커스텀 훅
import FloatingActionButton from "../../components/home/FloatingActionButton"; // FAB 버튼 컴포넌트
import Calendar from "../../components/home/Calendar"; // 달력 컴포넌트
import { authFetch } from "../../utils/AuthHelper";
import { useDiaries } from "../../hooks/queries/useDiaryQueries";

// 출석 관련 모듈 및 Zustand 스토어 임포트
import Attendance from "../../components/more/attendance/AttendanceDialog";
import { useAttendanceStore } from "../../stores/useAttendanceStore";

export default function Home() {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  // 달력에서 날짜 클릭 시 해당 날짜 일기 존재 여부를 확인하는 데 사용
  const { data: diariesData, isError: isDiariesError, error: diariesError } = useDiaries();

  // 일기 목록 로드 실패 시 처리 (추후 alert/toast 추가 예정)
  useEffect(() => {
    if (isDiariesError) {
      console.error("일기 목록 로드 실패:", diariesError);
      // TODO: 사용자에게 alert 또는 toast로 안내 추가 예정
    }
  }, [isDiariesError, diariesError]);

  // 출석 관련 상태 정의
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const { hasCheckedToday, setHasCheckedToday } = useAttendanceStore();

  // 로그인 직후 자동 출석 체크 및 다이얼로그 제어 로직
  useEffect(() => {
    if (hasCheckedToday) return;

    const verifyAttendance = async () => {
      try {
        // 1. authFetch를 사용해 백엔드 API로 출석 기록 조회
        const result = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/attendance/`,
          { method: "GET" }
        );

        // 2. YYYY-MM-DD 형식으로 오늘 날짜 구하기
        const today = new Date().toLocaleDateString("sv-SE");

        // 3. 백엔드에서 준 출석 날짜 목록에 오늘 날짜가 '없다면' 창 띄우기
        if (!result.attendance_dates.includes(today)) {
          setIsAttendanceOpen(true);
        }

      } catch (error) {
        // 세션이 없거나 서버 에러일 경우 처리
        console.error("출석 기록 조회 중 오류 발생:", error);
      } finally {
        // 4. 성공하든 에러가 나든 오늘 조회는 끝났으니 도장 찍기
        setHasCheckedToday(true);
      }
    };

    verifyAttendance();
  }, [hasCheckedToday, setHasCheckedToday]);

  // 달력의 기준이 되는 날짜 상태 (오늘 날짜로 초기화)
  // 이 값이 바뀌면 달력이 해당 월로 이동함
  const [viewDate, setViewDate] = useState(new Date());

  // ── 월 변경 핸들러 ──────────────────────────────────────────────────────
  // Calendar 컴포넌트에서 이전/다음 달 버튼 클릭 시 호출됨
  // offset: -1(이전 달) 또는 +1(다음 달)
  const handleMonthChange = (offset) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  // ── 날짜 클릭 핸들러 ────────────────────────────────────────────────────
  // 달력에서 날짜를 클릭했을 때 실행됨
  // 해당 날짜에 이미 쓴 일기가 있으면 → 상세보기로 이동
  // 없으면 → 일기 작성 페이지로 이동
  //
  // useDiaries()가 Home 마운트 시 이미 목록을 캐시해두므로,
  // 여기서는 그 캐시 데이터에서 날짜를 찾기만 하면 됨 (별도 fetch 불필요)
  const handleDateClick = (dateString) => {
    const diaries = diariesData?.diaries || [];

    // 클릭한 날짜("YYYY-MM-DD")와 일치하는 일기 찾기
    // created_at은 "2026-05-14T07:07:59+09:00" 형식이므로 "T" 앞까지만 비교
    const found = diaries.find(
      (d) => d.created_at?.split("T")[0] === dateString
    );

    if (found) {
      // 해당 날짜에 일기 있음 → 상세보기로 이동
      // state로 diaryId 전달 → DiaryDetail에서 API 호출에 사용
      navigate(`/diary/${dateString}`, {
        state: { diaryId: found.diary_id },
      });
    } else {
      // 해당 날짜에 일기 없음 → 일기 작성 페이지로 이동
      navigate(`/diary/write/${dateString}`);
    }
  };

  // ── FAB 버튼 핸들러 ─────────────────────────────────────────────────────
  // 우측 하단 플로팅 버튼 클릭 시 오늘 날짜로 바로 작성 페이지 이동
  // toLocaleDateString('en-CA'): 로컬 시간 기준 "YYYY-MM-DD" 형식 반환
  // (toISOString() 대신 쓰는 이유: toISOString()은 UTC 기준이라 한국에서 전날 날짜가 나올 수 있음)
  const handleFabClick = () => {
    const today = new Date().toLocaleDateString('en-CA');
    navigate(`/diary/write/${today}`);
  };

  return (
    <div
      className="relative w-full h-full"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
        backgroundSize: '100% 100%',
      }}
    >
      {/* 달력 영역 */}
      <div className="w-full h-full flex items-center justify-center pb-[38%]">
        <Calendar
          viewDate={viewDate}
          currentTheme={currentTheme}
          onMonthChange={handleMonthChange}
          onDateClick={handleDateClick}
        />
      </div>

      {/* 우측 하단 플로팅 버튼 (오늘 날짜로 일기 작성) */}
        <FloatingActionButton 
          currentTheme={currentTheme}
          onClick={handleFabClick} />

      {/* 출석 다이얼로그 */}
      {isAttendanceOpen && (
        <Attendance onClose={() => setIsAttendanceOpen(false)} />
      )}
    </div>
  );
}