import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { authFetch } from "../../../utils/AuthHelper";

// zustand 함수 불러오기
import { useProfileStore } from '../../../store/useProfileStore';

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ImageButton from "../../../components/common/ImageButton";
import InputField from "../../../components/more/auth/InputField";

const Profile = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 전역 스토어에서 프로필 데이터 원본 및 통신 함수 가져오기
  const { 
    nickname: storeNickname, 
    email: storeEmail, 
    profileImage: storeImage, 
    isFetched, 
    fetchProfile,
    updateProfileLocally // 나중에 수정 완료 시 쓸 함수
  } = useProfileStore();

  // 사용자 정보 상태 관리
  const [nickname, setNickname] = useState(storeNickname); // 닉네임
  const [email, setEmail] = useState(storeEmail); // 이메일
  const [profileImage, setProfileImage] = useState(storeImage); // 프로필 사진
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // 수정 완료 메세지
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메세지

  // 나중에 API로 전송할 실제 파일 
  const [selectedFile, setSelectedFile] = useState(null);

  // TODO : 유저 닉네임 중복 확인 API 연동

  // 프로필 데이터 조회
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 데이터 로딩 완료 시 로컬 폼 상태 동기화
  useEffect(() => {
    if (isFetched) {
      setNickname(storeNickname);
      setEmail(storeEmail);
      setProfileImage(storeImage);
    }
  }, [isFetched, storeNickname, storeEmail, storeImage]);

  // 수정하기 버튼 클릭 시
  const handleUpdate = async () => {
    // 버튼 클릭 시 기존 메시지 초기화
    setShowSuccessMessage(false);
    setErrorMessage("");

    try {
      // 닉네임 변경 API 호출
      const response = await authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/username/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_name: nickname }),
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      // 전역 스토어 상태 즉시 동기화
      updateProfileLocally(nickname, profileImage);

      // 성공 메시지 표시
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
    } catch (error) {
      console.error("닉네임 변경 오류:", error);
      setErrorMessage("닉네임 변경에 실패했습니다. 다시 시도해 주세요.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  // 컴포넌트 언마운트 시 메모리 누수 방지
  useEffect(() => {
    return () => {
      // profileImage가 blob URL 형태일 때만 메모리에서 해제
      // profileImage가 문자열(string) 일때만 startsWith 검사
      if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  return (
    <div
      className="w-full h-full py-[20%] flex flex-col items-center"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        backgroundSize: "100% 100%",
      }}
    >

      {/* 상단 헤더 - 뒤로 가기 버튼 */}
      <Header />

      {/* 프로필 사진 영역 */}
      <section className="relative w-auto h-auto my-[10%] flex justify-center items-center">
        <img
          src={getAssetUrl(currentTheme, 'boxes', 'profile_image_box_x3')}
          alt="프로필 프레임"
          className="scale-[120%] z-10 pointer-events-none relative"
        />
        {/* 클릭하면 파일 선택창 열리도록 */}
        <label htmlFor="profileImageInput" className="absolute w-full aspect-square z-20 block cursor-pointer overflow-hidden">
          <img
            src={profileImage || getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3')}
            alt="프로필 사진"
            className="w-full h-full object-cover cursor-pointer"
          />
        </label>

        {/* 숨겨진 파일 input */}
        <input
          id="profileImageInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            // 선택한 파일을 브라우저에서 바로 미리보기용 URL로 변환
            if (profileImage && profileImage.startsWith('blob:')) {
              // 기존에 만들어둔 임시 URL이 있다면 메모리에서 지워줌
              URL.revokeObjectURL(profileImage);
            }
            const previewUrl = URL.createObjectURL(file); // 임시 미리보기용 URL 생성
            setProfileImage(previewUrl); // 만든 주소로 화면에 사진 띄워줌
            setSelectedFile(file); // 서버로 보낼 파일 원본 저장
          }}
        />
      </section>

      {/* 입력 필드 영역 */}
      <section className="px-[10%] flex flex-col gap-[10%] mb-[10%]">
        <div className="flex flex-col w-full">
          {/* 닉네임 입력 */}
          <InputField
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
          />
          {/* 에러 메시지 */}
          <div className="w-full h-[15px] mt-2 pl-2 flex items-center justify-start">
            {errorMessage && (
              <p className="text-xs font-normal text-[#EF4444]">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* 이메일 입력 - 수정 불가 */}
        <InputField
          label="이메일"
          type="email"
          value={email}
          readOnly={true}
        />

      </section>

      {/* 수정 완료 메시지 */}
      <div className="w-full h-[5%] flex justify-center items-center mb-[3%]">
        {showSuccessMessage && (
          <p className=" text-xs font-normal text-[#00A40B]">
            정보가 수정되었습니다
          </p>
        )}
      </div>

      {/* 내 정보 수정하기 버튼 */}
      <ImageButton
        label="내 정보 수정하기"
        imageSrc={getAssetUrl(currentTheme, 'buttons', 'profile_info_patch_button_x3')}
        onClick={handleUpdate}
      />
    </div>
  );
};

export default Profile;