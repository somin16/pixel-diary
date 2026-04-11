// src/pages/auth/AuthRedirect.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function AuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation()

  const [status, setStatus] = useState('loading');

  useEffect(() => {
  let isMounted = true; // 메모리 누수 및 중복 실행 방지

  const processAuth = async () => {
  // 구글/카카오는 # 뒤에 토큰이 바로 옴 (Supabase implicit 방식)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');

  // 네이버는 ? 뒤에 code가 옴 (일반 OAuth 방식)
  const params = new URLSearchParams(window.location.search);
  const provider = params.get('provider');
  const code = params.get('code');

  // 네이버 로그인 처리
  // 구글/카카오와 달리 code를 백엔드로 보내서 토큰을 받아야 함
  if (provider === 'naver' && code) {
    try {
      // 백엔드 /api/v1/auth/naver로 code 전송
      // 백엔드에서 네이버 API로 토큰 요청 후 Supabase 유저 생성/조회
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/naver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);   // 토큰 저장
        localStorage.setItem('refresh_token', data.refresh_token); // 토큰 저장
        localStorage.removeItem('naver_state'); // 사용한 state 삭제
        setStatus('success');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus('error');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error("네이버 로그인 에러:", err);
      setStatus('error');
      setTimeout(() => navigate('/login'), 2000);
    }
    return;
  }

  // 구글/카카오 로그인 처리
  // Supabase가 # 뒤에 토큰을 바로 전달해줘서 백엔드 호출 없이 저장만 하면 됨
  if (access_token && isMounted) {
    try {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setStatus('success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error("토큰 저장 에러:", err);
      setStatus('error');
      setTimeout(() => navigate('/login'), 2000);
    }
  } else {
    setStatus('error');
    setTimeout(() => navigate('/login'), 2000);
  }
};

  processAuth();
  return () => { isMounted = false; }; // 언마운트 시 실행 방지
}, [navigate]); 

  // 상태에 따른 메시지 설정
  const renderMessage = () => {
    if (status === 'loading') {
      return (
        <>
          <div className="mb-4 animate-bounce text-4xl">⛄️</div>
          <p className="text-lg font-bold text-[#35407A]">로그인 정보를 확인하고 있어요...</p>
          <p className="text-sm text-gray-400 mt-2">잠시만 기다려 주세요!</p>
        </>
      );
    }
    if (status === 'success') {
      return (
        <>
          <div className="mb-4 text-4xl">✨</div>
          <p className="text-lg font-bold text-green-600">로그인 성공!</p>
          <p className="text-sm text-gray-400 mt-2">곧 홈 화면으로 이동합니다.</p>
        </>
      );
    }
    if (status === 'error') {
      return (
        <>
          <div className="mb-4 text-4xl">❌</div>
          <p className="text-lg font-bold text-red-500">인증에 실패했습니다.</p>
          <p className="text-sm text-gray-400 mt-2">다시 로그인해 주세요.</p>
        </>
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white">
      {renderMessage()}
    </div>
  );
}