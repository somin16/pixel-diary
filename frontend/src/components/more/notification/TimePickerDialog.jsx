import React, { useState } from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";
import ScrollColumn from "./ScrollColumn";

/**
 * 시간 설정 다이얼로그
 * @param {string} currentTime - 현재 설정된 시간 (24시간 포맷, 예: '23:30')
 * @param {function} onConfirm - [확인] 버튼 클릭 시 변경된 시간('HH:MM')을 전달할 함수
 * @param {function} onCancel - [취소] 버튼 클릭 시 다이얼로그를 닫는 함수
 */

const TimePickerDialog = ({ currentTime = "00:00", onConfirm, onCancel }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 초기 데이터 동기화: 전달받은 'HH:MM' 문자열을 숫자형 시/분 데이터로 분리
  const [initialHours, initialMinutes] = currentTime.split(":").map(Number);
  // 데이터 포맷 변환: 24시간제 데이터를 화면 표시용 12시간제(오전/오후, 1~12시)로 계산
  const initialAmpm = initialHours >= 12 ? "오후" : "오전";
  const initialDisplayHour = String(initialHours % 12 === 0 ? 12 : initialHours % 12);
  const initialDisplayMinute = String(initialMinutes).padStart(2, "0");

  // 사용자 입력 값 상태 관리
  const [ampm, setAmpm] = useState(initialAmpm);
  const [hour, setHour] = useState(initialDisplayHour);
  const [minute, setMinute] = useState(initialDisplayMinute);

  // 컬럼별 표현 데이터 배열 (문자열 타입 통일)
  const ampmArray = ["오전", "오후"];
  const hoursArray = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  // 확인 버튼 클릭 시 12시간제 선택 값을 24시간제 표준 문자열('HH:MM')로 재조립
  const handleConfirmClick = () => {
    let finalHour = Number(hour);
    if (ampm === "오후" && finalHour !== 12) finalHour += 12;
    if (ampm === "오전" && finalHour === 12) finalHour = 0;

    const formattedHour = String(finalHour).padStart(2, "0");
    const formattedMinute = String(minute).padStart(2, "0");

    // 최종 가공된 데이터를 부모 컴포넌트로 송신
    onConfirm(`${formattedHour}:${formattedMinute}`);
  };

  return (
    <DialogBox boxImageName="popup_message_box_long_x3" onClose={onCancel} width="90%" maxWidth="340px">
      {/* 브라우저 기본 스크롤바 숨김 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="text-sm font-bold text-black mt-[4%] tracking-wide">
        오늘 일기 채우기
      </div>

      {/* 스크롤 피커 영역 */}
      <div className="relative flex items-center justify-center w-full my-[6%] px-[4%] aspect-[2.5/1] h-[132px]">
        {/* 포커스용 중앙 투명 선택 가이드라인 */}
        <div className="absolute left-0 right-0 h-[33.33%] border-t-2 border-b-2 border-gray-300/40 pointer-events-none top-1/2 -translate-y-1/2" />

        <div className="grid grid-cols-3 gap-1 w-full text-center z-10 h-full items-center">
          {/* 오전/오후 스크롤 컬럼 */}
          <ScrollColumn options={ampmArray} value={ampm} onChange={setAmpm} />
          {/* 시(Hour) 스크롤 컬럼 */}
          <ScrollColumn options={hoursArray} value={hour} onChange={setHour} />
          {/* 분(Minute) 스크롤 컬럼 */}
          <ScrollColumn options={minutesArray} value={minute} onChange={setMinute} />
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex w-full gap-[15%] px-[8%] mb-[2%]">
        <ImageButton
          label="취소"
          onClick={onCancel}
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')}
          className="flex-1"
          textOption="text-sm font-bold text-white"
        />
        <ImageButton
          label="확인"
          onClick={handleConfirmClick}
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
          className="flex-1"
          textOption="text-sm font-bold text-white"
        />
      </div>
    </DialogBox>
  );
};

export default TimePickerDialog;