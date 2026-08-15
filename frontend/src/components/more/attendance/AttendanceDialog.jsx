// src/components/more/attendance/AttendanceDialog.jsx
import React from "react";
import { useTheme } from "../../../stores/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import toast from "react-hot-toast";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import CloseButton from "../../common/CloseButton";
import DayBox from "./DayBox";

// zustand & 리액트 쿼리 불러오기
import { useAddCoinStore } from "../../../stores/useCoinStore";
import { useAttendance, useCheckAttendance } from "../../../hooks/queries/useAttendanceQueries";

// 7일 출석 보상 데이터 구조 (서버 연동 시 초기화 기준이 됨)
const ATTENDANCE_DAYS = [
  { day: 1, coin:100, type: "basic"},
  { day: 2, coin:100, type: "basic" },
  { day: 3, coin:100, type: "basic" },
  { day: 4, coin:150, type: "special", ticketCount: 1 },
  { day: 5, coin:200, type: "basic" },
  { day: 6, coin:250, type: "basic" },
  { day: 7, coin:300, type: "special", ticketCount: 3 },
];

const AttendanceDialog = ({ onClose }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // React Query 훅
  const { data: attendanceData, isLoading: fetchLoading, isError } = useAttendance();
  const checkAttendanceMut = useCheckAttendance();

  // 서버 데이터를 기반으로 출석 상태 계산
  const attendedDays = attendanceData?.total_count || 0;
  const today = new Date().toLocaleDateString("sv-SE");
  const isTodayChecked = attendanceData?.attendance_dates?.includes(today) || false;

  const handleDayClick = async (day) => {
    if (attendedDays >= 7) {
      toast("이번 주 출석을 모두 완료했습니다!", { id: "all-done" });
      return;
    }

    // 로딩 중이거나 이미 통신 중이면 중복 클릭 방지
    if (fetchLoading || checkAttendanceMut.isPending) return;

    // 과거 출석일 클릭 시 무시
    if (day <= attendedDays) {
      return;
    }

    // 당일 출석 완료 후 미래 날짜 클릭 시 안내 (중복 알림 방지 적용)
    if (isTodayChecked) {
      // id를 부여하여 중복된 토스트가 연달아 뜨지 않도록 처리
      toast("이미 출석 체크를 완료하였습니다", { id: "already-checked" });
      return;
    }

    // 순서에 맞지 않는 미래 날짜 클릭 시 무시
    if (day !== attendedDays + 1) {
      return;
    }

    // 출석 체크 실행 (useMutation 활용)
    checkAttendanceMut.mutate(undefined, {
      onSuccess: (result) => {
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
      },
      onError: (error) => {
        if (error.status === 400) {
          toast("이미 출석 체크를 완료하였습니다", { id: "already-checked" });
        } else {
          toast(error.message || "출석 체크에 실패했습니다.");
        }
      }
    });
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
        
        {isError ? (
          <p className="text-sm text-gray-500 py-10">출석 정보를 불러오지 못했습니다</p>
        ) : (
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
                  coinReward={item.coin}
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
                  coinReward={item.coin}
                />
              ))}
              <div className="w-full h-full"></div>
            </div>
          </div>
        )}
      </div>
    </DialogBox>
  );
};

export default AttendanceDialog;