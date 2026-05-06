import React, { useState } from "react";
import { useTheme } from "../../store/useThemeStore";
import { getAssetUrl } from "../../utils/AssetHelper";
import toast from "react-hot-toast";

// 컴포넌트 불러오기
import DialogBox from "../../components/common/dialog/DialogBox";
import CloseButton from "../../components/common/CloseButton";
import DayBox from "../../components/attendance/DayBox";

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

const Attendance = ({ onClose }) => {
  const currentTheme = useTheme((state) => state.currentTheme);
  
  // TODO: 실제 재화 스토어(Zustand) 연결 필요
  // const addCoins = useCoinStore((state) => state.addCoins);
  // const addTickets = useTicketStore((state) => state.addTickets);

  // 누적 출석일 (테스트를 위해 3일차로 가정)
  const [attendedDays, setAttendedDays] = useState(3);
  // 당일 출석 버튼을 눌렀는지 여부 (상태 관리 필요)
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

const handleDayClick = (day) => {
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

    // 오늘 출석해야 할 차례인 경우
    if (day === attendedDays + 1) {
      const todayData = ATTENDANCE_DAYS.find(d => d.day === day);

      // TODO : 기본 보상 지급
      // addCoins(1000); 

      // TODO : 특별 보상(티켓)이 있는 날(4일차, 7일차)일 경우 티켓 지급
      if (todayData && todayData.type === "special") {
        // addTickets(todayData.ticketCount);
      }

      // 7일차 최종 보상 및 특별/기본 보상 알림
      if (day === 7) {
        toast(`7일 출석 성공!\n1000코인과 특별 티켓 ${todayData.ticketCount}개를 받았습니다`);
      } else if (todayData && todayData.type === "special") {
        // 4일차 특별 보상일 경우
        toast(`1000코인과 특별 티켓 ${todayData.ticketCount}개를 받았습니다`);
      } else {
        toast("1000코인을 받았습니다");
      }

      // 출석 상태 업데이트
      setAttendedDays(day);
      setHasCheckedToday(true); // 오늘 출석 완료 상태 저장

      // TODO: 7일차 완료 시 서버 초기화 로직 구현 필요
      if (day === 7) {
        // console.log("7일 출석 완료! 다음 날 리셋됩니다.");
      }
      
    } 
    // 순서에 맞지 않는 미래 날짜 클릭 시 무시
    else {
      return; 
    }
  };
  
  return (
    // 공통 DialogBox 컴포넌트
    <DialogBox 
      boxImageName="daily_check_frame_box_x3" 
      maxWidth="458px" 
      width="100%"
      onClose={onClose}
    >
      {/* 공통 CloseButton 컴포넌트 */}
      <div className="absolute -top-[16%] left-2 z-50 w-[9%] aspect-square">
        <CloseButton onClose={onClose} className="w-full h-full" />
      </div>

      <div className="w-full h-full flex flex-col items-center pt-[1%]">

        <h1 className="text-4xl font-bold tracking-widest text-black mt-[2%] mb-[12%]">
          출석 체크
        </h1>

        <div className="w-[100%] flex flex-col gap-[9%] z-10">
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

export default Attendance;