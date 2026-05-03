import React from "react";
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import DialogBox from '../../common/dialog/DialogBox';
import ImageButton from '../../common/ImageButton';

/**
 * LogoutDialog (로그아웃 확인 창)
 * 사용자가 로그아웃 버튼을 눌렀을 때 나타나는 확인 팝업
 * @param {function} onConfirm - '로그아웃' 버튼 클릭 시 실행할 함수
 * @param {function} onCancel - '취소하기' 버튼 클릭 시 실행할 함수
 * @param {string} [width="100%"] - 다이얼로그의 가로 너비 (기본값: "100%")
 * @param {string} [maxWidth="320px"] - 다이얼로그의 최대 가로 너비 (기본값: "320px") -> 상한선 값이기 때문에 px로 유지
 */

const LogoutDialog = ({ onConfirm, onCancel, width = "100%", maxWidth = "320px" }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  return (
    <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
      <p className="text-[13px] font-bold text-center m-0 mt-[11%]"> 
        로그아웃 하시겠습니까?
      </p>

      {/* 하단 버튼 영역 */}
      <div className="flex gap-[5%] justify-center w-full">
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