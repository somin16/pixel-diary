import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기
import styles from './Profile.module.css';

const Profile = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  현재 테마 상태
  const currentTheme = "winter_light"; 

  // 사용자 정보 상태 관리 (닉네임, 이메일, 수정 완료 메세지, 프로필 사진)
  // 나중에 context나 zuStand로 전역 관리 하는 게 좋을 듯
  const [nickname, setNickname] = useState("nickname"); // // TODO: API 연동 시 useState("")로 변경
  const [email, setEmail] = useState("email@email.com"); // // TODO: API 연동 시 useState("")로 변경
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); 
  const [profileImage, setProfileImage] = useState(null); 

  // 나중에 API로 전송할 실제 파일 
  const [selectedFile, setSelectedFile] = useState(null); 

  // 뒤로 가기 함수
  const handleBack = () => {
    navigate(-1);
  };

  // 수정하기 버튼 클릭 시
  const handleUpdate = async () => {
    
    // TODO: API 연동 시 api 파일에서 불러오기

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  return (
    // 전체 페이지를 감싸는 컨테이너(배경 이미지 깔림)
    <div className={styles.container}
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})`,
      backgroundSize: '100% 100%', // 컨테이너 크기에 이미지를 강제로 꽉 맞춤
    }}>
      
    {/* 상단 헤더 - 뒤로 가기 버튼 */}
    <header className={styles.header}>
        {/* 버튼 클릭 시 뒤로 가기 */}
        <button className={styles.backButton} onClick={handleBack}>
          <img src={getAssetUrl(currentTheme,'icons', 'back_icon_x3')} alt="뒤로 가기" />
        </button>
    </header>

    {/* 프로필 사진 영역 */}
    <section className={styles.profilePhotoArea}>
    <img 
    src={getAssetUrl(currentTheme, 'boxes', 'profile__image_box_x3')} 
    alt="프로필 프레임" 
    className={styles.photoFrame} 
    />
  
    {/* 클릭하면 파일 선택창 열리도록 */}
    <label htmlFor="profileImageInput" className={styles.photoContent}>
    <img 
      src={profileImage || getAssetUrl(currentTheme, 'icons', 'app_icon_x2')} 
      alt="프로필 사진" 
      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
    />
    </label>

    {/* 숨겨진 파일 input */}
    <input 
        id="profileImageInput"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;
      
      // 선택한 파일을 브라우저에서 바로 미리보기용 URL로 변환
      if (profileImage && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage); // 기존에 만들어둔 임시 URL이 있다면 메모리에서 지워줌
      }
      const previewUrl = URL.createObjectURL(file); // 임시 미리보기용 URL 생성
      setProfileImage(previewUrl); // 만든 주소로 화면에 사진 띄워줌
      setSelectedFile(file); // 서버로 보낼 파일 원본 저장
    }}
    />
    </section>

    {/* 입력 필드 영역 */}
      <section className={styles.inputArea}>
        
        {/* 닉네임 입력 그룹 */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>닉네임</label>
          <div className={styles.imageInputContainer}>
            {/* 배경이 되는 픽셀 박스 이미지 */}
            <img 
              src={getAssetUrl(currentTheme, 'boxes', 'profile__info_box_x3')}
              alt="입력칸 배경" 
              className={styles.inputBackgroundImage} 
            />
            {/* 그 위에 올라가는 투명한 실제 입력칸 */}
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              className={styles.transparentInput}
            />
          </div>
        </div>
        
        {/* 이메일 입력 그룹 - 클릭 불가 */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>이메일</label>
          <div className={styles.imageInputContainer}>
            <img 
              src={getAssetUrl(currentTheme, 'boxes', 'profile__info_box_x3')}
              alt="이메일 배경" 
              className={styles.inputBackgroundImage} 
            />
            <input 
              type="email" 
              value={email} 
              readOnly 
              className={`${styles.transparentInput} ${styles.readOnlyInput}`} 
            />
          </div>
        </div>
      </section>

      {/* 수정 완료 메시지 - 항상 공간을 차지하도록 Wrapper 추가 */}
      <div className={styles.messageWrapper}>
        {showSuccessMessage && (
        <p className={styles.successMessage}>정보가 수정되었습니다</p>
      )}
      </div>

      {/* 내 정보 수정하기 버튼 */}
      <button className={styles.updateButton} onClick={handleUpdate}>
        <img 
          src={getAssetUrl(currentTheme, 'buttons', 'profile__info_patch_button_x3')} 
          alt="수정하기 버튼" 
        />
        <span className={styles.buttonText}>내 정보 수정하기</span>
      </button>
    </div>
  );
};

export default Profile;