import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../store/useThemeStore"; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

/**
 * Header (공통 상단 헤더)
 * @param {string} title - 페이지 제목 (없으면 뒤로 가기 버튼만 표시)
 * @param {string} [backPath] - 명시적으로 이동할 특정 경로 (예: '/more')
 */

const Header = ({ title, backPath }) => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 뒤로 가기 동작을 처리하는 커스텀 함수
  const handleBack = () => {
    if (backPath) {
      // 명시된 경로가 있으면 해당 경로로 이동 (기존 히스토리를 덮어씀)
      navigate(backPath, { replace: true });
    } else {
      // 없으면 기본 뒤로 가기
      navigate(-1);
    }
  };

  return (
    <header className="flex items-center justify-center relative mb-12.5 px-5 w-full h-16 shrink-0">
      {/* 뒤로 가기 버튼 */}
      <button
        className="bg-transparent border-none cursor-pointer p-0 absolute left-5 top-1/2 -translate-y-1/2 outline-none transition-transform"
        onClick={handleBack}
      >
        <img
          src={getAssetUrl(currentTheme, 'icons', 'back_icon_x3')}
          alt="뒤로 가기"
          className="w-auto h-10"
        />
      </button>

      {/* 제목이 있을 때만 표시 */}
      {title && (
        <h1 className="text-3xl text-black m-0 select-none">
          {title}
        </h1>
      )}
    </header>
  );
};

export default Header;