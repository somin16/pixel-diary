import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

/**
 * DuplicateDateDialog (날짜 중복 확인 창)
 * 날짜 변경 시 해당 날짜에 이미 일기가 존재할 때 띄우는 팝업
 *
 * @param {function} onConfirm - '확인하기' 버튼 클릭 시 → 해당 날짜 상세 페이지로 이동
 * @param {function} onCancel  - '취소' 버튼 클릭 시 → 다이얼로그 닫기 (날짜 변경 안됨)
 */
const DuplicateDateDialog = ({ onConfirm, onCancel, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    // DeleteDialog와 동일한 구조 사용 → 크기/비율 일치
    <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
      <p className="text-xs font-bold text-center m-0 mt-[11%] whitespace-pre-wrap">
        이 날짜에 이미 일기가 있어요. {"\n"} 확인하러 갈까요?
      </p>

      {/* 하단 버튼 영역 */}
      <div className="flex gap-[5%] justify-center w-full">
        <ImageButton
          label="취소"
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')}
          onClick={onCancel}
        />
        <ImageButton
          label="확인하기"
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
          onClick={onConfirm}
        />
      </div>
    </DialogBox>
  );
};

export default DuplicateDateDialog;