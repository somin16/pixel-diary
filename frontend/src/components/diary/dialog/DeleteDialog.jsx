import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

/**
 * DeleteDialog (일기 삭제 확인 창)
 * @param {function} onConfirm - '삭제하기' 버튼 클릭 시 실행할 함수
 * @param {function} onCancel - '취소하기' 버튼 클릭 시 실행할 함수
 */
const DeleteDialog = ({ onConfirm, onCancel, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
      <p className="text-[13px] font-bold text-center m-0 mt-[11%] whitespace-pre-wrap">
        정말 이 일기를 삭제할까요? {"\n"} 삭제된 데이터는 복구할 수 없습니다.
      </p>

      {/* 하단 버튼 영역 */}
      <div className="flex gap-[5%] justify-center w-full">
        <ImageButton
          label="삭제하기"
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

export default DeleteDialog;