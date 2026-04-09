import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssetUrl } from "../../utils/assetHelper";
import { supabase } from "../../utils/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 로그인 로직 (임시)
  const handleLogin = (e) => {
    e.preventDefault();

    setLoading(true);
    // 성공 시 1초 뒤 홈 화면(`/`)으로 이동
    setTimeout(() => {
      setLoading(false);
      console.log("임시 로그인 성공!");
      navigate('/');
    }, 1000);
  };

  // 준비된 인풋창 배경 이미지 적용 스타일
  const inputBoxStyle = {
    backgroundImage: `url(${getAssetUrl('winter_light', 'boxes', 'auth_info_input_box_x3')})`,
    backgroundSize: '100% 100%'
  };

  // 준비된 로그인 버튼 배경 이미지 적용 스타일
  const loginButtonStyle = {
    backgroundImage: `url(${getAssetUrl('winter_light', 'buttons', 'login_button_x3')})`,
    backgroundSize: '100% 100%'
  };

  // 인풋창 공통 스타일 
  const inputClassName = "w-auto p-5 bg-transparent outline-none placeholder:text-gray-400 font-bold text-center";

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
    // 전체 컨테이너 (AppShell 안에서 좌우 꽉 차게)
    // h-full, w-full로 설정해서 AppShell 중앙에 배치
    <div className="w-full h-full items-center flex flex-col p-25 ">
      {/* 앱 아이콘 */}
      <div className="p-10">
        <img 
          src={getAssetUrl('winter_light', 'icons', 'app_icon_x2')} 
          alt="앱 아이콘"
          className="w-auto h-auto"
        />
      </div>

      {/* 로그인 폼 (이메일, 비밀번호, 로그인 버튼) */}
      <form onSubmit={handleLogin} className="w-full flex flex-col gap-6 mb-8">
        {/* 이메일 입력창 */}
        <div className="w-full" style={inputBoxStyle}>
          <input 
            type="email" 
            placeholder="이메일을 입력하세요"
            className={inputClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {/* 비밀번호 입력창 */}
        <div className="w-full" style={inputBoxStyle}>
          <input 
            type="password" 
            placeholder="비밀번호를 입력하세요"
            className={inputClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {/* 로그인 버튼 */}
        <button 
          disabled={loading} // 로그인 중에는 클릭 방지
          type="submit"
          className="w-full p-5 text-white font-bold text-2xl transition-transform outline-none"
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
              src={getAssetUrl('winter_light', 'icons', social.name)} 
              alt={`${social.id} 로그인`}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* 회원가입 링크 */}
      <button className="text-sm text-gray-800 underline font-medium outline-none">
        회원가입 하러가기
      </button>

    </div>
  );
}