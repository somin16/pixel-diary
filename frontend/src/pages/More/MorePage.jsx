import React from "react";
import { useNavigate } from 'react-router-dom';
import styles from './MorePage.module.css';

// 공통 이미지 경로 변수 설정 (public 폴더 기준)
const ASSET_PATH = '/assets/more';

const MorePage = () => {
  // 페이지 이동 함수 생성
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 더보기 메뉴 데이터 배열 (효율적인 관리를 위해 사용) - map 함수로 한 번에 그릴 수 있음
  const menuItems = [
    { id: 'shop', label: '상점', icon: `${ASSET_PATH}/shop_icon_x3.png`, path: '/more/shop' },
    { id: 'storage', label: '보관함', icon: `${ASSET_PATH}/inventory_icon_x3.png`, path: '/more/inventory' },
    { id: 'attendance', label: '출석', icon: `${ASSET_PATH}/daily_icon_x3.png`, path: '/more/daily' },
    { id: 'notice', label: '공지사항', icon: `${ASSET_PATH}/info_icon_x3.png`, path: '/more/info' },
  ];

  return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div className={styles.container}>
      
      {/* 상단 설정 버튼 */}
      <header className={styles.header}>
        {/* 버튼 클릭 시 /setting 주소로 이동 */}
        <button className={styles.iconButton} onClick={() => navigate('/setting')}>
          <img src={`${ASSET_PATH}/setting_icon_x3.png`} alt="설정" />
        </button>
      </header>

      {/* 프로필 영역 */}
      {/* section 전체에 onClick을 걸어서, 이미지 어디를 누르든 이동하게 만듭니다. */}
      <section className={styles.profileSection} onClick={() => navigate('/profile')}>
        <img 
          src={`${ASSET_PATH}/profile_bar_box_x3.png`} 
          alt="프로필 및 구분선" 
          className={styles.profileImageCombined} 
        />
      </section>

      {/* 더보기 메뉴 아이콘 그리드 영역 */}
      <nav className={styles.menuGrid}>
        {/* menuItems 배열을 하나씩 꺼내어(map) 화면에 렌더링 */}
        {menuItems.map((item) => (
          <div 
            key={item.id}               // 리액트가 각 항목을 구분하기 위한 고유 ID
            className={styles.menuItem} // 개별 메뉴 아이콘과 글자를 감싸는 통
            onClick={() => navigate(item.path)} // 배열에 저장된 각자의 경로로 이동
          >
            {/* 아이콘 이미지 영역 */}
            <div className={styles.iconWrapper}>
              <img src={item.icon} alt={item.label} />
            </div>
            {/* 메뉴 글자 (상점, 보관함 등) */}
            <span className={styles.menuLabel}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default MorePage;