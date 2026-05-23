// src/components/more/attendance/AttendanceDialog.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import { authFetch } from "../../../utils/AuthHelper";
import toast from "react-hot-toast";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import CloseButton from "../../common/CloseButton";
import DayBox from "./DayBox";

// zustand 함수 불러오기
import { useAddCoinStore } from "../../../store/useCoinStore";

// 7일 출석 보상 데이터 구조 (서버 연동 시 초기화 기준이 됨)
const ATTENDANCE_DAYS = [
  { day: 1, type: "basic" },
  { day: 2, type: "basic" },
  { day: 3, type: "basic" },
  { day: 4, type: "special", ticketCount: 1 },
  { day: 5, type: "basic" },
  { day: 6, type: "basic" },
  { day: 7, type: "special", ticketCount: 2 },
];

const AttendanceDialog = ({ onClose }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // TODO: 실제 재화 스토어(Zustand) 연결 필요
  // const addCoins = useCoinStore((state) => state.addCoins);
  // const addTickets = useTicketStore((state) => state.addTickets);

  const [attendedDays, setAttendedDays] = useState(0); // 누적 출석일
  const [hasCheckedToday, setHasCheckedToday] = useState(false); // 당일 출석 버튼을 눌렀는지 여부
  const [loading, setLoading] = useState(false); // 출석 체크 버튼 눌렀을 때 로딩 상태
  const [fetchLoading, setFetchLoading] = useState(true); // 출석 기록 조회 로딩

  // 팝업 열릴 때 출석 기록 조회
  useEffect(() => {
    const fetchAttendance = async () => {
      setFetchLoading(true);
      try {
        // GET 요청으로 출석 기록 조회
        const result = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/attendance/`,
          { method: "GET" }
        );

        // total_count로 현재 출석 일수 설정
        setAttendedDays(result.total_count);

        // 오늘 날짜가 attendance_dates에 있으면 이미 출석한 것
        const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD 형식
        if (result.attendance_dates.includes(today)) {
          setHasCheckedToday(true);
        }

      } catch (error) {
        console.error("출석 기록 조회 실패", error);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const handleDayClick = async (day) => {
 
    if (attendedDays >= 7) {
      toast("이번 주 출석을 모두 완료했습니다!", { id: "all-done" });
      return;
    }
    if (fetchLoading) return; // 출석 기록 불러오는 중엔 클릭 막기
    if (loading) return;  // 출석 체크 및 보상 받는중이면 클릭 막기 
    
    // 과거 출석일 클릭 시 무시
    if (day <= attendedDays) {
      return;
    }

    // 당일 출석 완료 후 미래 날짜 클릭 시 안내 (중복 알림 방지 적용)
    if (hasCheckedToday) {
      // id를 부여하여 중복된 토스트가 연달아 뜨지 않도록 처리
      toast("이미 출석 체크를 완료하였습니다", { id: "already-checked" });
      return;
    }

    // 순서에 맞지 않는 미래 날짜 클릭 시 무시
    if (day !== attendedDays + 1) {
      return;
    }
    // 출석 체크 API 호출 시작
    setLoading(true);
    try {
      // POST 요청으로 출석 체크 및 보상 지급
      const result = await authFetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/attendance/`,
        { method: "POST" }
      );

      // 서버 응답으로 출석 일수 업데이트
      setAttendedDays(result.current_day);

      // 오늘 출석 완료 처리
      setHasCheckedToday(true);

      // 보상 목록에서 코인과 티켓 각각 분리
      const coinReward = result.reward.find((r) => r.reward_type === "coin");
      const ticketReward = result.reward.find((r) => r.reward_type === "ticket");

      // 코인 리워드가 있을때만 코인추가를 실행
      if (coinReward) {

        useAddCoinStore.getState().addDirectCoin(coinReward.amount);
      }

      // 티켓 보상이 있는 날이면 코인 + 티켓 알림
      if (ticketReward && ticketReward.amount > 0) {
        toast(`${coinReward?.amount || 0}코인과 티켓 ${ticketReward.amount}개를 받았습니다!`);
      } else {
        // 일반 날이면 코인만 알림
        toast(`${coinReward?.amount || 0}코인을 받았습니다!`);
      }

    } catch (error) {
      // 서버에서 400 에러 = 오늘 이미 출석한 경우
      if (error.status === 400) {
        toast("이미 출석 체크를 완료하였습니다", { id: "already-checked" });
        setHasCheckedToday(true);
      } else {
        // 그 외 에러 (서버 오류 등)
        toast(error.message || "출석 체크에 실패했습니다.");
      }
    } finally {
      // 성공이든 실패든 로딩 종료
      setLoading(false);
    }
  };


  return (
    // 공통 DialogBox 컴포넌트
    <DialogBox
      boxImageName="daily_check_frame_box_x3"
      maxWidth="458px"
      width="95%"
      onClose={onClose}
    >
      {/* 공통 CloseButton 컴포넌트 */}
      <div className="absolute -top-[16%] left-2 z-50 w-[9%] aspect-square">
        <CloseButton onClose={onClose} className="w-full h-full" />
      </div>

      <div className="w-full h-full flex flex-col items-center pt-[1%]">

        <h1 className="text-3xl font-bold tracking-widest text-black mt-[1%] mb-[12%]">
          출석 체크
        </h1>

        <div className="w-full flex flex-col gap-[9%] z-10">
          {/* 1~4일차 */}
          <div className="grid grid-cols-4 gap-[2%] w-full">
            {ATTENDANCE_DAYS.slice(0, 4).map((item) => (
              <DayBox
                key={item.day}
                item={item}
                isAttended={item.day <= attendedDays} // 출석한 날이면 체크 표시
                onClick={() => handleDayClick(item.day)}
                currentTheme={currentTheme}
              />
            ))}
          </div>

          {/* 5~7일차 */}
          <div className="grid grid-cols-4 gap-[2%] w-full relative left-[6%]">
            {ATTENDANCE_DAYS.slice(4, 7).map((item) => (
              <DayBox
                key={item.day}
                item={item}
                isAttended={item.day <= attendedDays} // 출석한 날이면 체크 표시
                onClick={() => handleDayClick(item.day)}
                currentTheme={currentTheme}
              />
            ))}
            <div className="w-full h-full"></div>
          </div>
        </div>

      </div>
    </DialogBox>
  );
};

export default AttendanceDialog;