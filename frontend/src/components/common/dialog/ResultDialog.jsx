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
 * @param {string} [width="auto"] - 다이얼로그의 가로 길이 (기본값: "auto")
 * @param {string} [maxWidth="360px"] - 다이얼로그의 최대 가로 길이 (기본값: "360px")
 * @param {string} [textMt="mt-[10%]"] - 메시지 텍스트의 상단 여백 클래스 (기본값: "mt-[10%]") 
 * @param {string} [textSize="text-[13px]"] - 메시지 텍스트의 크기 클래스 (기본값: "text-[13px]")
*/

const ResultDialog = ({ message, onConfirm, boxImageName, width = "100%", maxWidth = "360px", textMt = "mt-[10%]", textSize = "text-[13px]"}) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  
  return (
    <DialogBox boxImageName={boxImageName} width={width} maxWidth={maxWidth}>
      {/* 메세지 텍스트 */}
      <p className={`text-[13px] font-bold text-center m-0 ${textMt} ${textSize}`}>
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