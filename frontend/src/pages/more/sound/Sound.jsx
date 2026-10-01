import React from "react";
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import useMusicStore from '../../../stores/useMusicStore'; // 앱 배경음악 스토어
import useSoundEffectStore from '../../../stores/useSoundEffectStore'; // 앱 효과음 스토어

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ToggleButton from "../../../components/more/notification/ToggleButton";

const Sound = () => {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 음악: 스토어는 isMuted(꺼짐 여부)를 들고 있으므로 반대로 뒤집어서 사용
  const isMusicOn = useMusicStore((state) => !state.isMuted);
  const toggleMusic = useMusicStore((state) => state.toggleMute);

  // 효과음
  const isSoundEffectOn = useSoundEffectStore((state) => state.isSoundEffectOn);
  const toggleSoundEffect = useSoundEffectStore((state) => state.toggleSoundEffect);

  // 사운드 항목
  const soundItems = [
    { id: 'soundEffect', label: '효과음', isOn: isSoundEffectOn, onToggle: toggleSoundEffect },
    { id: 'music', label: '음악', isOn: isMusicOn, onToggle: toggleMusic },
  ];

  return (
    <div
      className="w-full h-screen overflow-hidden pt-[16%] pb-[8%] flex flex-col bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`
      }}
    >

      {/* 상단 헤더 */}
      <Header title="사운드 설정" />

      {/* 메인 컨텐츠 영역 */}
      <ul className="list-none p-0 m-0 w-full px-[6%] flex flex-col gap-[9%] mt-[5%]">
        {soundItems.map((item) => (
          <li key={item.id} className="relative w-full">
            <img
              src={getAssetUrl(currentTheme, 'boxes', 'alarm_all_list_box_x3')}
              alt={`${item.label} 배경`}
              className="relative w-full h-auto block"
            />
            <span className="absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-sm font-bold text-black whitespace-nowrap">
              {item.label}
            </span>

            {/* 토글 컴포넌트 */}
            <ToggleButton
              id={item.id}
              isOn={item.isOn}
              onClick={item.onToggle}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sound;