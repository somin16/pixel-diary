import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import LogoutDialog from '../../components/dialog/LogoutDialog';
import WithdrawalDialog from '../../components/dialog/WithdrawalDialog';
import ResultDialog from '../../components/dialog/ResultDialog';

// 설정 메뉴 항목들 - 배열을 전역으로 선언
const settingItems = [
  { id: 'account', label: '계정 설정', path: '/more/setting/account' },
  { id: 'notification', label: '알림 설정', path: '/more/setting/notification' },
  { id: 'logout', label: '로그아웃', isDanger: true },
  { id: 'withdrawal', label: '회원탈퇴', isDanger: true },
];

const Setting = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 다이얼로그 상태 관리 'logout' | 'withdrawal' | null
  const [dialog, setDialog] = useState(null);
  // 결과 알림창 다이얼로그 상태 관리 'logout' | 'withdrawal' | null
  const [resultDialog, setResultDialog] = useState(null);

  // 뒤로 가기 함수
  const handleBack = () => {
    navigate(-1);
  };

  // 로그아웃 확인
  const handleLogout = () => {
    setDialog(null);
    setResultDialog('logout');
    // TODO: API 연동 시 코드 추가
  };

  // 회원탈퇴 확인
  const handleWithdrawal = (password) => {
    setDialog(null);
    setResultDialog('withdrawal');
    // TODO: API 연동 시 코드 추가
  };

  // 결과 확인 버튼 - 결과 확인 버튼 클릭 시 로그인 화면으로 이동
  const handleResultConfirm = () => {
    setResultDialog(null);
    navigate('/login');
  };

return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div 
      className="w-full h-screen overflow-hidden pt-[60px] pb-[30px] flex flex-col bg-[length:100%_100%]"
      style={{ 
        backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})`
      }}
    >
      
      {/* 상단 헤더 (뒤로 가기 & 제목) */}
      <header className="flex items-center justify-center relative mb-[50px] px-[20px]">
        {/* 버튼 클릭 시 뒤로 가기 */}
        <button 
          className="bg-transparent border-none cursor-pointer p-0 absolute left-[20px] top-1/2 -translate-y-1/2 outline-none" 
          onClick={handleBack}
        >
          <img 
            src={getAssetUrl(currentTheme,'icons', 'back_icon_x3')} 
            alt="뒤로 가기" 
            className="w-auto h-[40px]" 
          />
        </button>
        <h1 className="text-[36px] text-black m-0">설정</h1>
      </header>

      {/* 설정 메뉴 리스트 영역 */}
      <ul className="list-none p-0 m-0 flex flex-col">
        {settingItems.map((item) => (
          <li
            key={item.id}
            className="cursor-pointer w-full -mt-[4px] first:mt-0"
            onClick={() => {
              if (item.id === 'logout') setDialog('logout');
              else if (item.id === 'withdrawal') setDialog('withdrawal');
              else navigate(item.path);
            }}
          >
            {/* 메뉴 박스 이미지 */}
            <div className="relative w-full">
              <img 
                src={getAssetUrl(currentTheme, 'boxes', 'menu_box_x3')} 
                alt="메뉴 배경" 
                className="relative w-full h-auto block" 
              />
              <span 
                className={`absolute z-10 top-1/2 -translate-y-1/2 left-[25px] text-[16px] ${item.isDanger ? 'text-[#ef4444]' : 'text-black'}`}
              >
                {item.label}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* 어두운 배경 오버레이 */}
      {(dialog || resultDialog) && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 z-10" />
      )}

      {/* 로그아웃 다이얼로그 */}
      {dialog === 'logout' && (
        <LogoutDialog
          onConfirm={handleLogout}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* 회원탈퇴 다이얼로그 */}
      {dialog === 'withdrawal' && (
        <WithdrawalDialog
          onConfirm={handleWithdrawal}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* 로그아웃&회원탈퇴 완료 다이얼로그 */}
      {resultDialog && (
        <ResultDialog
          message={resultDialog === 'logout' ? '로그아웃 되었습니다' : <>회원 탈퇴가<br />완료 되었습니다</>}
          onConfirm={handleResultConfirm}
        />
      )}

    </div>
  );
};

export default Setting;