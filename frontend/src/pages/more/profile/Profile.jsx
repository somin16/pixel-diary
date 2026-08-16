import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";
import { useUpdateProfileImage, useResetProfileImage, useChangeUsername } from '../../../hooks/mutations/useAuthMutations';

import { useProfileStore } from '../../../stores/useProfileStore';

import Header from "../../../components/common/Header";
import ImageButton from "../../../components/common/ImageButton";
import InputField from "../../../components/more/auth/InputField";

const Profile = () => {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const {
    nickname: storeNickname,
    email: storeEmail,
    profileImage: storeImage,
    isFetched,
    fetchProfile,
    updateProfileLocally
  } = useProfileStore();

  const [nickname, setNickname] = useState(storeNickname);
  const [email, setEmail] = useState(storeEmail);
  const [profileImage, setProfileImage] = useState(storeImage);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messageTimerRef = useRef(null);

  // 뮤테이션 훅 연결
  const updateProfileImage = useUpdateProfileImage();
  const resetProfileImage = useResetProfileImage();
  const changeUsername = useChangeUsername();

  const showMessage = (type, text) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);

    if (type === "success") {
      setSuccessMessage(text);
      setErrorMessage("");
    } else {
      setErrorMessage(text);
      setSuccessMessage("");
    }

    messageTimerRef.current = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);
  };

  const handleImageClick = () => {
    if (profileImage) {
      setIsMenuOpen(true);
    } else {
      fileInputRef.current.click();
    }
  };

  const handleDeleteClick = async () => {
    setIsMenuOpen(false);
    await handleDeleteImage();
  };

  // 프로필 사진 삭제
  const handleDeleteImage = async () => {
    if (!profileImage) return;

    try {
      setIsUploading(true);
      await resetProfileImage.mutateAsync();

      setProfileImage(null);
      updateProfileLocally(nickname, null);
      showMessage("success", "기본 프로필 사진으로 변경되었습니다");
    } catch (error) {
      console.error("기본 이미지 변경 오류:", error);
      showMessage("error", "기본 이미지 변경에 실패했습니다");
    } finally {
      setIsUploading(false);
    }
  };

  // 사진 선택 즉시 서버 업로드
  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setIsUploading(true);

      if (profileImage && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      const imageResponse = await updateProfileImage.mutateAsync(file);

      if (imageResponse && imageResponse.image_url) {
        const cacheBustedUrl = `${imageResponse.image_url}?t=${new Date().getTime()}`;
        updateProfileLocally(nickname, cacheBustedUrl);
        showMessage("success", "프로필 사진이 변경되었습니다");
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      showMessage("error", "사진 업로드에 실패했습니다");
      setProfileImage(storeImage);
    } finally {
      setIsUploading(false);
    }
  };

  // 내 정보 수정하기 버튼 클릭 시 (닉네임만 변경)
  const handleUpdate = async () => {
    try {
      setIsUploading(true);
      await changeUsername.mutateAsync(nickname);

      updateProfileLocally(nickname, storeImage);
      showMessage("success", "정보가 수정되었습니다");
    } catch (error) {
      console.error("닉네임 변경 오류:", error);
      showMessage("error", "닉네임 변경에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isFetched) {
      setNickname(storeNickname);
      setEmail(storeEmail);
      setProfileImage((prev) => {
        if (prev && typeof prev === 'string' && prev.startsWith('blob:')) {
          return prev;
        }
        return storeImage;
      });
    }
  }, [isFetched, storeNickname, storeEmail, storeImage]);

  useEffect(() => {
    return () => {
      if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, [profileImage]);

  return (
    <div
      className="w-full h-full py-[10%] flex flex-col items-center"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`, backgroundSize: "100% 100%" }}
    >
      <Header />

      <section className="relative w-auto h-auto my-[10%] flex justify-center items-center">
        <div className="relative flex justify-center items-center cursor-pointer" onClick={handleImageClick}>
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'profile_image_box_x3')}
            alt="프로필 프레임"
            className="scale-[120%] z-10 pointer-events-none relative"
          />
          <div className="absolute w-full aspect-square z-20 block overflow-hidden">
            <img
              src={profileImage || getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3')}
              alt="프로필 사진"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3');
              }}
            />
          </div>
        </div>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center" onClick={() => setIsMenuOpen(false)}>
            <div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden w-[80%] max-w-[300px]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setIsMenuOpen(false); fileInputRef.current.click(); }}
                className="px-4 py-4 text-base text-gray-800 hover:bg-gray-100 font-bold"
              >
                프로필 이미지 변경
              </button>
              <div className="w-full h-[1px] bg-gray-200"></div>
              <button onClick={handleDeleteClick} className="px-4 py-4 text-base text-[#EF4444] hover:bg-gray-100 font-bold">
                기본 이미지로 변경
              </button>
              <div className="w-full h-[1px] bg-gray-200"></div>
              <button onClick={() => setIsMenuOpen(false)} className="px-4 py-4 text-base text-gray-500 hover:bg-gray-100 font-bold">
                취소
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          id="profileImageInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            handleImageUpload(file);
            e.target.value = '';
          }}
        />
      </section>

      <section className="flex flex-col w-full px-[20%] gap-[10%] mb-[10%]">
        <div className="flex flex-col w-full">
          <InputField
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
          />
        </div>
        <InputField label="이메일" type="email" value={email} readOnly={true} />
      </section>

      <div className="w-full h-[5%] flex justify-center items-center mb-[3%]">
        {isUploading && <p className="text-xs font-medium text-gray-500 animate-pulse">정보를 업데이트 중입니다...</p>}
        {!isUploading && successMessage && <p className="text-xs font-normal text-[#00A40B]">{successMessage}</p>}
        {!isUploading && errorMessage && <p className="text-xs font-normal text-[#EF4444]">{errorMessage}</p>}
      </div>

      <div className={`w-full flex justify-center ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
        <ImageButton
          label="내 정보 수정하기"
          imageSrc={getAssetUrl(currentTheme, 'buttons', 'profile_info_patch_button_x3')}
          onClick={handleUpdate}
        />
      </div>
    </div>
  );
};

export default Profile;
