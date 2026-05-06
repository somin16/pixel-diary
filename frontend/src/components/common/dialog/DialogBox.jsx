import React from "react";
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

/**
 * DialogBox (어두운 배경이 오버레이로 들어가는 다이얼로그 컴포넌트)
 * @param {string} boxImageName - 'boxes' 카테고리의 배경 이미지 파일명 (기본값: popup_message_box_x3)
 * @param {React.ReactNode} children - 팝업 내부에 들어갈 본문 요소 (텍스트, 입력창 등)
 * @param {string} width - 가로 너비 (기본값: "auto")
 * @param {string} maxWidth - 최대 가로 너비 (기본값: "360px") -> 상한선 값이기 때문에 px로 유지
 * @param {function} onClose - 오버레이(어두운 배경) 클릭 시 다이얼로그를 닫는 함수
 */

const DialogBox = ({ boxImageName = 'popup_message_box_x3', children, width = "auto", maxWidth = "360px", onClose }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <>
      {/* 어두운 배경 오버레이 */}
      <div 
        className="fixed top-0 left-0 w-full h-full bg-black/60 z-40" 
        onClick={onClose}  
      />

      {/* 다이얼로그 본체 컨테이너 (화면 중앙 정렬) */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
        style={{ width: width, maxWidth: maxWidth }}
      >
        
        {/* 배경 이미지 (넘겨받은 boxImageName에 따라 동적으로 변경됨) */}
        <img
          src={getAssetUrl(currentTheme, 'boxes', boxImageName)}
          alt="다이얼로그 배경"
          className="w-full h-auto block"
        />

        {/* 실제 내용이 담기는 영역 (이미지 위에 absolute로 배치) */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-between p-6">
          {children}
        </div>
      </div>
    </>
  );
};

export default DialogBox;