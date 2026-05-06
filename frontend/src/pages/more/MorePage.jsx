import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import ProfileBar from "../../components/more/profile/ProfileBar";
import Attendance from "../attendance/Attendance"; // 출석

// 배열 전역으로 선언
const menuItems = [
  { id: 'shop', label: '상점', iconName: 'shop_icon_x3', path: '/more/shop' },
  { id: 'storage', label: '보관함', iconName: 'inventory_icon_x3', path: '/more/inventory' },
  { id: 'attendance', label: '출석', iconName: 'daily_icon_x3', path: '/more/daily' },
  { id: 'notice', label: '공지사항', iconName: 'info_icon_x3', path: '/more/info' },
];

const MorePage = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 현재 주소 확인
  const location = useLocation(); 
  
  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 현재 주소가 '/more/daily'일 때만 true가 됨
  const isAttendanceOpen = location.pathname === '/more/daily';

  // 사용자 정보 상태 관리
  // 나중에 context나 zuStand로 전역 관리 하는 게 좋을 듯
  const [user] = useState({
  nickname: "nickname", // TODO: API 연동 시 useState("")로 변경
  email: "email@email.com", // TODO: API 연동 시 useState("")로 변경
  profileImage: null
  });

  useEffect(() => {
    // TODO: API 연동 시 api 파일에서 불러오기
  }, [])

return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div 
      className="w-full h-full pt-[60px] pb-[30px] px-5 flex flex-col bg-[length:100%_100%]"
      style={{ 
        backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})`
      }}
    >
      
      {/* 상단 설정 버튼 */}
      <header className="flex justify-end mb-[10px] pr-[15px]">
        {/* 버튼 클릭 시 /setting 주소로 이동 */}
        <button 
          className="bg-transparent border-none cursor-pointer p-0 transition-transform duration-100 outline-none" 
          onClick={() => navigate('/more/setting')}
        >
          <img 
            src={getAssetUrl(currentTheme,'icons', 'setting_icon_x3')} 
            alt="설정" 
            className="w-[50px] h-[50px]" 
          />
        </button>
      </header>

      {/* 프로필 영역 */}
      <ProfileBar 
        nickname={user.nickname} 
        email={user.email} 
        profileImage={user.profileImage} 
      />

      {/* 더보기 메뉴 아이콘 그리드 영역 */}
      <nav className="grid grid-cols-3 gap-x-[15px] gap-y-[30px] px-[10px]">
        {/* menuItems 배열을 하나씩 꺼내어(map) 화면에 렌더링 */}
        {menuItems.map((item) => (
          <div 
            key={item.id} // 리액트가 각 항목을 구분하기 위한 고유 ID
            className="flex flex-col items-center cursor-pointer transition-transform duration-100 ease-in h-[100px] justify-start" // 개별 메뉴 아이콘과 글자를 감싸는 통
            onClick={() => navigate(item.path)} // 배열에 저장된 각자의 경로로 이동
          >
            {/* 아이콘 이미지 영역 */}
            <div className="w-full h-full flex justify-center items-center mb-[8px]">
              <img 
                src={getAssetUrl(currentTheme, 'icons', item.iconName)} // getAssetUrl 함수
                alt={item.label} 
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
            {/* 메뉴 글자 (상점, 보관함 등) */}
            <span className="mt-auto h-[20px] leading-[20px] text-[14px] font-bold text-center text-black whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* 주소가 /more/daily 일 때만 출석 다이얼로그 렌더링. 닫기 누르면 이전 주소(/more)로 돌아감 */}
      {isAttendanceOpen && (
        <Attendance onClose={() => navigate(-1)} /> 
      )}

    </div>
  );
};

export default MorePage;