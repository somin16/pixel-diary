import { useNavigate } from 'react-router-dom';

import { getAssetUrl } from "../../utils/AssetHelper";
import { useTheme } from "../../hooks/useTheme";

import { supabase } from "../../utils/SupabaseClient";
import { useState, useEffect } from 'react';

import AuthValidator from '../../utils/AuthValidator';
import useDebounce from '../../hooks/useDebounce';

export default function signup() {
    const navigate = useNavigate();

    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme);

    // [상태] 입력값 관리
    const [user_name, setUser_name] = useState('');
    const [user_email, setUser_email] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // [상태] 회원가입 중인지 아닌지
    const [loading, setLoading] = useState(false);

    // 디바운스 적용 (서버 요청 횟수 조절)
    const debouncedUserEmail = useDebounce(user_email, 500) // 0.5초 딜레이
    const debouncedUserName = useDebounce(user_name, 500) // 0.5초 딜레이

    // [상태] 피드백 메시지
    const [emailStatus, setEmailStatus] = useState({ state: 'default', message: '' });
    const [userNameStatus, setUserNameStatus] = useState({ state: 'default', message: '' });
    const [passwordStatus, setPasswordStatus] = useState({ state: 'default', message: '' });
    const [confirmStatus, setConfirmStatus] = useState({ state: 'default', message: '' });

    // 이메일 : 형식 + 중복 체크 (true)를 전달해 로그인 페이지와는 달리 중복체크 가능하게함
    useEffect( () => {
        const checkEmail = async () => {
            if (debouncedUserEmail) {
                const status = await AuthValidator.validateEmail(debouncedUserEmail, true);
                setEmailStatus(status);
            }
        };
        checkEmail();
    }, [debouncedUserEmail]);

    // 닉네임: 길이 + 중복 체크
  useEffect(() => {
    const checkUserName = async () => {
      if (debouncedUserName) {
        const status = await AuthValidator.validateUserName(debouncedUserName);
        setUserNameStatus(status);
      }
    };
    checkUserName();
  }, [debouncedUserName]);

  // 비밀번호: 규칙 체크
  useEffect(() => {
    setPasswordStatus(AuthValidator.validatePassword(password));
  }, [password]);

  // 비밀번호 확인: 일치 여부 체크
  useEffect(() => {
    setConfirmStatus(AuthValidator.validateConfirmPassword(password, confirmPassword));
  }, [password, confirmPassword]);


    // 일반 이메일 회원가입 로직
    const onSignupSubmit = async (e) => {
        e.preventDefault();

        // 
        const isAllValid = 
            emailStatus.state === 'success' &&
            userNameStatus.state === 'success' &&
            passwordStatus.state === 'success' &&
            confirmStatus.state === 'success';

        if (!isAllValid) {
            alert("모든 항목을 올바르게 입력해주세요");
            return;
        }

        setLoading(true);
        try{
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

    // 스타일 적용
    // 회원가입 인풋창 배경 이미지 적용 스타일
    const signInputBoxStyle = {
        backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'auth_info_input_box_x3')})`,
        backgroundSize: '100% 100%'
    }
    // 회원가입 인풋창 공통 클래스 네임
    const signupInputClassName = "w-full h-full p-6 bg-transparent outline-none placeholder:text-gray-400 text-sm font-bold text-center mt-2 -mb-0.5";

    // 회원가입 버튼 배경 이미지 적용 스타일
    const signupButtonStyle = {
        backgroundImage: `url(${getAssetUrl(currentTheme, 'buttons', 'auth_submit_button_x3')})`,
        backgroundSize: '100% 100%'
    };

    return(
        // 전체 컨테이너
        <div className='w-full h-full items-center flex flex-col p-25'>
            {/* 회원가입 글씨 */}
            <h1 className='text-5xl font-bold text-center mt-10'>Pixel Diary</h1><br/>
            <h1 className='text-3xl font-bold text-center mb-10'>회원가입</h1>
            {/* 회원가입 폼 (이메일, 비밀번호, 회원가입 버튼) */}
            <form onSubmit={onSignupSubmit} noValidate className="w-full flex flex-col gap-2 mb-5">
                
                {/* 닉네임 입력창 */}
                <div className='w-full' style={signInputBoxStyle}>
                    <span className='absolute mt-3 ml-4 font-bold text-xs'>닉네임</span>
                    <input
                        type='username'
                        placeholder = "닉네임을 입력하세요"
                        className = {signupInputClassName}
                        value={user_name}
                        onChange={(e) => setUser_name(e.target.value)}
                    />
                </div>

                {/* 닉네임 피드백 메시지 추가 */}
                <div className="h-3 flex items-center pl-2">
                    <span className={`text-xs pl-2 font-bold ${AuthValidator.STATUS_COLORS[userNameStatus?.state]}`}>
                        {userNameStatus.message}    
                    </span>            
                </div>                

                {/* 이메일 입력창 */}
                <div className='w-full' style={signInputBoxStyle}>
                    <span className='absolute mt-3 ml-4 font-bold text-xs'>이메일</span>
                    <input
                        type='useremail'
                        placeholder = "이메일을 입력하세요"
                        className = {signupInputClassName}
                        value={user_email}
                        onChange={(e) => setUser_email(e.target.value)}
                    />
                </div>

                {/* 이메일 피드백 메시지 추가 */}
                <div className="h-3 flex items-center pl-2">
                    <span className={`text-xs pl-2 font-bold ${AuthValidator.STATUS_COLORS[emailStatus?.state]}`}>
                        {emailStatus.message}    
                    </span>            
                </div> 

                {/* 비밀번호 입력창 */}
                <div className='w-full' style={signInputBoxStyle}>
                    <span className='absolute mt-3 ml-4 font-bold text-xs'>비밀번호</span>
                    <input
                        type='password'
                        placeholder = "비밀번호를 입력하세요"
                        className = {signupInputClassName}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {/* 비밀번호 피드백 메시지 추가 */}
                <div className="h-3 flex items-center pl-2">
                    <span className={`text-xs pl-2 font-bold ${AuthValidator.STATUS_COLORS[passwordStatus.state]}`}>
                        {passwordStatus.message}    
                    </span>            
                </div> 

                {/* 비밀번호 확인창 */}
                <div className='w-full' style={signInputBoxStyle}>
                    <span className='absolute mt-3 ml-4 font-bold text-xs'>비밀번호 확인</span>
                    <input
                        type='confrimpassword'
                        placeholder = "비밀번호를 한번 더 입력하세요"
                        className = {signupInputClassName}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {/* 비밀번호 확인 피드백 메시지 추가 */}
                <div className="h-3 flex items-center pl-2">
                    <span className={`text-xs pl-2 font-bold ${AuthValidator.STATUS_COLORS[confirmStatus.state]}`}>
                        {confirmStatus.message}    
                    </span>            
                </div> 

                {/* 회원가입 버튼 */}
                <button
                    disabled={loading || userNameStatus.state !== 'success' || emailStatus.state !== 'success' || passwordStatus.state !== 'success' || confirmStatus.state !== 'success'} // 회원가입 중에는 클릭 방지
                    type='submit'
                    className=
                        {`w-full p-5 text-white font-bold text-2xl transition-transform outline-none
                        ${(loading || userNameStatus.state !== 'success' || emailStatus.state !== 'success' || passwordStatus.state !== 'success' || confirmStatus.state !== 'success') ? 'opacity-50' : 'active:scale-95'}`}
                    style={signupButtonStyle}>
                    {loading ? "회원가입 중" : "회원가입"}
                </button>
            </form>
        </div>
    )
}