import React from "react";
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기
import styles from './DialogBox.module.css';

/**
 * DialogBox (로그아웃&회원탈퇴 확인용 팝업 전용 컴포넌트)
 * 상점 아이템 상세 정보 다이얼로그는 구조가 너무 달라서 다른 컴포넌트로 분리할 계획입니다
 * 일기 수정 중에 나갈 때 뜨는 경고 팝업과 구조가 같아서 쓰면 좋을 것 같습니다 (컴포넌트를 가져가서 본문 내용만 바꾸면 됩니다)
 * @param {React.ReactNode} children - 팝업 내부에 들어갈 본문 요소 (텍스트, 입력창 등)
 */

const DialogBox = ({ children }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  return (
    <div className={styles.dialog}>
      {/* 팝업창 배경 이미지 */}
      <img
        src={getAssetUrl(currentTheme, 'boxes', 'popup_message_box_x3')}
        alt="다이얼로그 배경"
        className={styles.dialogBg}
      />
      {/* 실제 내용이 담기는 컨테이너 */}
      <div className={styles.dialogContent}>
        {children}
      </div>
    </div>
  );
};

export default DialogBox;