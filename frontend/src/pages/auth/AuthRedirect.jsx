import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthRedirect() {
  const navigate = useNavigate();

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

      // 일반 로그인
      const emailAccess = params.get('access_token');
      const emailRefresh = params.get('refresh_token');

      // 일반 회원가입
      const from = params.get('from');
      const errorMessage = params.get('message');

      // [ case 1 ]회원가입 결과 처리 (from=signup인 경우)
      if (from === 'signup' && isMounted) {
        if (errorMessage) {
          setStatus('signup_error'); // 실패
          setTimeout(() => navigate('/signup'), 2500); // 2.5초 후 가입창으로
        } else {
          setStatus('signup_success'); // 성공
          setTimeout(() => navigate('/login'), 2000); // 2초 후 로그인창으로
        }
        return;
      }

      // [ case2 ]네이버 로그인 처리
      // 구글/카카오와 달리 code를 백엔드로 보내서 토큰을 받아야 함
      if (provider === 'naver' && code) {
        try {
          // 백엔드 /api/v1/auth/naver/로 code 전송
          // 백엔드에서 네이버 API로 토큰 요청 후 Supabase 유저 생성/조회
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/naver/`, {
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

      // [ case 3 ] 구글/카카오 로그인 또는 일반 로그인 (토큰이 이미 있는 경우)
      // Supabase가 # 뒤에 토큰을 바로 전달해줘서 백엔드 호출 없이 저장만 하면 됨
      // hash에서 온 거나, query에서 온 거나 둘 중 하나만 있으면 성공
      const finalAccess = access_token || emailAccess;
      const finalRefresh = refresh_token || emailRefresh;

      if (finalAccess && isMounted) {
        try {
          localStorage.setItem('access_token', finalAccess);
          localStorage.setItem('refresh_token', finalRefresh);
          setStatus('success');
          setTimeout(() => navigate('/'), 1500);
        } catch (err) {
          console.error("토큰 저장 에러:", err);
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        // 데이터 없는 잘못된 접근
          if (isMounted) {
            setStatus('error');
            setTimeout(() => navigate('/login'), 2000);
          }
        }
        
      
    };
      processAuth();
      return () => { isMounted = false; };
  }, [navigate]);


  // 상태에 따른 메시지 설정
  const renderMessage = () => { 
    if (status === 'loading') {
      return (
        <>
          <div className="mb-4 animate-bounce text-4xl">☃️</div>
          <p className="text-lg font-bold text-[#35407A]">로그인 정보를 확인하고 있어요...</p>
          <p className="text-sm text-gray-400 mt-2">잠시만 기다려 주세요!</p>
        </>
      );
    }
    if (status === 'success') {
      return (
        <>
          <div className="mb-4 text-4xl">🌌</div>
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
    if(status ==='signup_success') {
      return (
        <>
            <div className="mb-4 text-5xl animate-bounce">🎉</div>
            <p className="text-xl font-bold text-[#35407A]">가입을 환영합니다!</p>
            <p className="text-sm text-gray-400 mt-2">로그인 화면으로 이동합니다.</p>
          </>
      );
    }
        
    if(status ==='signup_error') {
      return (
          <>
              <div className="mb-4 text-5xl">⚠️</div>
              <p className="text-xl font-bold text-red-500">회원가입 실패</p>
              <p className="text-md text-gray-600 mt-2">다시 시도해주세요</p>
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