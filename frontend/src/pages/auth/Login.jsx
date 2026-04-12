import { useNavigate } from 'react-router-dom';

import { getAssetUrl } from "../../utils/AssetHelper";
import { useTheme } from '../../hooks/useTheme';

import { supabase } from "../../utils/SupabaseClient";
import { useState, useEffect } from 'react';

import AuthValidator from '../../utils/AuthValidator';
import useDebounce from '../../hooks/useDebounce';

export default function Login() {
  const navigate = useNavigate();

 

  // [상태] 입력값 관리
  const [user_email, setUser_email] = useState('');
  const [password, setpassword] = useState('');

  const debouncedUserEmail = useDebounce(user_email, 500); // 0.5초 대기

  // [상태] 로그인 중인지 아닌지
  const [loading, setLoading] = useState(false);

  // [상태] 피드백 메시지
  const [emailStatus, setEmailStatus] = useState({ state: 'default', message: '' });
  const [passwordStatus, setPasswordStatus] = useState({ state: 'default', message: '' });

  // 현재 테마
  const currentTheme = useTheme((state) => state.currentTheme) 

  // 실시간 유효성 검사 이메일
  useEffect(() => {
    const checkEmail = async () => {
      // 클래스 메서드 활용: 두 번째 인자를 false로 주어 형식만 체크
      if (debouncedUserEmail) {
        const status = await AuthValidator.validateEmail(debouncedUserEmail, false);
        setEmailStatus(status);
      }
    };
    checkEmail();
  }, [debouncedUserEmail]);

  // 실시간 유효성 검사 비밀번호
  useEffect(() => {
    // 클래스 메서드 활용
    const status = AuthValidator.validatePassword(password);
    setPasswordStatus(status);
  }, [password]);

  // 일반 로그인 (이메일)
  const onEmailLoginSubmit = async (e) => {
    e.preventDefault();

    // 최종 확인 : 에러가 있거나 빈값이면 중단
    if (emailStatus.state === 'error' || passwordStatus.state === 'error' || !user_email || !password) {
      alert("입력 정보를 다시 확인해주세요")
      return;
    }

    setLoading(true);

    try {
      const loginEndpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/login/`;
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user_email, password: password })
      });

      const authData = await response.json();

      if (response.ok) {
      // 직접 저장하지 않고, 토큰을 쿼리 스트링에 담아 리다이렉트 페이지로 이동
      const params = new URLSearchParams({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token || '',
        provider: 'email'
      });
      
      navigate(`/auth-redirect?${params.toString()}`);
    } else {
      // 서버에서 온 에러 처리
      setEmailStatus({ 
        state: 'error', 
        message: authData.message || "로그인 정보를 확인해주세요." 
      });
    }
  } catch (commError) {
    console.error("통신 장애:", commError);
    // 서버가 꺼져있을 때 사용자에게 알림
    setEmailStatus({ 
      state: 'error', 
      message: "서버와 연결 X . 잠시 후 시도해주세요." 
    });
  } finally {
    setLoading(false);
  }
};


  // 소셜 로그인 실행 함수
  const handleSocialLogin = async (provider) => {
  // 네이버는 Supabase SDK가 지원하지 않아서 별도로 처리
  if (provider === 'naver') {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID; // .env에서 네이버 Client ID 가져오기
    const REDIRECT_URI = `${window.location.origin}/auth-redirect?provider=naver`; // 로그인 후 돌아올 주소
    const STATE = Math.random().toString(36).substring(2); // CSRF 공격 방지용 랜덤값
    
    localStorage.setItem('naver_state', STATE); // 콜백에서 검증하기 위해 state 저장
    
    // 네이버 로그인 페이지로 이동 (code를 받아오기 위함)
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
    return;
  }

  // 구글, 카카오는 Supabase SDK로 처리 (SDK가 code_verifier 자동 생성)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${window.location.origin}/auth-redirect?provider=${provider}`,
      skipBrowserRedirect: false,
    },
  });

  if (error) console.error("Login Error:", error.message);
  };

  //  스타일 설정
  // 로그인 인풋창 배경 이미지 적용 스타일
  const loginInputBoxStyle = {
    backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'auth_info_input_box_x3')})`,
    backgroundSize: '100% 100%'
  };
  // 로그인 인풋창 공통 스타일 
    const LoginInputClassName = "w-full h-full p-6 bg-transparent outline-none placeholder:text-gray-400 text-sm font-bold text-center mt-2 -mb-0.5";

  // 로그인 버튼 배경 이미지 적용 스타일
  const loginButtonStyle = {
    backgroundImage: `url(${getAssetUrl(currentTheme, 'buttons', 'auth_submit_button_x3')})`,
    backgroundSize: '100% 100%'
  };

  return (
    // 전체 컨테이너 (AppShell 안에서 좌우 꽉 차게)
    // h-full, w-full로 설정해서 AppShell 중앙에 배치
    <div className="w-full h-full items-center flex flex-col p-25 ">
      {/* 앱 아이콘 */}
      <div className="p-20">{/* 여백(패딩) 증가 */}
        <img 
          src={getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3')} 
          alt="앱 아이콘"
          className="w-auto h-auto scale-150"// 이미지 스케일 150% 증가
        />
      </div>

      {/* 로그인 폼 (이메일, 비밀번호, 로그인 버튼) */}
      <form onSubmit={onEmailLoginSubmit} noValidate className="w-full flex flex-col gap-2 mb-5">

        {/* 이메일 입력창 */}
        <div className="w-full" style={loginInputBoxStyle}>
          <span className='absolute mt-3 ml-4 font-bold text-xs'>이메일</span>
          <input 
            type="email" 
            placeholder="이메일을 입력하세요"
            className={LoginInputClassName}
            value={user_email}
            onChange={(e) => setUser_email(e.target.value)}
          /> 
        </div>

        {/* 이메일 피드백 메시지 추가 */}
        <div className="h-3 flex items-center pl-2">
          <span className={`text-xs pl-2 font-bold ${AuthValidator.STATUS_COLORS[emailStatus.state]}`}>
            {emailStatus.message}
          </span>
        </div>

        {/* 비밀번호 입력창 */}
        <div className="w-full" style={loginInputBoxStyle}>
          <span className='absolute mt-3 ml-4 font-bold text-xs'>비밀번호</span>
          <input 
            type="password" 
            placeholder="비밀번호를 입력하세요"
            className={LoginInputClassName}
            value={password}
            onChange={(e) => setpassword(e.target.value)}
          />
        </div>

        {/* 비밀번호 피드백 메시지 추가 */}
        <div className="h-3 flex items-center pl-2">
          <span className={`text-xs pl-2 font-bold ${AuthValidator.STATUS_COLORS[passwordStatus.state]}`}>
            {passwordStatus.message}
          </span> 
        </div>
        

        {/* 로그인 버튼 */}
        <button 
          disabled={loading ||emailStatus.state !== 'success' || passwordStatus.state !== 'success' } // 로그인 중에는 클릭 방지
          type="submit"
          className=
            {`w-full p-5 text-white font-bold text-2xl transition-transform outline-none
            ${(loading || emailStatus.state !== 'success' || passwordStatus.state !== 'success') ? 'opacity-50' : 'active:scale-95'}`}
          style={loginButtonStyle}
        >
         {loading ? "로그인 중" : "로그인"}
        </button>
      </form>

      {/* 비밀번호 찾기 링크 */}
      <button className="text-sm text-gray-700 underline mb-5 font-medium outline-none">
        비밀번호를 잊어버리셨나요?
      </button>

      {/* 소셜 로그인 영역 (구글, 카카오, 네이버) */}
      <div className="flex gap-4 mb-5">
        {[ 
            { id: 'google', name: 'google_icon_x3' },
            { id: 'kakao', name: 'kakaotalk_icon_x3' },
            { id: 'naver', name: 'naver_icon_x3' } 
        ].map(social => (
          <button 
            key={social.id}
            onClick={() => handleSocialLogin(social.id)} // 클릭 시 함수 실행
            className="w-20 h-20 transition-transform outline-none">
            <img 
              src={getAssetUrl(currentTheme, 'icons', social.name)} 
              alt={`${social.id} 로그인`}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* 회원가입 링크 */}
      <button 
        onClick={() => navigate('/signup')}
        className="text-sm text-gray-800 underline font-medium outline-none">
        회원가입 하러가기
      </button>

    </div>
  );
}