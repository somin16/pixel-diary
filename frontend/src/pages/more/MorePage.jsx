import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기
import { supabase } from "../../utils/SupabaseClient";

// zuStand 함수 불러오기
import { useGetCoinStore } from "../../store/useCoinStore";

// 컴포넌트 불러오기
import ProfileBar from "../../components/more/profile/ProfileBar";
import Attendance from "../../components/more/attendance/AttendanceDialog"; // 출석
import ContactDialog from "../../components/more/contact/ContactDialog"; 
import ResultDialog from '../../components/common/dialog/ResultDialog';

// 배열 전역으로 선언
const menuItems = [
  { id: 'shop', label: '상점', iconName: 'shop_icon_x3', path: '/more/shop' },
  { id: 'storage', label: '보관함', iconName: 'inventory_icon_x3', path: '/more/inventory' },
  { id: 'attendance', label: '출석', iconName: 'daily_icon_x3' },
  { id: 'notice', label: '공지사항', iconName: 'info_icon_x3', path: '/more/announcement/list' },
  { id: 'notification', label: '알림 설정', iconName: 'alarm_icon_x3', path: '/more/notification' },
  { id: 'contact', label: '문의 하기', iconName: 'help_center_icon_x3' },
  { id: 'userlist', label: '유저 관리', iconName: 'setting_icon_x3', path: '/more/user-list'},
  { id: 'additem', label: '아이템 추가', iconName: 'setting_icon_x3', path: '/more/add-item' },
];

const MorePage = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 현재 주소 확인
  const location = useLocation(); 
  
  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 출석 다이얼로그 열림 상태를 관리하는 상태
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  // 문의하기 다이얼로그 상태 관리
  const [activeDialog, setActiveDialog] = useState(null); 
  const [resultDialog, setResultDialog] = useState(null);

  // 관리자 권한 확인
  const [isAdmin, setIsAdmin] = useState(false);

  // 사용자 정보 상태 관리
  // 나중에 context나 zuStand로 전역 관리 하는 게 좋을 듯
  const [user] = useState({
  nickname: "nickname", // TODO: API 연동 시 useState("")로 변경
  email: "email@email.com", // TODO: API 연동 시 useState("")로 변경
  profileImage: null
  });

  // 더보기에서 조회를 하는편이 더 낫지 않을까? 해서 이쪽으로 옮겨봤습니다
  const { startGetCoin } = useGetCoinStore();

  useEffect(() => {
        // 세션에서 role 확인
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const role = session?.user?.user_metadata?.role;
            setIsAdmin(role === 'admin');
        };
        checkAdmin();
        startGetCoin(); // 코인조회를 더보기 창에서 실행
    }, []);

    // isAdmin 여부에 따라 메뉴 필터링
    const visibleMenuItems = menuItems.filter(
        (item) => (item.id !== 'userlist' && item.id !== 'additem') || isAdmin
    );

  // 메뉴 클릭 핸들러 
  const handleMenuClick = (item) => {
    if (item.id === 'attendance') {
      setIsAttendanceOpen(true); // 출석 버튼이면 상태값 변경
    } else if (item.id === 'contact') { 
      setActiveDialog('contact'); // 문의하기 버튼이면 상태값 변경
    } else if (item.path) {
      navigate(item.path); // 그 외에는 페이지 이동
    }
  };

  // ContactDialog의 결과를 받아 처리
  const handleContactResult = (isSuccess) => {
    setActiveDialog(null); // 입력 다이얼로그 닫기

    if (isSuccess) {
      setResultDialog('contact_success'); // 성공 시
    } else {
      setResultDialog('contact_error'); // 실패 시
    }
  };

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
        {visibleMenuItems.map((item) => (
          <div 
            key={item.id} // 리액트가 각 항목을 구분하기 위한 고유 ID
            className="flex flex-col items-center cursor-pointer transition-transform duration-100 ease-in h-[100px] justify-start" // 개별 메뉴 아이콘과 글자를 감싸는 통
            onClick={() => handleMenuClick(item)} // 배열에 저장된 각자의 경로로 이동
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
        <Attendance onClose={() => setIsAttendanceOpen(false)} /> 
      )}

      {/* 문의 입력 다이얼로그 */}
      {activeDialog === 'contact' && (
        <ContactDialog 
          onCancel={() => setActiveDialog(null)} 
          onResult={handleContactResult}
          maxWidth="320px"
        />
      )}

      {/* 문의 완료 결과 다이얼로그 */}
      {resultDialog === 'contact_success' && (
        <ResultDialog 
          message={<>문의가 성공적으로 <br /> 접수되었습니다</>}
          onConfirm={() => setResultDialog(null)}
          maxWidth="320px"
        />
      )}

      {/* 문의 실패 에러 다이얼로그 */}
      {resultDialog === 'contact_error' && (
        <ResultDialog 
          message={<>일시적인 오류로<br />전송에 실패했습니다.<br />잠시 후 다시 시도해주세요.</>}
          onConfirm={() => setResultDialog(null)}
          maxWidth="320px"
        />
      )}
    </div>
  );
};

export default MorePage;