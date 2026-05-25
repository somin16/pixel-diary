import React from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";

/**
 * 토글 버튼 컴포넌트
 * @param {string} id - 알림 항목의 고유 ID (예: 'all', 'diary', 'notice')
 * @param {boolean} isOn - 현재 토글의 켜짐/꺼짐 상태
 * @param {function} onClick - 클릭 시 부모 컴포넌트에 id를 인자로 넘겨주는 핸들러 함수
 */
const ToggleButton = ({ id, isOn, onClick }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <button
      onClick={() => onClick(id)} // 클릭 시 어떤 아이템이 눌렸는지 id를 부모에게 던져줌
      className="absolute z-10 top-1/2 -translate-y-1/2 right-[4%] bg-transparent border-none p-0 cursor-pointer outline-none w-[16%]"
    >
      <img
        src={getAssetUrl(currentTheme, 'buttons', isOn ? 'toggle_button_on_x3' : 'toggle_button_off_x3')}
        alt={`${id} 토글 버튼`}
        className="w-full h-auto block"
      />
    </button>
  );
};

export default ToggleButton;