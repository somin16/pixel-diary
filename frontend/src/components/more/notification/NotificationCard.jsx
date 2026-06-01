import React from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import ToggleButton from "./ToggleButton";

/**
 * 개별 알림 설정 카드 컴포넌트
 * @param {string} id - 알림 항목의 고유 ID ('diary' | 'notice')
 * @param {string} label - 화면에 표시될 알림 이름
 * @param {boolean} isOn - 현재 토글 버튼의 ON/OFF 상태
 * @param {string|null} time - 알림 시간 (값이 없으면 null)
 * @param {function} onToggle - 토글 버튼 클릭 시 부모의 상태를 바꾸는 함수 (인자로 id 전달)
 * @param {function} onTimeClick - 시간 클릭 시 다이얼로그 팝업을 열어주는 함수 (인자로 id, time 전달)
 */

const NotificationCard = ({ id, label, isOn, time, onToggle, onTimeClick }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 24시간 형식('21:00')을 화면 표시용 12시간 형식('오후 9:00')으로 변환하는 함수
  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinute = String(minutes).padStart(2, "0");
    return `${ampm} ${displayHour}:${displayMinute}`;
  };

  return (
    <li className="relative w-full">
      {/* 카드 배경 이미지 */}
      <img
        src={getAssetUrl(currentTheme, 'boxes', 'announcement_alarm_list_box_x3')}
        alt={`${label} 배경`}
        className="relative w-full h-auto block"
      />

      {/* 라벨 및 시간 설정 */}
      <div className="absolute z-10 top-1/2 -translate-y-1/2 left-[6%] flex flex-col justify-center w-[65%]">
        <span className="text-sm font-bold text-black whitespace-nowrap leading-tight">
          {label}
        </span>

        {/* time 프로퍼티가 존재하는 항목만 시간 선택 활성화 */}
        {time !== null && (
          <span
            onClick={() => onTimeClick(id, time)}
            className="text-2xl font-extrabold text-gray-700 tracking-wider mt-[8%] leading-none cursor-pointer hover:text-gray-500 transition-colors"
          >
            {formatDisplayTime(time)}
          </span>
        )}
      </div>

      {/* 우측 토글 버튼 컴포넌트 */}
      <ToggleButton
        id={id}
        isOn={isOn}
        onClick={onToggle}
      />
    </li>
  );
};

export default NotificationCard;