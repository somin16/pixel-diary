import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssetUrl } from "../../utils/assetHelper";
import { supabase } from "../../utils/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 로그인 로직 (임시)
  const handleLogin = (e) => {
    e.preventDefault();
    // 성공 시 홈 화면(`/`)으로 이동
    navigate('/'); 
  };

  // 준비된 인풋창 배경 이미지 적용 스타일
  const inputBoxStyle = {
    backgroundImage: `url(${getAssetUrl('winter_light', 'boxes', 'auth_info_input_box_x3')})`,
    backgroundSize: '100% 100%'
  };

  // 준비된 로그인 버튼 배경 이미지 적용 스타일
  const loginButtonStyle = {
    backgroundImage: `url(${getAssetUrl('winter_light', 'boxes', 'login_button_x3')})`,
    backgroundSize: '100% 100%'
  };

  // 인풋창 공통 스타일 (Tailwind)
  const inputClassName = "w-full p-5 bg-transparent outline-none placeholder:text-gray-400 font-bold text-lg text-center";

  // 소셜 로그인 실행 함수
  const handleSocialLogin = async (provider) => {
    // 백엔드 가이드에 있던 코드
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider, // 'google', 'kakao' 등
      options: {
        // 인증 후 돌아올 주소 (App.jsx에 설정할 경로)
        redirectTo: `${window.location.origin}/auth-redirect?provider=${provider}`,
        skipBrowserRedirect: false,
      },
    });

    if (error) console.error("Login Error:", error.message);
  };


  return (
    // 1. 전체 컨테이너 (AppShell 안에서 좌우 꽉 차게)
    // h-full, w-full로 설정해서 AppShell 중앙에 배치
    <div className="flex flex-col items-center w-full min-h-full bg-white pt-20 px-10 pb-10 overflow-auto">
      
      {/* 2. 메인 캐릭터 액자 (펭귄 & 눈사람) */}
      <div className="w-auto h-auto mb-12 flex items-center justify-center">
        <img 
          src={getAssetUrl('winter_light', 'icons', 'app_icon_x2')} 
          alt="마스코트"
          className="w-full h-full object-contain"
        />
      </div>

      {/* 3. 로그인 폼 (이메일, 비밀번호, 로그인 버튼) */}
      <form onSubmit={handleLogin} className="w-full flex flex-col gap-6 mb-8">
        {/* 이메일 입력창 */}
        <div className="w-full" style={inputBoxStyle}>
          <input 
            type="email" 
            placeholder="이메일"
            className={inputClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {/* 비밀번호 입력창 */}
        <div className="w-full" style={inputBoxStyle}>
          <input 
            type="password" 
            placeholder="비밀번호"
            className={inputClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {/* 로그인 버튼 */}
        <button 
          type="submit"
          className="w-full p-5 text-white font-bold text-2xl active:scale-95 transition-transform"
          style={loginButtonStyle}
        >
          로그인
        </button>
      </form>

      {/* 4. 비밀번호 찾기 링크 */}
      <button className="text-sm text-gray-700 underline mb-10 font-medium">
        비밀번호를 잊어버리셨나요?
      </button>

      {/* 5. 구분선 (픽셀 느낌나게 직접 구현) */}
      <div className="w-full h-0.5 bg-[#35407A] mb-10"></div>

      {/* 6. 소셜 로그인 영역 (구글, 카카오, 네이버) */}
      <div className="flex gap-8 mb-16">
        {[ 
            { id: 'google', name: 'google_icon_x3' },
            { id: 'kakao', name: 'kakaotalk_icon_x3' },
            { id: 'naver', name: 'naver_icon_x3' } 
        ].map(social => (
          <button 
            key={social.id}
            onClick={() => handleSocialLogin(social.id)} // 클릭 시 함수 실행
            className="w-20 h-20 active:scale-90 transition-transform">
            <img 
              src={getAssetUrl('winter_light', 'icons', social.name)} 
              alt={`${social.id} 로그인`}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* 7. 회원가입 링크 */}
      <button className="text-sm text-gray-800 underline font-medium">
        회원가입 하러가기
      </button>

    </div>
  );
}