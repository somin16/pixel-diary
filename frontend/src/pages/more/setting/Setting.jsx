import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { supabase } from "../../../utils/SupabaseClient"; // supabase 불러오기

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";

// 설정 메뉴 항목들 - 배열을 전역으로 선언
const settingItems = [
  { id: 'account', label: '계정 설정', path: '/more/setting/account', icon:'people_icon_x3'},
  { id: 'lock', label: '잠금 설정', path: '/more/setting/lock', icon:'lock_icon_x3' },
  { id: 'notification', label: '알람 설정', path: '/more/setting/notification', icon:'alarm_icon_x3' },
  { id: 'sound', label: '사운드 설정', path: 'more/setting/sound', icon:'sound_icon_x3' },
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
              {/* 아이콘과 텍스트 영역 (기준 너비를 고정하여 텍스트 정렬 맞춤) */}
              <div className="absolute z-10 inset-0 flex items-center pl-[6%] gap-3">
                {item.icon ? (
                  <div className={`w-[15%] flex items-center justify-center shrink-0 ${item.id === 'sound' ? 'translate-x-[4px]' : ''}`}>
                    <img
                      src={getAssetUrl(currentTheme, 'icons', item.icon)}
                      alt=""
                      className={`object-contain ${item.id === 'sound' ? 'scale-95' : 'max-w-full max-h-full'}`}
                    />
                  </div>
                ) : (
                  <div className=" shrink-0" />
                )}
                <span className="text-sm text-black">
                  {item.label}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Setting;