import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import { supabase } from "../../../utils/SupabaseClient"; // supabase 불러오기
import { authFetch } from "../../../utils/AuthHelper";

// zustand 불러오기
import { useProfileStore } from '../../../store/useProfileStore';

// 컴포넌트 불러오기
import LogoutDialog from '../../../components/more/auth/LogoutDialog';
import WithdrawalDialog from '../../../components/more/auth/WithdrawalDialog';
import PasswordChangeDialog from '../../../components/more/auth/PasswordChangeDialog';
import ResultDialog from '../../../components/common/dialog/ResultDialog';
import Header from "../../../components/common/Header";

// 계정 설정 메뉴 항목들
const accountItems = [
  { id: 'email', label: '이메일' },
  { id: 'password', label: '비밀번호 변경' },
  { id: 'logout', label: '로그아웃', isDanger: true },
  { id: 'withdrawal', label: '회원탈퇴', isDanger: true },
];

const Account = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 다이얼로그 상태 관리 'logout' | 'withdrawal' | null
  const [dialog, setDialog] = useState(null);
  // 결과 알림창 다이얼로그 상태 관리 'logout' | 'withdrawal' | null
  const [resultDialog, setResultDialog] = useState(null);

  // 유저 이메일 상태
  const [userEmail, setUserEmail] = useState("");
  // 로그인 수단 상태
  const [loginProvider, setLoginProvider] = useState("");

  // 렌더링 시 Supabase에서 현재 로그인한 유저 이메일 가져오기
  useEffect(() => {
    // 비동기 작업의 '중단 신호'를 관리하는 컨트롤러 생성
    const controller = new AbortController();
    const { signal } = controller;

    const fetchUser = async () => {
      try {
        // Supabase 서버에서 현재 세션 유저 정보 요청
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        // 데이터가 도착했을 때, 컴포넌트를 나갔는지(aborted) 확인 후 상태 업데이트
        if (user && !signal.aborted) {
          // user_metadata.provider를 먼저 확인하고, 없으면 app_metadata 확인
          const provider = user.user_metadata?.provider || user.app_metadata?.provider || "email";
          // provider 정보 추출 (google, kakao, naver, email 등)
          setLoginProvider(provider);
          setUserEmail(user.email);
        }
      } catch (error) {
        // 이미 컴포넌트를 나간 상황에서의 에러는 무시하고, 실제 에러만 기록
        if (!signal.aborted) {
          console.error("사용자 정보를 가져오는 중 에러 발생:", error.message);
        }
      }
    };

    fetchUser();

    // 클린업 함수: 컴포넌트가 사라질 때 중단 신호를 보냄
    return () => {
      controller.abort();
    };
  }, []);

  // 로그인 수단에 따른 메뉴 필터링 (소셜 유저는 비밀번호 변경 항목 제외)
  const visibleAccountItems = accountItems.filter(item => {
    if (item.id === 'password' && loginProvider !== 'email') return false;
    return true;
  });

  // 로그아웃 확인
  const handleLogout = async () => {
    try {
      // 현재 세션에서 토큰들 가져오기
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 백엔드 로그아웃 API 호출해서 백엔드 세션만 먼저 만료시킴
        await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/logout/`,
          {
            method: 'POST',
            body: JSON.stringify({ refresh_token: session.refresh_token }),
          }
        );
      }
      // 팝업 띄우기 '전'에 로컬 세션 즉시 삭제
      try {
        await supabase.auth.signOut({ scope: 'local' });
        sessionStorage.clear(); // deco_all_items, deco_owned_ids, diary_list 등 삭제
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } catch (e) {
        console.error("로컬 세션 삭제 무시:", e);
      }

      // 로그아웃 시 프로필 정보 메모리에서 지우기
      useProfileStore.getState().clearProfile();

      setDialog(null);
      setResultDialog('logout');

    } catch (error) {
      console.error("로그아웃 중 에러 발생:", error);
      alert("로그아웃에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  // 회원탈퇴 확인 - 소셜 유저는 password 없이 요청
  const handleWithdrawal = async (password) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        return;
      }

      const body = loginProvider === 'email'
        ? { password }          // 이메일 유저만 비밀번호 전송
        : {};                   // 소셜 유저는 빈 바디

      await authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/withdrawal/`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      // 서버 처리 완료 직후, 팝업 띄우기 '전'에 로컬 세션 즉시 삭제 (유령 세션 방지)
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        console.error("로컬 세션 삭제 무시:", e);
      }

      // 회원탈퇴 시 프로필 메모리 지우기
      useProfileStore.getState().clearProfile();

      setDialog(null);
      setResultDialog('withdrawal');

    } catch (error) {
      console.error('회원탈퇴 중 에러 발생:', error);
      let message = '회원탈퇴에 실패했습니다. 다시 시도해 주세요.';

      if (error.response?.status === 401 || error.response?.data?.message === '비밀번호가 일치하지 않습니다') {
        message = '비밀번호가 일치하지 않습니다';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      throw message;
    }
  };

  // 비밀번호 변경 API 연동 함수
  const handlePasswordChange = async ({ currentPw, newPw }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        return;
      }

      // 장고 백엔드 API 호출 (PATCH 메서드 전달)
      const response = await authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/password/`, {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPw,
          new_password: newPw,
        }),
      });

      // 응답 데이터 추출
      const data = response.data || response;

      // 새로 발급해 준 토큰으로 슈파베이스 세션 갱신
      if (data?.access_token && data?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });
      }

      // 성공 시 팝업 전환
      setDialog(null);
      setResultDialog('passwordSuccess');

    } catch (error) {
      console.error('비밀번호 변경 중 에러 발생:', error);

      // 기본 에러 메시지
      let message = '비밀번호 변경에 실패했습니다.';

      // 에러 메세지
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.data?.message) {
        message = error.data.message;
      } else if (error.message) {
        message = error.message;
      }

      throw message;
    }
  };

  // 결과 확인 버튼 - 결과 확인 버튼 클릭 시 로그인 화면으로 이동
  const handleResultConfirm = async () => {
    const targetDialog = resultDialog; // 현재 상태 변수에 백업
    setResultDialog(null); // 팝업 창 닫기
    if (targetDialog === 'logout' || targetDialog === 'withdrawal') {
      // Navigate는 App.jsx가 알아서 해주겠지만, 확실히 하기 위해 유지
      navigate('/auth/login', { replace: true });
    }
    // 비밀번호 변경 완료 시 로그인 화면으로 가지 않고 페이지에 남음
  };

  return (
    // 전체 페이지를 감싸는 컨테이너 (배경 이미지가 깔리는 곳)
    <div
      className="w-full h-screen overflow-hidden pt-[16%] pb-[8%] flex flex-col bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`
      }}
    >

      {/* 상단 헤더 (뒤로 가기 & 제목) */}
      <Header title="계정 설정" />

      {/* 계정 설정 메뉴 리스트 영역 */}
      <ul className="list-none p-0 m-0 flex flex-col">
        {visibleAccountItems.map((item) => (
          <li
            key={item.id}
            className={`w-full -mt-1 first:mt-0 ${item.id !== 'email' ? 'cursor-pointer' : ''}`}
            onClick={() => {
              // 이메일과 앱 버전은 눌러도 아무 반응 없도록 예외 처리
              if (item.id === 'email' || item.id === 'version') return;

              if (item.id === 'logout') setDialog('logout');
              else if (item.id === 'withdrawal') setDialog('withdrawal');
              else if (item.id === 'password') setDialog('password');
              else if (item.path) navigate(item.path); // path값이 있을 때만 이동
            }}
          >
            {/* 메뉴 박스 이미지 */}
            <div className="relative w-full">
              <img
                src={getAssetUrl(currentTheme, 'boxes', 'menu_box_x3')}
                alt="메뉴 배경"
                className="relative w-full h-auto block"
              />
              <span
                className={`absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-sm ${item.isDanger ? 'text-[#ef4444]' : 'text-black'}`}
              >
                {item.label}
              </span>

              {/* 이메일 항목일 경우 우측에 아이콘 + 실제 이메일 표시 */}
              {item.id === 'email' && (
                <div className={`absolute z-10 top-1/2 -translate-y-1/2 flex items-center gap-[4%]
                                ${loginProvider === 'email' || !loginProvider ? 'right-[3%]' : 'right-[1%]'}`}
                >

                  {/* 로그인 수단에 따른 아이콘 표시 */}
                  {loginProvider === 'google' && (
                    <img src={getAssetUrl(currentTheme, 'icons', 'google_icon_x3')} alt="Google" className="w-[22%] h-auto object-contain" />
                  )}
                  {loginProvider === 'kakao' && (
                    <img src={getAssetUrl(currentTheme, 'icons', 'kakaotalk_icon_x3')} alt="Kakao" className="w-[22%] h-auto object-contain" />
                  )}
                  {loginProvider === 'naver' && (
                    <img src={getAssetUrl(currentTheme, 'icons', 'naver_icon_x3')} alt="Naver" className="w-[22%] h-auto object-contain" />
                  )}

                  {/* 이메일 텍스트 */}
                  <span className="text-sm text-gray-500">
                    {userEmail}
                  </span>
                </div>
              )}

            </div>
          </li>
        ))}
      </ul>

      {/* 비밀번호 변경 다이얼로그 */}
      {dialog === 'password' && (
        <PasswordChangeDialog
          onConfirm={handlePasswordChange}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* 로그아웃 다이얼로그 */}
      {dialog === 'logout' && (
        <LogoutDialog
          onConfirm={handleLogout}
          onCancel={() => setDialog(null)}
          maxWidth="320px"
        />
      )}

      {/* 회원탈퇴 다이얼로그 */}
      {dialog === 'withdrawal' && (
        <WithdrawalDialog
          loginProvider={loginProvider}
          onConfirm={handleWithdrawal}
          onCancel={() => setDialog(null)}
          maxWidth="320px"
        />
      )}

      {/* 결과 알림 다이얼로그 (하나로 통합) */}
      {resultDialog && (
        <ResultDialog
          message={
            resultDialog === 'logout' ? '로그아웃 되었습니다' :
              resultDialog === 'withdrawal' ? <>회원 탈퇴가<br />완료 되었습니다</> :
                '비밀번호가 변경되었습니다'
          }
          onConfirm={handleResultConfirm}
          maxWidth="320px"
        />
      )}

    </div>
  );
};

export default Account;