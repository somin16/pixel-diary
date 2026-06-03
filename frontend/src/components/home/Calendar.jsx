import { useState } from "react";
import { getAssetUrl } from "../../utils/AssetHelper";

/**
 * @typedef {Object} CalendarProps
 * @property {Date} viewDate - 메인 페이지에서 관리 중인 기준 날짜
 * @property {string} currentTheme - 현재 앱의 테마 (테두리 색상 등에 활용)
 * @property {function(string): void} onDateClick - 날짜 클릭 시 해당 날짜(YYYY-MM-DD)를 인자로 받는 핸들러
 * @property {function(number): void} onMonthChange - 월 변경 핸들러 (offset 인자: -1 또는 1)
 */

/**
 * 캘린더 컴포넌트
 * @param {CalendarProps} props
 */

const Calendar = ({ onDateClick, onMonthChange, viewDate, currentTheme }) => {

  // 날짜 데이터 계산 로직
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 이번 달의 첫날 요일 (0:일요일 ~ 6:토요일) -> 지난달 날짜를 몇 칸 채울지 결정
  const lastDate = new Date(year, month + 1, 0).getDate(); // 이번 달의 마지막 날짜 (예: 30, 31)
  const lastMonthDate = new Date(year, month, 0).getDate(); // 지난 달의 마지막 날짜 -> 지난달 날짜를 역순으로 채우기 위해 필요

  const days = [];

  // 오늘 날짜는 강조 표시하기 위한 변수
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // 지난달 날짜 채우기
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: lastMonthDate - i, type: 'last' });
  }
  // 이번달 날짜 채우기
  for (let i = 1; i <= lastDate; i++) {
    days.push({ day: i, type: 'current' });
  }
  // 다음달 날짜 채우기 (무조건 42칸이 될 때까지) <6주를 맞춰서 그리드 비어보임 방지>
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, type: 'next' });
  }

  const CalendarStyle = { // 픽셀 아트 배경 이미지 & 비율 설정
    backgroundImage: `url(${getAssetUrl(currentTheme, 'calendars', 'calendar_window_x3')})`,
    backgroundSize: '100% 100%', // 이미지를 박스 크기에 꽉 채움
    aspectRatio: '354/357', //비율을 유지해 픽셀 왜곡 방지
  };

  return (
    <div style={CalendarStyle} className="relative min-w-19/20 h-auto max-w-full flex flex-col">

      {/* 상단 타이틀 헤더: pixel calendar 표시 */}
      <span className="w-full h-[15%] flex justify-center items-center text-white text-2xl p-[1.5%]">Pixel Diary</span>

      {/* 연/월 네비게이션: 월 이동 버튼 및 연/월 표시 영역 */}
      <div className="relative w-full flex h-[9%]">

        {/* 중앙 년월 표시 */}
        <div className="absolute w-full h-full flex items-center justify-center">
          <span className=" text-black text-lg">
            {year}.{String(month + 1).padStart(2, '0')}
          </span>
        </div>

        {/*왼쪽 버튼 모음 ( 투명 버튼 <> ) */}
        <div className="absolute w-[15%] pl-[3%] h-full flex items-center justify-between">
          <button onClick={() => onMonthChange(-1)} className="w-5 h-7 flex items-center justify-center outline-none" aria-label="이전 달" />
          <span className="text-2xl">{String(month + 1)}</span>
          <button onClick={() => onMonthChange(1)} className=" w-5 h-7 flex items-center justify-center outline-none" aria-label="다음 달" />
        </div>
      </div>

      {/*내부 데이터 레이어(배경 위에 띄우기) */}
      <div className="absolute inset-0 flex flex-col mt-[26%] pl-[2.5%] pr-[9.5%]">

        {/* 요일 헤더 1. 일요일 시작 (일 월 화 수 목 금 토) */}
        <div className="grid grid-cols-7 w-full h-[8%] text-xs text-center items-center justify-center gap-[1.5%]">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, index) =>
            <div
              className={`
                            ${index === 0 ? 'text-red-800' : ''} // 일요일: 빨간색
                            ${index === 6 ? 'text-blue-800' : ''} // 토요일: 파란색
                        `}
              key={d}
            >
              {d}
            </div>
          )}
        </div>

        {/* 날짜 그리드 */}
        <div className="w-full h-[88%] grid grid-cols-7 gap-[1%] ">
          {days.map((item, i) => {
            const isSunday = i % 7 === 0;                   // 일요일 여부
            const isSaturday = i % 7 === 6;                 // 토요일 여부
            const isNotCurrent = item.type !== 'current';   // 저번 / 다음달 여부 판별

            // 오늘 날짜 여부 판별
            const isToday =
              item.type === 'current' &&
              item.day === todayDate &&
              year === todayYear &&
              month === todayMonth;
            return (
              <div
                key={`${item.type}-${item.day}-${i}`}
                // 이번 달 날짜만 클릭 가능하도록 핸들러 제안 (조건문)
                onClick={() => !isNotCurrent && onDateClick(`${year}-${String(month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`)}
                className={`
                                    aspect-[14/12] flex items-start pl-[5%] pt-[1%] justify-start text-xs
                                    ${isNotCurrent ? 'opacity-50 grayscale' : 'cursor-pointer'} // 이번달 아니면 흐리게 처리
                                    ${isSunday ? 'text-red-800' : isSaturday ? 'text-blue-800' : 'text-black'}
                                    ${isToday ? 'bg-blue-200/50 rounded font-bold' : ''} // 오늘 날짜 강조
                                `}
              >
                {item.day}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Calendar;
