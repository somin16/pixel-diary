// 1. 리액트 불러오기
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// 2. 유틸 함수 불러오기
import { getAssetUrl } from "../../utils/AssetHelper";
import AuthValidator from '../../utils/AuthValidator';

// 3. 커스텀 훅 불러오기
import { useTheme } from "../../stores/useThemeStore";
import useDebounce from '../../hooks/useDebounce';
import { useSignup } from '../../hooks/mutations/useAuthMutations';
import { useBackNavigate } from '../../hooks/useBackNavigate';

// 5. 컴포넌트 불러오기
import InputBox from '../../components/auth/InputBox';
import SubmitButton from '../../components/auth/SubmitButton';

export default function Signup() { // 회원가입 페이지 내보내기
  // 페이지 이동
  const navigate = useNavigate();

  // 뒤로가기 버튼용
  const { goBack } = useBackNavigate();

  // 현재 테마
  const currentTheme = useTheme((state) => state.currentTheme);

  // [상태] 입력값 관리
  const [user_name, setUser_name] = useState('');
  const [user_email, setUser_email] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(''); // '' | 'male' | 'female'
  const [age, setAge] = useState(''); // 선택 입력 - 문자열로 관리, 제출 시 Number()로 변환

  // 성별 커스텀 드롭다운 - 열림/닫힘 상태 및 바깥 클릭 감지용 ref
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);
  const genderMenuRef = useRef(null);
 
  const genderOptions = [
    { value: '', label: '선택 안함' },
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
  ];
  const selectedGenderLabel =
    genderOptions.find((opt) => opt.value === gender)?.label ?? '선택 안함';

  // 회원가입 뮤테이션 - loading은 signup.isPending으로 대체
  const signup = useSignup();

  // 디바운스 적용 (서버 요청 횟수 조절)
  const debouncedUserEmail = useDebounce(user_email, 500) // 0.5초 딜레이
  const debouncedUserName = useDebounce(user_name, 500) // 0.5초 딜레이

  // [상태] 피드백 메시지
  const [emailStatus, setEmailStatus] = useState({ state: 'default', message: '' });
  const [userNameStatus, setUserNameStatus] = useState({ state: 'default', message: '' });
  const [passwordStatus, setPasswordStatus] = useState({ state: 'default', message: '' });
  const [confirmStatus, setConfirmStatus] = useState({ state: 'default', message: '' });
  const [ageStatus, setAgeStatus] = useState({ state: 'default', message: '' });

  // 유효성 검사 이메일 : 두 번째 인자를 true로 전달해 로그인 페이지와는 달리 중복검사 가능하게함
  useEffect(() => {
    const checkEmail = async () => {
      if (debouncedUserEmail) {
        const status = await AuthValidator.validateEmail(debouncedUserEmail, true);
        setEmailStatus(status);
      }
    };
    checkEmail();
  }, [debouncedUserEmail]);

  // 유효성 검사 닉네임: 길이 + 중복 체크
  useEffect(() => {
    const checkUserName = async () => {
      if (debouncedUserName) {
        const status = await AuthValidator.validateUserName(debouncedUserName);
        setUserNameStatus(status);
      }
    };
    checkUserName();
  }, [debouncedUserName]);

  // 유효성 검사 비밀번호: 형식
  useEffect(() => {
    setPasswordStatus(AuthValidator.validatePassword(password));
  }, [password]);

  // 비밀번호 확인: 일치 여부 체크
  useEffect(() => {
    setConfirmStatus(AuthValidator.validateConfirmPassword(password, confirmPassword));
  }, [password, confirmPassword]);

  // 성별 드롭다운 바깥을 클릭하면 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genderMenuRef.current && !genderMenuRef.current.contains(e.target)) {
        setGenderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 
  // 나이 입력 처리 - 비워두면 선택값이므로 통과, 값이 있으면 1 이상의 숫자인지만 확인
  const handleAgeChange = (e) => {
    const value = e.target.value;
    setAge(value);
 
    if (value === '') {
      setAgeStatus({ state: 'default', message: '' });
      return;
    }
 
    // 숫자가 아닌 문자(한글, 특수문자, 소수점 등)가 하나라도 섞여있으면 에러
    if (!/^[0-9]+$/.test(value)) {
      setAgeStatus({ state: 'error', message: '숫자만 입력할 수 있어요' });
      return;
    }
 
    // 숫자이지만 0 이하이면 에러
    if (Number(value) <= 0) {
      setAgeStatus({ state: 'error', message: '나이는 1 이상의 숫자로 입력해주세요' });
      return;
    }
 
    // 1 이상의 숫자면 통과(success)
    setAgeStatus({ state: 'success', message: '' });
  };

  // 일반 회원가입 로직
  const onSignupSubmit = (e) => {
    e.preventDefault();

    const isAllValid =
      emailStatus.state === 'success' &&
      userNameStatus.state === 'success' &&
      passwordStatus.state === 'success' &&
      confirmStatus.state === 'success';

    // 성별, 나이는 선택 항목 - 나이는 값이 있는데 형식이 틀렸을 때(error)만 제출을 막음
    const isAgeValid = ageStatus.state !== 'error';

    // 최종 확인 : 에러가 있거나 빈값이면 중단, 나이 형식이 잘못됐으면 중단
    if (!isAllValid || !isAgeValid ) {
      alert("모든 항목을 올바르게 입력해주세요");
      return;
    }

    // 선택값(gender, age)은 입력된 경우에만 payload에 포함
    const payload = { user_email, user_name, password };
    if (gender) payload.gender = gender;
    if (age !== '') payload.age = Number(age);

    // authApi.signup 호출 -> 성공/실패 모두 auth-redirect로 이동해서 안내 (기존 로직과 동일)
    signup.mutate(
      payload,
      {
        onSuccess: () => {
          navigate('/auth/auth-redirect?from=signup');
        },
        onError: (error) => {
          const message = encodeURIComponent(error.message || "알 수 없는 오류가 발생했습니다.");
          navigate(`/auth/auth-redirect?from=signup&message=${message}`);
        },
      }
    );
  }

  // 성별 선택 박스 스타일
  const genderBoxStyle = {
    backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'auth_info_input_box_x3')})`,
    backgroundSize: '100% 100%',
    aspectRatio: '261/72'
  };

  return (
    // 전체 컨테이너
    <div className='w-full h-full items-center justify-center flex flex-col p-25'>
      {/* 뒤로 가기 버튼 - Header 컴포넌트를 거치지 않고 이 페이지에서 직접 구현 */}
      <button
        type="button"
        onClick={() => goBack()}
        className="bg-transparent border-none cursor-pointer p-0 absolute left-8 top-10 outline-none"
      >
        <img
          src={getAssetUrl(currentTheme, 'icons', 'back_icon_x3')}
          alt="뒤로 가기"
          className="w-auto h-9"
        />
      </button>

      {/* 회원가입 글씨 */}
      <h1 className='text-5xl font-bold text-center mt-10'>Pixel Diary</h1><br />
      <h1 className='text-3xl font-bold text-center mb-5'>회원가입</h1>
      {/* 회원가입 폼 (이메일, 비밀번호, 성별, 나이, 회원가입 버튼) */}
      <form onSubmit={onSignupSubmit} noValidate className="w-full flex flex-col gap-1.5 mb-5">

        {/* 닉네임 입력창 */}
        <InputBox // auth/InputBox 컴포넌트를 불러와서 사용
          label="닉네임"
          type="username"
          placeholder="닉네임을 입력하세요"
          value={user_name}
          onChange={(e) => setUser_name(e.target.value)} // 현재 닉네임 중복 검사는 백엔드API가 미구현이므로 불가능합니다 AuthValidator.js 내부에 주석처리되어있음
          status={userNameStatus}
          currentTheme={currentTheme}
        />

        {/* 이메일 입력창 */}
        <InputBox // auth/InputBox 컴포넌트를 불러와서 사용
          label="이메일"
          type="email"
          placeholder="이메일을 입력하세요"
          value={user_email}
          onChange={(e) => setUser_email(e.target.value)}
          status={emailStatus}
          currentTheme={currentTheme}
        />

        {/* 비밀번호 입력창 */}
        <InputBox // auth/InputBox 컴포넌트를 불러와서 사용
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          status={passwordStatus}
          currentTheme={currentTheme}
          autoComplete='new-password'
        />

        {/* 비밀번호 확인창 */}
        <InputBox // auth/InputBox 컴포넌트를 불러와서 사용
          label="비밀번호 확인"
          type="confirmpassword"
          placeholder="비밀번호를 한번 더 입력하세요"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          status={confirmStatus}
          currentTheme={currentTheme}
        />

        {/* 성별 선택 (선택 입력) - 커스텀 드롭다운 */}
        <div className="w-full flex flex-col">
          <div className="w-full relative" ref={genderMenuRef}>
            <div className="w-full relative flex items-center" style={genderBoxStyle}>
              <span className="absolute -mt-[15%] ml-[5%] font-bold text-3xs">
                성별 (선택)
              </span>
 
              {/* 드롭다운 열고 닫는 버튼 - 선택된 값 + 화살표 아이콘 */}
              <button
                type="button"
                onClick={() => setGenderMenuOpen((prev) => !prev)}
                className="w-full h-full flex items-center justify-center gap-1 text-2xs font-bold mt-[1%] -mb-[1%]"
              >
                <span>{selectedGenderLabel}</span>
                <span
                  className={`text-3xs transition-transform duration-150 ${
                    genderMenuOpen ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
            </div>
 
            {/* 드롭다운 목록 */}
            {genderMenuOpen && (
              <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 overflow-hidden">
                {genderOptions.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setGender(opt.value);
                        setGenderMenuOpen(false);
                      }}
                      className={`w-full text-center text-2xs font-bold py-2 transition-colors ${
                        gender === opt.value
                          ? 'bg-blue-800 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* 다른 입력창들과 높이를 맞추기 위한 메시지 영역 (성별은 항상 유효하므로 비워둠) */}
          <div className="min-h-[1.5rem]" />
        </div>
 
        {/* 나이 입력창 (선택 입력) */}
        <InputBox
          label="나이 (선택)"
          type="text"
          placeholder="나이를 입력하세요"
          value={age}
          onChange={handleAgeChange}
          status={ageStatus}
          currentTheme={currentTheme}
        />

        {/* 회원가입 버튼 */}
        <SubmitButton // auth/SubmitButton 컴포넌트 불러와서 사용
          loading={signup.isPending} // 뮤테이션 상태로 대체
          disabled={signup.isPending || userNameStatus.state !== 'success' || emailStatus.state !== 'success' || passwordStatus.state !== 'success' || confirmStatus.state !== 'success' || ageStatus.state === 'error'} // 나이를 입력했는데 형식이 잘못된 경우에만 막힘
          currentTheme={currentTheme}
          text="회원가입"
        />
      </form>
    </div>
  )
}
