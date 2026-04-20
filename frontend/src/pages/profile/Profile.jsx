import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import Header from "../../components/common/Header";
import ImageButton from "../../components/common/ImageButton";
import InputField from "../../components/common/InputField";

const Profile = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 사용자 정보 상태 관리 (닉네임, 이메일, 수정 완료 메세지, 프로필 사진)
  // 나중에 context나 zuStand로 전역 관리 하는 게 좋을 듯
  const [nickname, setNickname] = useState("nickname"); // // TODO: API 연동 시 useState("")로 변경
  const [email, setEmail] = useState("email@email.com"); // // TODO: API 연동 시 useState("")로 변경
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); 
  const [profileImage, setProfileImage] = useState(null); 

  // 나중에 API로 전송할 실제 파일 
  const [selectedFile, setSelectedFile] = useState(null); 

  // 뒤로 가기 함수
  const handleBack = () => {
    navigate(-1);
  };

  // 수정하기 버튼 클릭 시
  const handleUpdate = async () => {
    
    // TODO: API 연동 시 api 파일에서 불러오기

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
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
      className="w-full h-full pt-[60px] pb-[30px] flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})` }}
    >
      
      {/* 상단 헤더 - 뒤로 가기 버튼 */}
      <Header />

      {/* 프로필 사진 영역 */}
      <section className="relative w-auto h-auto mt-[10px] mb-[65px] flex justify-center items-center">
        <img 
          src={getAssetUrl(currentTheme, 'boxes', 'profile_image_box_x3')} 
          alt="프로필 프레임" 
          className="w-[200px] h-[200px] z-10 pointer-events-none relative" 
        />
        {/* 클릭하면 파일 선택창 열리도록 */}
        <label htmlFor="profileImageInput" className="absolute top-[15px] left-[15px] w-[170px] h-[170px] z-20 block cursor-pointer overflow-hidden">
          <img 
            src={profileImage || getAssetUrl(currentTheme, 'icons', 'app_icon_x2')} 
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
      <section className="w-[220px] flex flex-col gap-[10px] mb-[30px]">
      {/* 닉네임 입력 */}
      <InputField 
        label="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임을 입력하세요"
      />

      {/* 이메일 입력 - 수정 불가 */}
      <InputField 
        label="이메일"
        type="email"
        value={email}
        readOnly={true}
      />

      </section>

      {/* 수정 완료 메시지 */}
      <div className="w-full h-[60px] flex justify-center items-center mb-[3px]">
        {showSuccessMessage && (
          <p className="m-0 mt-[3px] text-[13px] font-normal text-[#00A40B]">
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