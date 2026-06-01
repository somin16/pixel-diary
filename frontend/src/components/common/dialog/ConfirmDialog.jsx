import React from "react";
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import DialogBox from './DialogBox';
import ImageButton from '../ImageButton';

/**
 * ConfirmDialog (확인/취소 선택 팝업)
 * 답변 삭제, 변경 취소 등 유저의 최종 승인/취소 선택이 필요한 상황에 사용
 * @param {string|JSX.Element} message - 사용자에게 보여줄 안내 메시지
 * @param {function} onConfirm - '확인' 버튼 클릭 시 실행할 함수
 * @param {function} onCancel - '취소' 버튼 클릭 시 실행할 함수
 * @param {string} boxImageName - 배경 이미지 파일명
 * @param {string} [width="100%"] - 다이얼로그의 가로 길이 (기본값: "100%")
 * @param {string} [maxWidth="360px"] - 다이얼로그의 최대 가로 길이 (기본값: "360px")
 * @param {string} [textMt="mt-[10%]"] - 메시지 텍스트의 상단 여백 클래스 (기본값: "mt-[10%]") 
 * @param {string} [textSize="text-xs"] - 메시지 텍스트의 크기 클래스 (기본값: "text-xs")
*/
const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel,
  boxImageName,
  width = "100%",
  maxWidth = "360px",
  textMt = "mt-[10%]",
  textSize = "text-xs"
}) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <DialogBox boxImageName={boxImageName} width={width} maxWidth={maxWidth}>
      {/* 메세지 텍스트 (\n 대응을 위해 whitespace-pre-wrap 적용) */}
      <p className={`text-xs font-bold text-center m-0 whitespace-pre-wrap ${textMt} ${textSize}`}>
        {message}
      </p>

      {/* 버튼 배치 */}
      <div className="flex gap-[4%] justify-center w-full mt-[8%]">
        <div className="flex-1">
          <ImageButton
            label="취소"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
            onClick={onCancel}
          />
        </div>
        <div className="flex-1">
          <ImageButton
            label="확인"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
            onClick={onConfirm}
          />
        </div>
      </div>
    </DialogBox>
  );
};

export default ConfirmDialog;