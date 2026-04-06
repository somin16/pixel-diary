import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { getAssetUrl } from "../../utils/assetHelper"; // 헬퍼 불러오기
import styles from './MorePage.module.css';

const MorePage = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  현재 테마 상태 (나중에 Context나 Redux로 전역 관리하면 좋습니다)
  const currentTheme = "winter_light"; 

  // 사용자 정보 상태 관리
  // 나중에 context나 zuStand로 전역 관리 하는 게 좋을 듯
  const [nickname, setNickname] = useState("nickname"); // TODO: API 연동 시 useState("")로 변경
  const [email, setEmail] = useState("email@email.com"); // TODO: API 연동 시 useState("")로 변경
  const [profileImage, setProfileImage] = useState(null); 

  useEffect(() => {
    // TODO: API 연동 시 api 파일에서 불러오기
  }, [])

  const menuItems = [
    { id: 'shop', label: '상점', icon: getAssetUrl(currentTheme,'icon','shop_icon_x3'), path: '/more/shop' },
    { id: 'storage', label: '보관함', icon: getAssetUrl(currentTheme,'icon','inventory_icon_x3'), path: '/more/inventory' },
    { id: 'attendance', label: '출석', icon: getAssetUrl(currentTheme,'icon','daily_icon_x3'), path: '/more/daily' },
    { id: 'notice', label: '공지사항', icon: getAssetUrl(currentTheme,'icon','info_icon_x3'), path: '/more/info' },
  ];

  return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div className={styles.container}
    style={{ backgroundImage: `url(${getAssetUrl(currentTheme,'background','menu_background_x3')})`,
    backgroundSize: '100% 100%', // 컨테이너 크기에 이미지를 강제로 꽉 맞춤
    }}>
      
      {/* 상단 설정 버튼 */}
      <header className={styles.header}>
        {/* 버튼 클릭 시 /setting 주소로 이동 */}
        <button className={styles.settingIconButton} onClick={() => navigate('/more/setting')}>
          <img src={getAssetUrl(currentTheme,'icon', 'setting_icon_x3')} alt="설정" />
        </button>
      </header>

      {/* 프로필 영역 */}
      {/* section 전체에 onClick을 걸어서, 이미지 어디를 누르든 이동하게 만듦 */}
      <section className={styles.profileSection} onClick={() => navigate('/more/profile')}>
  
        <div className={styles.profileBarWrapper}>
          {/* 배경이 되는 박스+선 이미지 */}
          <img 
            src={getAssetUrl(currentTheme, 'box', 'profile_bar_box_x3')} 
            alt="프로필" 
            className={styles.profileBarBackground} 
          />

          {/* 그 위에 올라가는 프로필 사진 */}
          <img 
            src={profileImage || getAssetUrl(currentTheme, 'icon', 'app_icon_x2')}
            alt="프로필 사진"
            className={styles.profilePhoto}
          />

          {/* 그 위에 올라가는 닉네임 + 이메일 */}
          <div className={styles.profileInfo}>
            <span className={styles.profileNickname}>{nickname}</span>
            <span className={styles.profileEmail}>{email}</span>
          </div>

        </div>
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