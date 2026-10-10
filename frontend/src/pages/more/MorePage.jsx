import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기
import { supabase } from "../../utils/SupabaseClient";
import { announcementApi } from "../../api/announcementApi"; // API 함수 목록
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";
import { useContactBadge } from "../../hooks/queries/useContactQueries"; // 문의 빨간 점

// zuStand 함수 불러오기
import { useGetCoinStore } from "../../stores/useCoinStore";

// 컴포넌트 불러오기
import ProfileBar from "../../components/more/profile/ProfileBar";
import Attendance from "../../components/more/attendance/AttendanceDialog";

// 배열 전역으로 선언
const menuItems = [
  { id: 'shop', label: '상점', iconName: 'shop_icon_x3', path: '/more/shop' },
  { id: 'storage', label: '보관함', iconName: 'inventory_icon_x3', path: '/more/inventory' },
  { id: 'attendance', label: '출석', iconName: 'daily_icon_x3' },
  { id: 'notice', label: '공지사항', iconName: 'info_icon_x3', path: '/more/announcement/list' },
  { id: 'contact', label: '문의 하기', iconName: 'help_center_icon_x3', path: '/more/contact' },
  { id: 'userlist', label: '유저 관리', iconName: 'setting_icon_x3', path: '/more/user-list' },
  { id: 'additem', label: '아이템 추가', iconName: 'setting_icon_x3', path: '/more/add-item' },
  { id: 'contactreply', label: '문의사항 답변', iconName: 'setting_icon_x3', path: '/more/contact-reply' },
];

// 관리자에게만 보이는 메뉴
const ADMIN_MENU_IDS = ['userlist', 'additem', 'contactreply'];

const MorePage = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 쿼리 클라이언트
  const queryClient = useQueryClient(); // 훅으로 가져오기

  // 더보기에서 조회를 하는편이 더 낫지 않을까? 해서 이쪽으로 옮겨봤습니다
  const { startGetCoin } = useGetCoinStore();

  // 출석 다이얼로그 열림 상태를 관리하는 상태
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  // 관리자 메뉴 표시 여부 (화면 표시용, 실제 권한은 RLS가 검사)
  const [isAdmin, setIsAdmin] = useState(false);

  // 빨간 점: React Query로 관리
  // - 조회 결과로 한 번에 값이 정해지므로 false로 초기화했다가 다시 true로 바뀌는 깜빡임 없음
  // - 앱 복귀(refetchOnWindowFocus), 로그아웃 시 캐시 삭제(queryClient.clear) 자동 적용
  // - 상대방이 바꾼 내용은 App.jsx의 useContactRealtime이 이 쿼리를 무효화해서 갱신
  const { data: badge } = useContactBadge();
  const hasUnreadReply = badge?.hasUnreadReply ?? false; // 일반 유저용
  const hasNewContact = badge?.hasNewContact ?? false;   // 관리자용

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setIsAdmin(session?.user?.app_metadata?.role === 'admin');
    });
 
    startGetCoin(); // 코인조회를 더보기 창에서 실행
 
    return () => {
      isMounted = false;
    };
  }, [startGetCoin]);

  useEffect(() => {
    // 더보기 화면 들어오면, 자주 가는 하위 화면 데이터 미리 당김
    // ‼️TODO: 각 담당자 API 완성되면 주석 해제 위치: src/pages/more/MorePage.jsx
    
    // queryClient.prefetchQuery({ queryKey: queryKeys.items, queryFn: storeApi.getItems });
    // queryClient.prefetchQuery({ queryKey: queryKeys.decoItems, queryFn: storeApi.getDecoItems });
    queryClient.prefetchQuery({ queryKey: queryKeys.announcements, queryFn: announcementApi.getList });
  }, []);

  // isAdmin 여부에 따라 메뉴 필터링
  const visibleMenuItems = menuItems.filter(
    (item) => !ADMIN_MENU_IDS.includes(item.id) || isAdmin
  );

  // 메뉴 클릭 핸들러 
  const handleMenuClick = (item) => {
    if (item.id === 'attendance') {
      setIsAttendanceOpen(true); // 출석 버튼이면 상태값 변경
    } else if (item.path) {
      navigate(item.path); // 그 외에는 페이지 이동
    }
  };

  return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div
      className="w-full h-full pt-[60px] pb-[30px] px-5 flex flex-col bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`
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
            src={getAssetUrl(currentTheme, 'icons', 'setting_icon_x3')}
            alt="설정"
            className="w-[50px] h-[50px]"
          />
        </button>
      </header>

      {/* 프로필 영역 */}
      <ProfileBar />

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

            {/* 텍스트 영역 */}
            <span className="relative inline-block mt-auto h-[20px] leading-[20px] text-xs font-bold text-center text-black whitespace-nowrap">
              {item.label}

              {/* [일반 유저용] '문의 하기' 글자 우상단 빨간 점 */}
              {item.id === 'contact' && hasUnreadReply && (
                <span className="absolute -top-[2px] -right-[10px] w-[6px] h-[6px] bg-red-500 rounded-full" />
              )}

              {/* [관리자용] '문의사항 답변' 글자 우상단 빨간 점 */}
              {item.id === 'contactreply' && hasNewContact && (
                <span className="absolute -top-[2px] -right-[10px] w-[6px] h-[6px] bg-red-500 rounded-full" />
              )}
            </span>
          </div>
        ))}
      </nav>

      {/* 출석 버튼을 누르면 출석 다이얼로그 렌더링, 닫기 누르면 state만 false로 변경 */}
      {isAttendanceOpen && (
        <Attendance onClose={() => setIsAttendanceOpen(false)} />
      )}
    </div>
  );
};

export default MorePage;