import React from "react";
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper";
import DialogBox from '../dialog/DialogBox';
import ImageButton from '../button/ImageButton';
import styles from './DialogBox.module.css';

/**
 * ResultDialog (결과 알림 창)
 * 로그아웃 완료, 회원 탈퇴 완료 등 단순 메시지 전달과 확인을 위한 팝업
 * 현재 로그아웃 완료, 회원 탈퇴 완료, 아이템 구매 완료에 쓰일 예정
 * @param {string|JSX.Element} message - 사용자에게 보여줄 메시지
 * @param {function} onConfirm - '확인' 버튼 클릭 시 실행할 함수
 */

const ResultDialog = ({ message, onConfirm }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  return (
    <DialogBox>
      {/* 메세지 텍스트 */}
      <p className={styles.dialogTitle} style={{ marginTop: '30px' }}>
        {message}
      </p>

      {/* 단일 확인 버튼 */}
      <ImageButton
        label="확인"
        imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
        onClick={onConfirm}
        className={styles.confirmButton} // 버튼 전용 클래스 적용
      />
    </DialogBox>
  );
};

export default ResultDialog;