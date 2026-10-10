import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { authApi } from "../../../api/authApi"; // 알림 설정 API

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ToggleButton from "../../../components/more/notification/ToggleButton";
import NotificationCard from "../../../components/more/notification/NotificationCard";
import TimePickerDialog from "../../../components/more/notification/TimePickerDialog";

// 알림 항목 배열
// enabledKey / timeKey: 백엔드(notification_settings)의 컬럼명과 매핑
const NOTIFICATION_LIST = [
  { id: 'diary', label: '오늘 일기 채우기', time: '21:00', enabledKey: 'diary_enabled', timeKey: 'diary_time' },
  { id: 'attendance', label: '출석 체크 알림', time: '20:00', enabledKey: 'attendance_enabled', timeKey: 'attendance_time' },
  { id: 'notice', label: '공지사항, 이벤트 및 혜택 알림', time: null, enabledKey: 'notice_enabled', timeKey: null },
];

// 서버 설정값을 화면용 항목 배열로 변환
const applySettings = (settings) =>
  NOTIFICATION_LIST.map((item) => ({
    ...item,
    isOn: settings?.[item.enabledKey] ?? false,
    time: item.timeKey ? (settings?.[item.timeKey] ?? item.time) : null,
  }));

// 화면용 항목 배열을 서버 PATCH body로 변환 (보낼 키만 골라서 사용)
const toPayload = (items, ids) => {
  const payload = {};
  items
    .filter((item) => ids.includes(item.id))
    .forEach((item) => {
      payload[item.enabledKey] = item.isOn;
      if (item.timeKey) payload[item.timeKey] = item.time;
    });
  return payload;
};

const Notification = () => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 알림 활성화 여부 및 설정 시간 상태 관리
  const [notifications, setNotifications] = useState(() => applySettings(null));
  const [isLoaded, setIsLoaded] = useState(false); // 서버 설정을 불러오기 전에는 저장하지 않도록 방어

  // 다이얼로그 팝업 제어용 상태(State)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState(null);
  const [pickerCurrentTime, setPickerCurrentTime] = useState("00:00");

  // 화면 진입 시 저장된 알림 설정 불러오기
  useEffect(() => {
    let cancelled = false;

    authApi.getNotificationSettings()
      .then((settings) => {
        if (cancelled) return;
        setNotifications(applySettings(settings));
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("알림 설정 불러오기 실패:", err);
        if (!cancelled) toast("알림 설정을 불러오지 못했습니다");
      });

    return () => { cancelled = true; };
  }, []);

  // 변경 사항을 서버에 저장하고, 실패하면 이전 상태로 되돌림
  const saveChanges = async (next, changedIds, prev) => {
    setNotifications(next); // 화면은 먼저 반영 (낙관적 업데이트)
    try {
      await authApi.updateNotificationSettings(toPayload(next, changedIds));
    } catch (err) {
      console.error("알림 설정 저장 실패:", err);
      setNotifications(prev);
      toast("알림 설정 저장에 실패했습니다");
    }
  };

  // 전체 알림 켜짐 여부 판별(모든 항목의 isOn이 true인지 검사)
  const isAllOn = notifications.length > 0 && notifications.every(item => item.isOn === true);

  // 전체 알림 토글 제어
  const handleAllToggle = () => {
    if (!isLoaded) return;
    const nextState = !isAllOn;
    const next = notifications.map((item) => ({ ...item, isOn: nextState }));
    saveChanges(next, notifications.map((item) => item.id), notifications);
  };

  // 개별 항목 토글 제어
  const handleItemToggle = (id) => {
    if (!isLoaded) return;
    const next = notifications.map((item) =>
      item.id === id ? { ...item, isOn: !item.isOn } : item
    );
    saveChanges(next, [id], notifications);
  };

  // 시간 설정 팝업창 핸들러
  const handleCardTimeClick = (id, time) => {
    if (!isLoaded) return;
    setActiveCardId(id);
    setPickerCurrentTime(time);
    setIsPickerOpen(true);
  };

  // 확인 버튼 클릭 시 변경된 시간 반영
  const handleTimePickerConfirm = (newTime) => {
    const next = notifications.map((item) =>
      item.id === activeCardId ? { ...item, time: newTime } : item
    );
    saveChanges(next, [activeCardId], notifications);
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
              id={item.id}
              label={item.label}
              time={item.time}
              isOn={item.isOn}
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