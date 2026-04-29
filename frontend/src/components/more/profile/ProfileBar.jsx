import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../hooks/useTheme"; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

/**
 * ProfileBar (MorePage 상단 사용자 프로필 영역)
 * @param {string} nickname - 사용자 닉네임
 * @param {string} email - 사용자 이메일
 * @param {string} profileImage - 프로필 이미지 URL (없으면 기본 아이콘)
 */

const ProfileBar = ({ nickname, email, profileImage }) => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <section 
      className="mb-10 cursor-pointer flex justify-center w-full transition-transform duration-100 ease-in" 
      onClick={() => navigate('/more/profile')} // section 전체에 onClick을 걸어서, 이미지 어디를 누르든 이동하게 만듦
    >
      {/* 상한선이므로 px 유지 */}
      <div className="relative w-[90%] max-w-[350px]"> 
        
        {/* 프로필 배경 이미지 (박스+선 이미지) */}
        <img 
          src={getAssetUrl(currentTheme, 'boxes', 'profile_bar_box_x3')} 
          alt="프로필 배경" 
          className="w-full h-auto block pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* 배경 이미지에 올라가는 사용자 프로필 사진*/}
        <img 
          src={profileImage || getAssetUrl(currentTheme, 'icons', 'app_icon_x2')}
          alt="프로필 사진"
          className="absolute left-[3.7%] top-[43.5%] -translate-y-1/2 w-[21.5%] aspect-square object-cover pointer-events-none"
        />

        {/* 사용자 정보 (닉네임 & 이메일) */}
        {/* flex-col 정렬에서 gap을 %로 조절 불가하여 px로 유지 */}
        <div className="absolute left-[29%] top-1/2 -translate-y-1/2 flex flex-col gap-[5px]">
          <span className="text-[16px] font-bold text-black">{nickname}</span>
          <span className="text-[12px] font-bold text-gray-500">{email}</span>
        </div>

      </div>
    </section>
  );
};

export default ProfileBar;