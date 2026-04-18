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

    // 날짜 계산 로직
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 이번 달의 첫날 요일 (0:일요일 ~ 6:토요일)
    const lastDate = new Date(year, month + 1, 0).getDate(); // 이번 달의 마지막 날짜 (예: 30, 31)

    // 그리드를 채울 전체 배열  (시작 요일 앞의 빈칸 + 실제 날짜)
    const days = Array.from({ length: firstDay }, () => null)
        .concat(Array.from({ length: lastDate }, (_, i) => i + 1));

    const CalendarStyle = { // 픽셀 아트 배경 이미지 & 비율 설정
        backgroundImage: `url(${getAssetUrl(currentTheme, 'calendars', 'calendar_basic_x3')})`,
        backgroundSize: '100% 100%', // 이미지를 박스 크기에 꽉 채움
        aspectRatio: '354/318', //비율을 유지해 픽셀 왜곡 방지
    };

    return (
        <div style={CalendarStyle} className="relative min-w-19/20 h-auto max-w-full flex flex-col">

            {/* 상단 헤더1: pixel calendar 표시 */}
            <span className="w-full h-[17%] flex justify-center items-center text-white text-3xl p-[1.5%]">Pixel Diary</span>

            {/* 상단 헤더2: 월 이동 버튼 및 연/월 표시 영역 */}
            <div className="relative w-full flex h-[9%]">
                
                {/* 중앙 년월 표시 (부모 div 안에서 절대 중앙 정렬) */}
                <div className="absolute w-full h-full flex items-center justify-center">
                    <span className=" text-black text-3xl">
                        {year}.{String(month + 1).padStart(2, '0')}
                    </span>
                </div>

                {/*왼쪽 버튼 모음 ( 투명 버튼 <> ) */}
                <div className="absolute w-[15%] pl-[3%] h-full flex items-center justify-between">
                    <button onClick={() => onMonthChange(-1)} className="w-5 h-7 flex items-center justify-center"/>
                        <span className="text-3xl">{String(month + 1)}</span>
                    <button onClick={() => onMonthChange(1)} className=" w-5 h-7 flex items-center justify-center"/>
                </div>
            </div>

            {/*내부 데이터 레이어(배경 위에 띄우기) */}
            <div className="absolute inset-0 flex flex-col mt-[26.5%] pl-[3%] pr-[9.5%]">

                {/* 요일 헤더 1. 일요일 시작 (일 월 화 수 목 금 토) */}
                <div className="grid grid-cols-7 w-full h-[9%] text-[13px] text-center items-center justify-center gap-[1.5%]">
                    {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* 날짜 그리드 */}
                <div className="w-full h-[87%] grid grid-cols-7 gap-[1%] ">
                    {days.map((day, i) => (
                        <div
                            key={i}
                            onClick={() => day && onDateClick(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                            className="aspect-[14/12] flex items-start pl-[8%] justify-start text-m "
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default Calendar;
