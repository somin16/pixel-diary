import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
// import { AuthValidator } from "../../../utils/AuthValidator"; // TODO : 유저이름 중복&길이 검사

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ImageButton from "../../../components/common/ImageButton";
import InputField from "../../../components/more/auth/InputField";

// 프로필 조회, 닉네임 변경, 이미지 변경, 이미지 삭제 훅 불러오기
import { useProfile, useUpdateNickname, useUpdateImage, useDeleteImage } from '../../../hooks/queries/useProfileQueries';

const Profile = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // React Query를 통한 데이터 조회 및 Mutation 연결
  const { data: profileData, isLoading: isProfileLoading, isError, refetch } = useProfile();
  const updateNicknameMut = useUpdateNickname();
  const updateImageMut = useUpdateImage();
  const deleteImageMut = useDeleteImage();

  // 3개의 Mutation 중 하나라도 진행 중이면 로딩 상태로 간주
  const isUploading = updateNicknameMut.isPending || updateImageMut.isPending || deleteImageMut.isPending;

  // 화면 렌더링용 로컬 상태
  const [nickname, setNickname] = useState(""); // 닉네임
  const [profileImage, setProfileImage] = useState(null); // 프로필 사진

  const [successMessage, setSuccessMessage] = useState(""); // 수정 완료 메세지
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메세지

  const fileInputRef = useRef(null); // 숨겨진 파일 선택창 조작용
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 프로필 사진 메뉴 상태

  const messageTimerRef = useRef(null); // 메시지 타이머 제어용 Ref (연속 클릭 시 메시지 깜빡임 방지)

  // ──────────────────────────────────────────────────
  // 공통 메시지 출력 함수
  // ──────────────────────────────────────────────────

  const showMessage = (type, text) => {
    // 기존에 실행 중인 타이머가 있다면 취소
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    if (type === "success") {
      setSuccessMessage(text);
      setErrorMessage("");
    } else {
      setErrorMessage(text);
      setSuccessMessage("");
    }

    // 5초 뒤 메시지 초기화
    messageTimerRef.current = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);
  };

  // ──────────────────────────────────────────────────
  // useEffect (데이터 동기화 및 생명주기 관리)
  // ──────────────────────────────────────────────────

  // 서버 데이터 로딩 완료 시 로컬 상태(닉네임, 미리보기 이미지) 세팅
  useEffect(() => {
    if (profileData) {
      setNickname(profileData.name || ""); 
      
      setProfileImage((prev) => {
        // 화면에 선택한 사진 미리보기(blob)가 떠있다면 서버 사진으로 덮어쓰지 않음
        if (prev && typeof prev === 'string' && prev.startsWith('blob:')) {
          return prev;
        }
        return profileData.profile_image || null;
      });
    }
  }, [profileData]);

  // 미리보기용 프로필 이미지(blob) 메모리 해제
  useEffect(() => {
    return () => {
      // profileImage가 blob URL 형태일 때만 메모리에서 해제 & 문자열(string) 일때만 startsWith 검사
      if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  // 컴포넌트가 완전히 사라질 때만 타이머 정리 (언마운트 시 1번)
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []); // 빈 배열 (마운트/언마운트 시에만 실행)

  // ──────────────────────────────────────────────────
  // 이벤트 핸들러 (동작 함수)
  // ──────────────────────────────────────────────────

  // 프로필 이미지 클릭 시
  const handleImageClick = () => {
    if (profileImage) setIsMenuOpen(true); // 기존 사진이 있으면 팝업 메뉴 열기
    else fileInputRef.current.click(); // 없으면 바로 파일 선택창 열기
  };

  // '기본 이미지로 변경' 버튼 클릭 시 (Mutation 실행)
  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    deleteImageMut.mutate(undefined, {
      onSuccess: () => {
        setProfileImage(null); 
        showMessage("success", "기본 프로필 사진으로 변경되었습니다");
      },
      onError: (error) => {
        console.error("기본 이미지 변경 오류:", error);
        showMessage("error", "기본 이미지 변경에 실패했습니다");
      }
    });
  };

  // 사진 선택 즉시 서버 업로드 (Mutation 실행)
  const handleImageUpload = (file) => {
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);

    const formData = new FormData();
    formData.append("profile_image", file);

    updateImageMut.mutate(formData, {
      onSuccess: () => showMessage("success", "프로필 사진이 변경되었습니다"),
      onError: (error) => {
        console.error("이미지 업로드 오류:", error);
        showMessage("error", "사진 업로드에 실패했습니다");
        setProfileImage(profileData?.profile_image || null); // 실패 시 이전 사진으로 복구
      }
    });
  };

  // '내 정보 수정하기' 버튼 클릭 시 (닉네임만 변경 - Mutation 실행)
  const handleUpdate = () => {
    updateNicknameMut.mutate({ user_name: nickname }, {
      onSuccess: () => showMessage("success", "정보가 수정되었습니다"),
      onError: (error) => {
        console.error("닉네임 변경 오류:", error);
        showMessage("error", "닉네임 변경에 실패했습니다. 다시 시도해 주세요.");
      }
    });
  };

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
            <div
              className="relative flex justify-center items-center cursor-pointer"
              onClick={handleImageClick}
            >
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
                  // 이미지 로드 실패 시 (URL은 있지만 실제 이미지가 없을 때) 기본 아이콘으로 교체
                  onError={(e) => {
                    e.target.onerror = null; // 무한 루프 방지 (기본 아이콘도 실패할 경우 대비)
                    e.target.src = getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3');
                  }}
                />
              </div>
            </div>

            {/* 프로필 이미지 변경 다이얼로그 */}
            {isMenuOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
                onClick={() => setIsMenuOpen(false)} // 어두운 배경 클릭 시 닫힘
              >
                {/* 선택 다이얼로그 */}
                <div
                  className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden w-[80%] max-w-[300px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      fileInputRef.current.click(); // 파일 선택창 열기
                    }}
                    className="px-4 py-4 text-base text-gray-800 hover:bg-gray-100 font-bold"
                  >
                    프로필 이미지 변경
                  </button>

                  <div className="w-full h-[1px] bg-gray-200"></div>

                  <button
                    onClick={handleDeleteClick}
                    className="px-4 py-4 text-base text-[#EF4444] hover:bg-gray-100 font-bold"
                  >
                    기본 이미지로 변경
                  </button>

                  <div className="w-full h-[1px] bg-gray-200"></div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-4 text-base text-gray-500 hover:bg-gray-100 font-bold"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 숨겨진 파일 input */}
            <input
              ref={fileInputRef}
              id="profileImageInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                handleImageUpload(file); // 선택 즉시 업로드 함수 호출
                e.target.value = ''; // 같은 파일을 다시 선택해도 작동하도록 input 값 초기화
              }}
            />
          </section>

          {/* 입력 필드 영역 */}
          <section className="flex flex-col w-full px-[20%] gap-[10%] mb-[10%]">
            <div className="flex flex-col w-full">
              {/* 닉네임 입력 */}
              <InputField
                label="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
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

          {/* 수정 완료 & 에러 메시지 영역 */}
          <div className="w-full h-[5%] flex justify-center items-center mb-[3%]">
            {isUploading && (
              <p className="text-xs font-medium text-gray-500 animate-pulse">
                정보를 업데이트 중입니다...
              </p>
            )}

            {!isUploading && successMessage && (
              <p className="text-xs font-normal text-[#00A40B]">
                {successMessage}
              </p>
            )}
            {!isUploading && errorMessage && (
              <p className="text-xs font-normal text-[#EF4444]">
                {errorMessage}
              </p>
            )}
          </div>

          {/* 내 정보 수정하기 버튼 */}
          <div className={`w-full flex justify-center ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
            <ImageButton
              label="내 정보 수정하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'profile_info_patch_button_x3')}
              onClick={handleUpdate}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;