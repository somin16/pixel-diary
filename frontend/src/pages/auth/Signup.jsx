// 1. 리액트 불러오기
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// 2. 유틸 함수 불러오기
import { getAssetUrl } from "../../utils/AssetHelper";
import AuthValidator from '../../utils/AuthValidator';

// 3. 커스텀 훅 불러오기
import { useTheme } from "../../hooks/useTheme";
import useDebounce from '../../hooks/useDebounce';

// 4. 슈파베이스 불러오기
import { supabase } from "../../utils/SupabaseClient";

// 5. 컴포넌트 불러오기
import InputBox from '../../components/auth/InputBox';
import SubmitButton from '../../components/auth/SubmitButton';

export default function Signup() { // 회원가입 페이지 내보내기
    // 페이지 이동
    const navigate = useNavigate();

    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme);

    // [상태] 입력값 관리
    const [user_name, setUser_name] = useState('');
    const [user_email, setUser_email] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // [상태] 회원가입 중인지 아닌지
    const [loading, setLoading] = useState(false); // 기본값 false

    // 디바운스 적용 (서버 요청 횟수 조절)
    const debouncedUserEmail = useDebounce(user_email, 500) // 0.5초 딜레이
    const debouncedUserName = useDebounce(user_name, 500) // 0.5초 딜레이

    // [상태] 피드백 메시지
    const [emailStatus, setEmailStatus] = useState({ state: 'default', message: '' });
    const [userNameStatus, setUserNameStatus] = useState({ state: 'default', message: '' });
    const [passwordStatus, setPasswordStatus] = useState({ state: 'default', message: '' });
    const [confirmStatus, setConfirmStatus] = useState({ state: 'default', message: '' });

    // 유효성 검사 이메일 : 두 번째 인자를 true로 전달해 로그인 페이지와는 달리 중복검사 가능하게함
    useEffect( () => {
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


    // 일반 회원가입 로직
    const onSignupSubmit = async (e) => {
        e.preventDefault();

        // 
        const isAllValid = 
            emailStatus.state === 'success' &&
            userNameStatus.state === 'success' &&
            passwordStatus.state === 'success' &&
            confirmStatus.state === 'success';

        // 최종 확인 : 에러가 있거나 빈값이면 중단
        if (!isAllValid) {
            alert("모든 항목을 올바르게 입력해주세요");
            return;
        }

        setLoading(true);

        try{ //백엔드 API 연동 /api/v1/auth/signup/
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/signup/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email, user_name, password })
            });

            if (response.ok) {
                navigate('/auth-redirect?from=signup');
            } else {
                // 실패 시 (서버에서 준 에러 메시지 포함)
                const err = await response.json();
                const message = encodeURIComponent(err.message || "알 수 없는 오류가 발생했습니다.");
                navigate(`/auth-redirect?from=signup&message=${message}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return(
        // 전체 컨테이너
        <div className='w-full h-full items-center flex flex-col p-25'>
            {/* 회원가입 글씨 */}
            <h1 className='text-5xl font-bold text-center mt-10'>Pixel Diary</h1><br/>
            <h1 className='text-3xl font-bold text-center mb-10'>회원가입</h1>
            {/* 회원가입 폼 (이메일, 비밀번호, 회원가입 버튼) */}
            <form onSubmit={onSignupSubmit} noValidate className="w-full flex flex-col gap-2 mb-5">
                
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

                {/* 회원가입 버튼 */}
                <SubmitButton // auth/SubmitButton 컴포넌트 불러와서 사용
                    loading={loading}
                    disabled={loading || userNameStatus.state !== 'success' || emailStatus.state !== 'success' || passwordStatus.state !== 'success' || confirmStatus.state !== 'success'}
                    currentTheme={currentTheme}
                    text="회원가입"
                />
            </form>
        </div>
    )
}