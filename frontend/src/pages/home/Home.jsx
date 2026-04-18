import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 페이지 이동
import { getAssetUrl } from "../../utils/AssetHelper"; // 이미지 에셋 경로 유틸 함수
import { useTheme } from "../../hooks/useTheme"; // 테마 전역상태관리 커스텀 훅
import FloatingActionButton from "../../components/home/FloatingActionButton"; // FAB버튼 컴포넌트 불러오기
import Calendar from "../../components/home/Calendar"; // 달력 컴포넌트 불러오기

export default function Home() {
    const navigate = useNavigate(); // 페이지 이동

    // 현재 테마 상태
    const currentTheme = useTheme((state) => state.currentTheme) 
    
    // 동적 날짜 로직
    const [viewDate, setViewDate] = useState(new Date()); // 달력의 기준이 되는 날짜 상태 (오늘 날짜로 초기화)

    // 월 변경 핸들러: Calendar 컴포넌트에서 호출하면 부모의 상태를 업데이트
    const handleMonthChage = (offset) => {
        // 현재 viewDatef를 기준으로 새로운 Date 객체 생성
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    // 날짜 클릭 핸들러: 특정 날짜를 눌렀을 때의 동작 (라우팅)
    const handleDateClick = (dateString) => {
        navigate(`diary/write/${dateString}`);
    };

    // FAB 클릭 핸들러 (오늘 날짜 일기 쓰기로 바로 가기 등)
    const handleFabClick = () => {
        const today = new Date().toISOString().split('T')[0];
        handleDateClick(today);
    };

    // 인라인 스타일로 배경 이미지를 동적으로 적용
    const backgroundStyle = {
        backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds', 'background_x3')})`,
        backgroundSize: '100% 100%',
    };
    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={backgroundStyle}
        >
            <div className="w-full h-full flex items-center justify-center pb-[38%]">
                <Calendar
                    viewDate={viewDate}
                    currentTheme={currentTheme}
                    onMonthChange={handleMonthChage}
                    onDateClick={handleDateClick}
                />    
            </div>
            <div className="fixed w-20 h-auto bottom-[14%] right-[7%]">
                <FloatingActionButton
                    onClick={handleFabClick}
                />
            </div>
        </div>
    );
}
