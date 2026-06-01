import React from "react";
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

/**
 * CategoryTabs 컴포넌트
 * 상점 및 보관함 등에서 카테고리를 분류할 때 사용하는 탭 컴포넌트
 * @param {Array} tabs - 탭 이름들이 담긴 배열 (예: ["모두", "스티커", "이모티콘", "테마"])
 * @param {string} activeTab - 현재 선택된 탭 이름
 * @param {function} setActiveTab - 탭을 클릭했을 때 상태를 변경하는 함수
 * @param {string} [marginTop="mt-[100px]"] - 상단 여백 클래스 (기본값 mt-[100px])
 * @param {string} [type="store"] - 이미지를 구분하기 위한 타입 ('store' 또는 'inventory')
 */

const CategoryTabs = ({ tabs, activeTab, setActiveTab, marginTop = "mt-[100px]", type = "store" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <div className={`w-full flex px-[10px] ${marginTop} gap-2 z-10`}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="relative flex-1 h-[38px] bg-transparent border-none flex items-center justify-center cursor-pointer"
        >
          {/* 선택 여부와 type에 따라 배경 이미지 동적 변경 (on/off) */}
          <img
            src={getAssetUrl(currentTheme, 'boxes', activeTab === tab ? `${type}_filter_box_on_x2` : `${type}_filter_box_off_x2`)}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            alt=""
          />
          {/* 선택 여부에 따라 텍스트 색상 변경 */}
          <span className={`relative z-10 text-xs font-bold ${activeTab === tab ? 'text-black' : 'text-[#666666]'}`}>
            {tab}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;