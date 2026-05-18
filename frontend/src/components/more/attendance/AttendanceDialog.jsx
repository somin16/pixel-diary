// src/components/more/attendance/AttendanceDialog.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import { authFetch } from "../../../utils/AuthHelper";
import toast from "react-hot-toast";

import DialogBox from "../../common/dialog/DialogBox";
import CloseButton from "../../common/CloseButton";
import DayBox from "./DayBox";

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

  const [attendedDays, setAttendedDays] = useState(0);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true); // 조회 로딩

  // 팝업 열릴 때 출석 기록 조회
  useEffect(() => {
    const fetchAttendance = async () => {
      setFetchLoading(true);
      try {
        const result = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}api/v1/profile/attendance/`,
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

  const handleDayClick = (day) => {
    // 과거 출석일 클릭 시 무시
    if (day <= attendedDays) {
      return;
    }

    // 당일 출석 완료 후 미래 날짜 클릭 시 안내
    if (hasCheckedToday) {
      toast("이미 출석 체크를 완료하였습니다", { id: "already-checked" });
      return;
    }

    // 순서에 맞지 않는 미래 날짜 클릭 시 무시
    if (day !== attendedDays + 1) {
      return;
    }
  };

  return (
    <DialogBox
      boxImageName="daily_check_frame_box_x3"
      maxWidth="458px"
      width="95%"
      onClose={onClose}
    >
      <div className="absolute -top-[16%] left-2 z-50 w-[9%] aspect-square">
        <CloseButton onClose={onClose} className="w-full h-full" />
      </div>

      <div className="w-full h-full flex flex-col items-center pt-[1%]">

        <h1 className="text-3xl font-bold tracking-widest text-black mt-[1%] mb-[12%]">
          출석 체크
        </h1>

        {/* 조회 로딩 중일 때 */}
        {fetchLoading && (
          <p className="text-sm text-gray-500 mb-2">불러오는 중...</p>
        )}

        <div className="w-full flex flex-col gap-[9%] z-10">
          {/* 1~4일차 */}
          <div className="grid grid-cols-4 gap-[2%] w-full">
            {ATTENDANCE_DAYS.slice(0, 4).map((item) => (
              <DayBox
                key={item.day}
                item={item}
                isAttended={item.day <= attendedDays}
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
                isAttended={item.day <= attendedDays}
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