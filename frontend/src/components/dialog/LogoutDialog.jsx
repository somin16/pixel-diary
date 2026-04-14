import React from "react";
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper";
import DialogBox from '../dialog/DialogBox';
import ImageButton from '../button/ImageButton';
import styles from './DialogBox.module.css';

/**
 * LogoutDialog (로그아웃 확인 창)
 * 사용자가 로그아웃 버튼을 눌렀을 때 나타나는 확인 팝업
 * @param {function} onConfirm - '로그아웃' 버튼 클릭 시 실행할 함수
 * @param {function} onCancel - '취소하기' 버튼 클릭 시 실행할 함수
 */

const LogoutDialog = ({ onConfirm, onCancel }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  return (
    <DialogBox>
      {/* 다른 팝업창 텍스트 위치까지 바뀌는 걸 방지하기 위해 인라인 스타일로 넣음 */}
      <p className={styles.dialogTitle} style={{ marginTop: '30px' }}> 
        로그아웃 하시겠습니까?
      </p>

      {/* 하단 버튼 영역 */}
      <div className={styles.dialogButtons}>
        <ImageButton
          label="로그아웃"
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')}
          onClick={onConfirm}
        />
        <ImageButton
          label="취소하기"
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
          onClick={onCancel}
        />
      </div>
    </DialogBox>
  );
};

export default LogoutDialog;