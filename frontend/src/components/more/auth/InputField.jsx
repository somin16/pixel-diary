import React from "react";
import { useTheme } from "../../../store/useThemeStore"; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

/**
 * InputField (공통 입력창 컴포넌트)
 * 배경 이미지 위에 투명한 input을 얹어 구현하는 컴포넌트
 * @param {string} label - 입력창 상단에 표시될 라벨 텍스트 (생략 가능)
 * @param {string} type - input 태그의 타입 (text, password, email 등)
 * @param {string} value - 입력 필드의 현재 값 (상태 관리용)
 * @param {function} onChange - 값 변경 시 실행될 핸들러 함수
 * @param {string} placeholder - 입력값이 없을 때 보여줄 안내 문구
 * @param {string} boxImageName - 배경 이미지 파일명 (기본값: profile_info_box_x3)
 * @param {boolean} readOnly - 읽기 전용 여부 (true일 경우 텍스트 색상 변경 및 커서 금지 표시)
 * @param {string} textAlign - 텍스트 정렬 방식 ('left' 또는 'center')
 */

const InputField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  boxImageName = "info_box_x3", // 배경 이미지 기본값
  readOnly = false,
  textAlign = "left" // 정렬 옵션(left 또는 center)
}) => {
  // 테마 전역 관리  
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* 라벨 영역: 값이 전달되었을 때만 화면에 표시됨 */}
      {label && <label className="text-[13px] text-black">{label}</label>}
      
      {/* 배경 이미지 */}
      <div className="relative w-full h-11 flex items-center">
        <img
          src={getAssetUrl(currentTheme, 'boxes', boxImageName)}
          alt="입력창 배경"
          className={`absolute top-0 left-0 w-full h-full z-10 ${readOnly ? 'grayscale opacity-70' : ''}`}
        />

        {/* 실제 데이터를 입력받는 투명 input */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={readOnly}
          className={`relative z-20 w-full h-full bg-transparent border-none outline-none px-4 text-[13px]
            ${readOnly ? 'text-[#969696] cursor-not-allowed' : 'text-black'}
            ${textAlign === 'center' ? 'text-center' : 'text-left'}
          `}
        />
      </div>
    </div>
  );
};

export default InputField;