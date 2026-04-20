import React from "react";
import { useTheme } from '../../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import DialogBox from './DialogBox';
import ImageButton from '../ImageButton';

/**
 * ResultDialog (결과 알림 창)
 * 로그아웃 완료, 회원 탈퇴 완료, 아이템 구매 완료 등 단순 메시지 전달과 확인을 위한 팝업
 * @param {string|JSX.Element} message - 사용자에게 보여줄 메시지
 * @param {function} onConfirm - '확인' 버튼 클릭 시 실행할 함수
 * @param {string} boxImageName - 배경 이미지 파일명 (기본값: popup_message_box_x3)
 */

const ResultDialog = ({ message, onConfirm, boxImageName }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  
  return (
    <DialogBox boxImageName={boxImageName}>
      {/* 메세지 텍스트 */}
      <p className="text-[13px] font-bold text-center m-0 mt-[25px]">
        {message}
      </p>

      {/* 단일 확인 버튼 */}
      <ImageButton
        label="확인"
        imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
        onClick={onConfirm}
      />
    </DialogBox>
  );
};

export default ResultDialog;