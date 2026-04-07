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
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const provider = params.get('provider') || 'google';
    const code_verifier = localStorage.getItem('supabase.auth.code_verifier');

    if (code && code_verifier && isMounted) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/social`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, code, code_verifier })
        });

        if (response.ok) {
          const data = await response.json(); // 추가
          localStorage.setItem('access_token', data.access_token);   // 추가
          localStorage.setItem('refresh_token', data.refresh_token); // 추가

          setStatus('success');
          // 성공 시 로컬스토리지에 저장된 verifier 삭제 (보안 및 깔끔한 정리)
          localStorage.removeItem('supabase.auth.code_verifier');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setStatus('error'); // 에러 상태 업데이트
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error("연동 에러:", err);
        setStatus('error');
        setTimeout(() => navigate('/login'), 2000);
      }
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