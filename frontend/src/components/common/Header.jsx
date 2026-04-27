import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme"; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

/**
 * Header (공통 상단 헤더)
 * @param {string} title - 페이지 제목 (없으면 뒤로 가기 버튼만 표시)
 */

const Header = ({ title }) => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <header className="flex items-center justify-center relative mb-[50px] px-[20px] w-full h-[60px] shrink-0">
      {/* 뒤로 가기 버튼 */}
      <button 
        className="bg-transparent border-none cursor-pointer p-0 absolute left-[20px] top-1/2 -translate-y-1/2 outline-none transition-transform" 
        onClick={() => navigate(-1)}
      >
        <img 
          src={getAssetUrl(currentTheme, 'icons', 'back_icon_x3')} 
          alt="뒤로 가기" 
          className="w-auto h-[40px]" 
        />
      </button>

      {/* 제목이 있을 때만 표시 */}
      {title && (
        <h1 className="text-[36px] text-black m-0 select-none">
          {title}
        </h1>
      )}
    </header>
  );
};

export default Header;