import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

const SaveErrorDialog = ({ type, onClose, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  const message = type === 'duplicate'
    ? `이 날짜에 이미 일기가 있어요.\n다른 날짜를 선택해 주세요.`
    : `저장 중 오류가 발생했어요.\n잠시 후 다시 시도해 주세요.`;

  return (
    <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
      <p className="text-[13px] font-bold text-center m-0 mt-[11%] whitespace-pre-wrap">
        {message}
      </p>
      <div className="flex justify-center w-full">
        <ImageButton
          label="확인"
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
          onClick={onClose}
        />
      </div>
    </DialogBox>
  );
};

export default SaveErrorDialog;