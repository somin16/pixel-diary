import React from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
// ImageButton은 수정 기능을 지웠으므로 제거되었습니다.
import InputField from "../../../components/more/auth/InputField";

// 프로필 조회 훅 불러오기
import { useProfile } from '../../../hooks/queries/useProfileQueries';

const Profile = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // React Query를 통한 데이터 조회 및 Mutation 연결 (조회만 남김)
  const { data: profileData, isLoading: isProfileLoading, isError, refetch } = useProfile();

  return (
    <div
      className="w-full h-full py-[10%] flex flex-col items-center"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        backgroundSize: "100% 100%",
      }}
    >
      {/* 상단 헤더 - 뒤로 가기 버튼 */}
      <Header />

      {isProfileLoading ? (
        <div className="flex-1 flex justify-center items-center text-gray-500 font-bold">
          프로필 정보를 불러오는 중입니다...
        </div>
      ) : isError ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-4 text-gray-500">
          <p>프로필 정보를 불러오지 못했습니다</p>
          <button onClick={() => refetch()} className="text-sm underline">
            다시 시도
          </button>
        </div>
      ) : (
        <>
          {/* 프로필 사진 영역 */}
          <section className="relative w-auto h-auto my-[10%] flex justify-center items-center">
            <div className="relative flex justify-center items-center cursor-default">
              <img
                src={getAssetUrl(currentTheme, 'boxes', 'profile_image_box_x3')}
                alt="프로필 프레임"
                className="scale-[120%] z-10 pointer-events-none relative"
              />
              <div className="absolute w-full aspect-square z-20 block overflow-hidden">
                <img
                  src={profileData?.profile_image || getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3')}
                  alt="프로필 사진"
                  className="w-full h-full object-cover"
                  // 이미지 로드 실패 시 (URL은 있지만 실제 이미지가 없을 때) 기본 아이콘으로 교체
                  onError={(e) => {
                    e.target.onerror = null; // 무한 루프 방지 (기본 아이콘도 실패할 경우 대비)
                    e.target.src = getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3');
                  }}
                />
              </div>
            </div>
          </section>

          {/* 입력 필드 영역 */}
          <section className="flex flex-col w-full px-[20%] gap-[10%] mb-[10%]">
            <div className="flex flex-col w-full">
              {/* 닉네임 입력 (읽기 전용으로 변경) */}
              <InputField
                label="닉네임"
                value={profileData?.name || ""}
                readOnly={true}
                placeholder="닉네임이 없습니다"
              />
            </div>

            {/* 이메일 입력 - 수정 불가 */}
            <InputField
              label="이메일"
              type="email"
              value={profileData?.email || ""}
              readOnly={true}
            />
          </section>
        </>
      )}
    </div>
  );
};

export default Profile;