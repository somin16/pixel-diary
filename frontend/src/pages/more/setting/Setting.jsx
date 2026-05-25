import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { supabase } from "../../../utils/SupabaseClient"; // supabase 불러오기

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";

// 설정 메뉴 항목들 - 배열을 전역으로 선언
const settingItems = [
  { id: 'account', label: '계정 설정', path: '/more/setting/account' },
  { id: 'lock', label: '잠금 설정', path: '/more/setting/lock' },
  { id: 'info', label: 'Pixel Diary 정보', path: '/more/setting/info' },
  { id: 'version', label: '앱 버전 1.0.0' },
];

const Setting = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div
      className="w-full h-screen overflow-hidden pt-[16%] pb-[8%] flex flex-col bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`
      }}
    >

      {/* 상단 헤더 (뒤로 가기 & 제목) */}
      <Header title="설정" />

      {/* 설정 메뉴 리스트 영역 */}
      <ul className="list-none p-0 m-0 flex flex-col">
        {settingItems.map((item) => (
          <li
            key={item.id}
            className="cursor-pointer w-full -mt-1 first:mt-0"
            onClick={() => {
              if (item.path) {
                navigate(item.path);
              }
            }}
          >
            {/* 메뉴 박스 이미지 */}
            <div className="relative w-full">
              <img
                src={getAssetUrl(currentTheme, 'boxes', 'menu_box_x3')}
                alt="메뉴 배경"
                className="relative w-full h-auto block"
              />
              <span
                className={`absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-[16px] text-black`}
              >
                {item.label}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Setting;