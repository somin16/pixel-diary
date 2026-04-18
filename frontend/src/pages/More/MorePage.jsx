import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

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

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 사용자 정보 상태 관리
  // 나중에 context나 zuStand로 전역 관리 하는 게 좋을 듯
  const [nickname, setNickname] = useState("nickname"); // TODO: API 연동 시 useState("")로 변경
  const [email, setEmail] = useState("email@email.com"); // TODO: API 연동 시 useState("")로 변경
  const [profileImage, setProfileImage] = useState(null); 

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
      {/* section 전체에 onClick을 걸어서, 이미지 어디를 누르든 이동하게 만듦 */}
      <section 
        className="mb-[40px] cursor-pointer flex justify-center w-full" 
        onClick={() => navigate('/more/profile')}
      >
        <div className="relative w-[90%] max-w-[350px] flex transition-transform duration-100 ease-in">
          
          {/* 배경이 되는 박스+선 이미지 */}
          <img 
            src={getAssetUrl(currentTheme, 'boxes', 'profile_bar_box_x3')} 
            alt="프로필" 
            className="w-full h-auto block" 
          />

          {/* 그 위에 올라가는 프로필 사진 */}
          <img 
            // profileImage가 null, undefined, 빈 문자열일 때 모두 방어
            src={profileImage ? profileImage : getAssetUrl(currentTheme, 'icons', 'app_icon_x2')}
            alt="프로필 사진"
            className="absolute left-[3.7%] top-[43.5%] -translate-y-1/2 w-[21.5%] aspect-square object-cover"
          />

          {/* 그 위에 올라가는 닉네임 + 이메일 */}
          <div className="absolute left-[29%] top-1/2 -translate-y-1/2 flex flex-col gap-[5px]">
            <span className="text-[16px] font-bold text-black">{nickname}</span>
            <span className="text-[12px] font-bold text-gray-500">{email}</span>
          </div>
        </div>
      </section>

      {/* 더보기 메뉴 아이콘 그리드 영역 */}
      <nav className="grid grid-cols-3 gap-x-[15px] gap-y-[30px] px-[10px]">
        {/* menuItems 배열을 하나씩 꺼내어(map) 화면에 렌더링 */}
        {menuItems.map((item) => (
          <div 
            key={item.id}               // 리액트가 각 항목을 구분하기 위한 고유 ID
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
    </div>
  );
};

export default MorePage;