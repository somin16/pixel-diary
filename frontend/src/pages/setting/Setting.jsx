import React from "react";
import { useNavigate } from 'react-router-dom';
import { getAssetUrl } from "../../utils/assetHelper"; // 헬퍼 불러오기
import styles from './Setting.module.css';

const Setting = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  현재 테마 상태
  const currentTheme = "winter_light"; 

  // 뒤로 가기 함수
  const handleBack = () => {
    navigate(-1);
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
            onClick={() => navigate(item.path)}
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

    </div>
  );
};

export default Setting;