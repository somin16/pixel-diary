import React, { useState, useEffect } from "react";
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ToggleButton from "../../../components/more/notification/ToggleButton";
import NotificationCard from "../../../components/more/notification/NotificationCard";
import TimePickerDialog from "../../../components/more/notification/TimePickerDialog";

// 알림 항목 배열
const NOTIFICATION_LIST = [
  { id: 'diary', label: '오늘 일기 채우기', time: '21:00' },
  { id: 'notice', label: '공지사항, 이벤트 및 혜택 알림', time: null },
];

const Notification = () => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 알림 활성화 여부 및 설정 시간 상태 관리
  const [notifications, setNotifications] = useState(() => {
    return NOTIFICATION_LIST.map((item) => ({
      ...item,
      isOn: false, // 초기 토글 상태 추가
    }));
  });

  // 다이얼로그 팝업 제어용 상태(State)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState(null);
  const [pickerCurrentTime, setPickerCurrentTime] = useState("00:00");

  // 전체 알림 켜짐 여부 판별(모든 항목의 isOn이 true인지 검사)
  const isAllOn = notifications.length > 0 && notifications.every(item => item.isOn === true);

  // 전체 알림 토글 제어
  const handleAllToggle = () => {
    const nextState = !isAllOn;
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isOn: nextState }))
    );
  };

  // 개별 항목 토글 제어
  const handleItemToggle = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isOn: !item.isOn } : item
      )
    );
  };

  // 시간 설정 팝업창 핸들러
  const handleCardTimeClick = (id, time) => {
    setActiveCardId(id);
    setPickerCurrentTime(time);
    setIsPickerOpen(true);
  };

  // 확인 버튼 클릭 시 변경된 시간 반영
  const handleTimePickerConfirm = (newTime) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === activeCardId ? { ...item, time: newTime } : item
      )
    );
    setIsPickerOpen(false); // 시간 반영 후 다이얼로그 닫기
  };

  return (
    <div
      className="w-full h-screen overflow-hidden pt-[16%] pb-[8%] flex flex-col bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`
      }}
    >

      {/* 상단 헤더 */}
      <Header title="알림 설정" />

      {/* 메인 컨텐츠 영역 */}
      <div className="w-full px-[6%] flex flex-col items-center mt-[5%]">

        {/* 전체 알림 박스 */}
        <div className="relative w-full">
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'alarm_all_list_box_x3')}
            alt="전체 알림 배경"
            className="relative w-full h-auto block"
          />
          <span className="absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-sm font-bold text-black whitespace-nowrap">
            전체 알림
          </span>

          {/* 토글 컴포넌트 */}
          <ToggleButton
            id="all"
            isOn={isAllOn}
            onClick={handleAllToggle}
          />
        </div>

        {/* 구분선 */}
        <div className="flex justify-center w-full my-[6%] pointer-events-none">
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'line_x3')}
            alt="구분선"
            className="w-[92%] object-contain"
          />
        </div>

        {/* 개별 알림 리스트 */}
        <ul className="list-none p-0 m-0 w-full flex flex-col gap-[8%]">
          {notifications.map((item) => (
            <NotificationCard
              key={item.id}
              {...item}
              onToggle={handleItemToggle}
              onTimeClick={handleCardTimeClick}
            />
          ))}
        </ul>
      </div>

      {/* 시간 설정 팝업창 */}
      {isPickerOpen && (
        <TimePickerDialog
          currentTime={pickerCurrentTime}
          onConfirm={handleTimePickerConfirm}
          onCancel={() => setIsPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default Notification;