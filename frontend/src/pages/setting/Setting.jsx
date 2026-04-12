import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기
import styles from './Setting.module.css';
import LogoutDialog from '../../components/dialog/LogoutDialog';
import WithdrawalDialog from '../../components/dialog/WithdrawalDialog';
import ResultDialog from '../../components/dialog/ResultDialog';

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

  // 설정 메뉴 항목들
  const settingItems = [
    { id: 'account', label: '계정 설정', path: '/more/setting/account' },
    { id: 'notification', label: '알림 설정', path: '/more/setting/notification' },
    { id: 'logout', label: '로그아웃', isDanger: true },
    { id: 'withdrawal', label: '회원탈퇴', isDanger: true },
  ];

  return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div className={styles.container}
      style={{ 
        backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})`,
        backgroundSize: '100% 100%',
      }}>
      
      {/* 상단 헤더 (뒤로 가기 & 제목) */}
      <header className={styles.header}>
        {/* 버튼 클릭 시 뒤로 가기 */}
        <button className={styles.backButton} onClick={handleBack}>
          <img src={getAssetUrl(currentTheme,'icons', 'back_icon_x3')} alt="뒤로 가기" className={styles.backIcon} />
        </button>
        <h1 className={styles.title}>설정</h1>
      </header>

      {/* 설정 메뉴 리스트 영역 */}
      <ul className={styles.settingsList}>
        {settingItems.map((item) => (
          <li
            key={item.id}
            className={styles.settingsItem}
            onClick={() => {
              if (item.id === 'logout') setDialog('logout');
              else if (item.id === 'withdrawal') setDialog('withdrawal');
              else navigate(item.path);
            }}
          >
            {/* 메뉴 박스 이미지 */}
            <div className={styles.menuItemWrapper}>
              <img 
                src={getAssetUrl(currentTheme, 'boxes', 'menu_box_x3')} 
                alt="메뉴 배경" 
                className={styles.menuItemBg} 
              />
              <span className={`${styles.settingsText} ${item.isDanger ? styles.dangerText : ''}`}>
                {item.label}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* 어두운 배경 오버레이 */}
      {(dialog || resultDialog) && (
        <div className={styles.overlay} />
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