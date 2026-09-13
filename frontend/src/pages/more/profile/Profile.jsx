import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { useUpdateProfileImage, useResetProfileImage, useChangeUsername, useUpdateGenderAge, } from '../../../hooks/mutations/useAuthMutations'; // ✅ 인증 관련 뮤테이션 훅
import AuthValidator from "../../../utils/AuthValidator"; 

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ImageButton from "../../../components/common/ImageButton";
import InputField from "../../../components/more/auth/InputField";
import Dropdown from "../../../components/common/Dropdown";

// 프로필 조회 훅 불러오기
import { useProfile } from '../../../hooks/queries/useProfileQueries';

const Profile = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // React Query 변수 할당
  const { data: profileData, isLoading: isProfileLoading, isError, refetch } = useProfile();

  // 사용자 정보 상태 관리
  const [nickname, setNickname] = useState(""); // 닉네임
  const [profileImage, setProfileImage] = useState(null); // 프로필 사진

  // 성별/나이 상태 관리 (선택 입력)
  const [gender, setGender] = useState(''); // '' | 'male' | 'female'
  const [age, setAge] = useState(''); // '' | 숫자 문자열
  const [ageError, setAgeError] = useState(''); // 나이 형식 에러 메시지
 
  // 성별, 나이 드롭다운
  const genderOptions = [
    { value: '', label: '선택 안함' },
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
  ];

  // 메세지 상태
  const [successMessage, setSuccessMessage] = useState(""); // 수정 완료 메세지
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메세지

  const fileInputRef = useRef(null); // 숨겨진 파일 선택창 조작용
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 프로필 사진 메뉴 상태

  // 메시지 타이머 제어용 Ref (연속 클릭 시 메시지 깜빡임 방지)
  const messageTimerRef = useRef(null);

  // 프로필 사진 변경/초기화, 닉네임 변경, 성별/나이 변경 뮤테이션
  const updateProfileImage = useUpdateProfileImage();
  const resetProfileImage = useResetProfileImage();
  const changeUsername = useChangeUsername();
  const updateGenderAge = useUpdateGenderAge();

  // 4개의 Mutation 중 하나라도 진행 중이면 로딩 상태로 간주
  const isUploading = updateProfileImage.isPending || resetProfileImage.isPending || changeUsername.isPending || updateGenderAge.isPending;

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
  // 이벤트 핸들러 (동작 함수)
  // ──────────────────────────────────────────────────

  // 프로필 이미지 클릭 시
  const handleImageClick = () => {
    if (profileImage) {
      setIsMenuOpen(true); // 기존 사진이 있으면 팝업 메뉴 열기
    } else {
      fileInputRef.current.click(); // 없으면 바로 파일 선택창 열기
    }
  };

  // '기본 이미지로 변경' 버튼 클릭 시
  const handleDeleteClick = async () => {
    setIsMenuOpen(false); // 메뉴 먼저 닫기
    await handleDeleteImage();
  };

  // 프로필 사진 삭제 - useResetProfileImage 훅 사용
  const handleDeleteImage = async () => {
    if (!profileImage) return; // 이미 기본 사진이면 무시

    try {
      try {
        await resetProfileImage.mutateAsync();
      } catch (error) {
        // 백엔드에서 400(이미 기본 프로필) 에러가 와도 목표 달성이므로 무시하고 진행
        if (error.message !== "이미 기본 프로필 사진입니다.") throw error;
      }

      await refetch(); // 사진 삭제 후 서버 데이터 갱신
      setProfileImage(null);
      showMessage("success", "기본 프로필 사진으로 변경되었습니다");

    } catch (error) {
        console.error("기본 이미지 변경 오류:", error);
        showMessage("error", "기본 이미지 변경에 실패했습니다");
    }
  };

  // 사진 선택 즉시 서버 업로드 - useUpdateProfileImage 훅 사용
  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      // 화면에 먼저 미리보기 렌더링
      if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      // 서버로 이미지 업로드 및 응답 데이터 확보
      const imageResponse = await updateProfileImage.mutateAsync(file);

      // 백엔드에서 받아온 확실한 최신 URL 추출
      const newImageUrl = imageResponse?.profile_image || imageResponse?.image_url;

      if (newImageUrl) {
        const cleanUrl = newImageUrl.split('?')[0];
        const cacheBustedUrl = `${cleanUrl}?t=${new Date().getTime()}`;

        // 현재 화면 즉시 갱신 (캐시버스팅으로 이미지 새로고침 강제)
        setProfileImage(cacheBustedUrl);
      }
      
      await refetch();
      showMessage("success", "프로필 사진이 변경되었습니다");
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      showMessage("error", "사진 업로드에 실패했습니다");
      setProfileImage(profileData?.profile_image || null); // 실패 시 이전 사진으로 복구
    } 
  };

  // 나이 입력 처리
  const handleAgeChange = (e) => {
    const value = e.target.value;
    setAge(value);
    const result = AuthValidator.validateAge(value);
    setAgeError(result.state === 'error' ? result.message : '');
  };

  // 내 정보 수정하기 버튼 클릭 시 (닉네임, 성별, 나이 변경 - 이미지는 즉시 업로드) - useChangeUsername 훅 사용
  const handleUpdate = async () => {
    // AuthValidator 비동기 검사 실행
    const validation = await AuthValidator.validateUserName(nickname);

    // 검사 실패 시 에러 메세지 띄우고 중단
    if (validation.state === 'error') {
      showMessage("error", validation.message);
      return; 
    }

    // 나이 형식이 잘못됐으면 중단
    if (ageError) {
      showMessage("error", ageError);
      return;
    }

    try {
      // 원래 값(profileData)과 비교해서 실제로 바뀐 항목만 API 호출
      const nicknameChanged = nickname !== (profileData?.name || "");
      const genderChanged = gender !== (profileData?.gender || '');
      const ageChanged = age !== (profileData?.age != null ? String(profileData.age) : '');
 
      // Promise.all로 동시에 보내면 두 요청이 서로 상대방이 아직 안 바꾼 옛날
      // user_metadata를 읽어서 덮어써버리는 레이스 컨디션이 생길 수 있어서 순차 실행으로 처리
      if (nicknameChanged) {
        await changeUsername.mutateAsync(nickname);
      }
      if (genderChanged || ageChanged) {
        await updateGenderAge.mutateAsync({ gender, age });
      }
 
      showMessage("success", "정보가 수정되었습니다"); // 메세지 먼저 띄운 후 서버 데이터 갱신
      refetch().catch((err) => console.error("프로필 갱신 실패:", err));
 
    } catch (error) {
      console.error("정보 수정 오류:", error);
      showMessage("error", "정보 수정에 실패했습니다. 다시 시도해 주세요.");
    } 
  };

  // ──────────────────────────────────────────────────
  // useEffect
  // ──────────────────────────────────────────────────

  // 데이터 로딩 완료 시 로컬 폼 상태 동기화
  useEffect(() => {
    if (profileData) {
      setNickname(profileData?.name || "");
      setGender(profileData?.gender || '');
      setAge(profileData?.age != null ? String(profileData.age) : ''); 

      // 현재 화면에 방금 고른 사진(blob)이 떠있다면 서버 사진으로 덮어쓰지 않음
      setProfileImage((prev) => {
        if (prev && typeof prev === 'string' && prev.startsWith('blob:')) {
          return prev;
        }

        return profileData?.profile_image || null;
      });
    }
  }, [profileData]);

  // 컴포넌트 언마운트 시 미리보기(blob) 메모리 누수 방지
  useEffect(() => {
    return () => {
      // profileImage가 blob URL 형태일 때만 메모리에서 해제 & 문자열(string) 일때만 startsWith 검사
      if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
      // 컴포넌트 언마운트 시 타이머 정리
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, [profileImage]);

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
          <section className="relative w-auto h-auto mt-0 mb-[10%] flex justify-center items-center">
            <div
              className={`relative flex justify-center items-center ${
                isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"
              }`}
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
          <section className="flex flex-col w-full px-[20%] gap-[5.5%] mb-[15%]">
            <div className="flex flex-col w-full">
              <InputField
                label="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
            </div>

            {/* 성별 선택 (선택 입력) */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-xs text-black">성별 (선택)</label>
              <Dropdown
                options={genderOptions}
                value={gender}
                onChange={setGender}
                listClassName="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden divide-y divide-gray-200"
                renderTrigger={({ selectedLabel, isOpen, toggle }) => (
                  <div className="relative w-full h-11 flex items-center">
                    <img
                      src={getAssetUrl(currentTheme, 'boxes', 'info_box_x3')}
                      alt="입력창 배경"
                      className="absolute top-0 left-0 w-full h-full z-10"
                    />
                    <button
                      type="button"
                      onClick={toggle}
                      className="relative z-20 w-full h-full bg-transparent border-none outline-none px-4 text-xs text-black flex items-center justify-between"
                    >
                      <span className={gender === '' ? 'text-gray-400' : 'text-black'}>{selectedLabel}</span>
                      <span className={`text-[10px] text-gray-600 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                )}
                renderOption={({ option, isSelected, select }) => (
                  <button
                    type="button"
                    onClick={select}
                    className={`w-full text-center text-xs font-medium py-3 transition-colors ${
                      isSelected ? 'bg-blue-900 text-white' : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                )}
              />
            </div>
 
            {/* 나이 입력 (선택 입력) */}
            <div className="flex flex-col w-full">
              <InputField
                label="나이 (선택)"
                type="text"
                value={age}
                onChange={handleAgeChange}
                placeholder="나이를 입력하세요"
              />
              {ageError && (
                <p className="text-xs text-[#EF4444] mt-1">{ageError}</p>
              )}
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
          <div className="w-full h-[5%] flex justify-center items-center mb-[4%]">
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