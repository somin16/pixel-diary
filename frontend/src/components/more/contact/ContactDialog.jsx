import React, { useState } from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

const ContactDialog = ({ onCancel, onSend, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);
  
  // 상태 관리
  const [content, setContent] = useState("");
  const [error, setError] = useState(""); // 에러 상태 추가

  // 보내기 버튼 클릭 시
  const handleSend = () => {
    // 입력을 안했을 경우 메세지
    if (!content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }
    setError(""); // 성공 시 에러 초기화
    onSend(content);
  };

  return (
    <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
      <div className="w-full h-full flex flex-col items-center pb-[4%]">
        {/* 타이틀 */}
        <p className={`text-[13px] font-bold text-center m-0 ${!error ? 'mt-[1%]' : 'mt-[2%]'}`}>
          문의하고 싶은 내용을 입력하세요
        </p>

        {/* 입력창 영역 */}
        <div 
          className="w-[90%] mt-[4%] flex-1 p-[4%] flex flex-col relative bg-[length:100%_100%] bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'info_box_x3')})` 
          }}
        >
          <textarea
            className="w-full h-full pb-[4%] bg-transparent outline-none resize-none text-[12px] placeholder-[#9EA5C3]"
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (e.target.value.trim()) setError(""); // 입력 시 에러 즉시 제거
            }}
          />
        </div>

        {/* 에러 메시지 출력 (에러 있을 때만 렌더링) */}
        <div className="h-[8%] flex items-center justify-center mt-[2%] mb-[1%]">
          {error && (
            <p className="text-[#ef4444] text-[11px] font-bold m-0">{error}</p>
          )}
        </div>

        <div className="mt-auto flex gap-[5%] justify-center w-full">
          <ImageButton
            label="취소하기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
            onClick={onCancel}
          />
          <ImageButton
            label="보내기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
            onClick={handleSend}
          />
        </div>
      </div>
    </DialogBox>
  );
};

export default ContactDialog;