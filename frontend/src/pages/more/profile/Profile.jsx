import React from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { useUpdateProfileImage, useResetProfileImage, useChangeUsername } from '../../../hooks/mutations/useAuthMutations'; // ✅ 인증 관련 뮤테이션 훅
// import { AuthValidator } from "../../../utils/AuthValidator"; // TODO : 유저이름 중복&길이 검사

// zustand 함수 불러오기
import { useProfileStore } from '../../../stores/useProfileStore';

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

  // 전역 스토어에서 프로필 데이터 원본 및 통신 함수 가져오기
  const {
    nickname: storeNickname,
    email: storeEmail,
    profileImage: storeImage,
    isFetched,
    fetchProfile,
    updateProfileLocally // 수정 완료 시 쓸 함수
  } = useProfileStore();

  // 사용자 정보 상태 관리
  const [nickname, setNickname] = useState(storeNickname); // 닉네임
  const [email, setEmail] = useState(storeEmail); // 이메일
  const [profileImage, setProfileImage] = useState(storeImage); // 프로필 사진

  // 메세지 상태
  const [successMessage, setSuccessMessage] = useState(""); // 수정 완료 메세지
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메세지
  const [isUploading, setIsUploading] = useState(false); // 로딩 상태 추가

  const fileInputRef = useRef(null); // 숨겨진 파일 선택창 조작용
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 프로필 사진 메뉴 상태

  // 메시지 타이머 제어용 Ref (연속 클릭 시 메시지 깜빡임 방지)
  const messageTimerRef = useRef(null);

  // 프로필 사진 변경/초기화, 닉네임 변경 뮤테이션
  const updateProfileImage = useUpdateProfileImage();
  const resetProfileImage = useResetProfileImage();
  const changeUsername = useChangeUsername();

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
      setIsUploading(true); // 로딩 켜기
      await resetProfileImage.mutateAsync();

      setProfileImage(null);
      updateProfileLocally(nickname, null); // 스토어 동기화
      showMessage("success", "기본 프로필 사진으로 변경되었습니다");
    } catch (error) {
      console.error("기본 이미지 변경 오류:", error);
      showMessage("error", "기본 이미지 변경에 실패했습니다");
    } finally {
      setIsUploading(false); // 로딩 끄기
    }
  };

  // 사진 선택 즉시 서버 업로드 - useUpdateProfileImage 훅 사용
  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setIsUploading(true); // 로딩 켜기

      // 1. 화면에 먼저 미리보기 렌더링
      if (profileImage && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      // 2. 서버로 이미지 업로드
      const imageResponse = await updateProfileImage.mutateAsync(file);

      // 3. 업로드 성공 시 실제 URL로 스토어 동기화
      if (imageResponse && imageResponse.image_url) {
        // 브라우저 캐시를 무효화하여 항상 최신 이미지를 불러오도록 타임스탬프 추가
        const cacheBustedUrl = `${imageResponse.image_url}?t=${new Date().getTime()}`;

        updateProfileLocally(nickname, cacheBustedUrl); // 스토어 데이터만 업데이트
        showMessage("success", "프로필 사진이 변경되었습니다");
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      showMessage("error", "사진 업로드에 실패했습니다");
      setProfileImage(storeImage); // 실패 시 이전 사진으로 복구
    } finally {
      setIsUploading(false); // 로딩 끄기
    }
  };

  // 내 정보 수정하기 버튼 클릭 시 (닉네임만 변경 - 이미지는 즉시 업로드) - useChangeUsername 훅 사용
  const handleUpdate = async () => {
    try {
      setIsUploading(true); // 통신 시작 전 로딩 켜기 (버튼 비활성화)

      await changeUsername.mutateAsync(nickname);

      updateProfileLocally(nickname, storeImage); // 스토어 닉네임 동기화
      showMessage("success", "정보가 수정되었습니다");

    } catch (error) {
      console.error("닉네임 변경 오류:", error);
      showMessage("error", "닉네임 변경에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsUploading(false); // 로딩 끄기 (버튼 활성화)
    }
  };

  // ──────────────────────────────────────────────────
  // useEffect
  // ──────────────────────────────────────────────────

  // 프로필 데이터 조회
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 데이터 로딩 완료 시 로컬 폼 상태 동기화
  useEffect(() => {
    if (isFetched) {
      setNickname(storeNickname);
      setEmail(storeEmail);

      // 현재 화면에 방금 고른 사진(blob)이 떠있다면 서버 사진으로 덮어쓰지 않음
      setProfileImage((prev) => {
        if (prev && typeof prev === 'string' && prev.startsWith('blob:')) {
          return prev;
        }
        return storeImage;
      });
    }
  }, [isFetched, storeNickname, storeEmail, storeImage]);

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
