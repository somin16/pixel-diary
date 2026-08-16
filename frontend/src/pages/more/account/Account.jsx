import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";
import { supabase } from "../../../utils/SupabaseClient";
import { useLogout, useWithdraw, useChangePassword } from '../../../hooks/mutations/useAuthMutations';

// zustand 불러오기
import { useProfileStore } from '../../../stores/useProfileStore';

// 컴포넌트 불러오기
import LogoutDialog from '../../../components/more/auth/LogoutDialog';
import WithdrawalDialog from '../../../components/more/auth/WithdrawalDialog';
import PasswordChangeDialog from '../../../components/more/auth/PasswordChangeDialog';
import ResultDialog from '../../../components/common/dialog/ResultDialog';
import Header from "../../../components/common/Header";

const accountItems = [
  { id: 'email', label: '이메일' },
  { id: 'password', label: '비밀번호 변경' },
  { id: 'logout', label: '로그아웃', isDanger: true },
  { id: 'withdrawal', label: '회원탈퇴', isDanger: true },
];

const Account = () => {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const [dialog, setDialog] = useState(null);
  const [resultDialog, setResultDialog] = useState(null);

  const [userEmail, setUserEmail] = useState("");
  const [loginProvider, setLoginProvider] = useState("");

  // 뮤테이션 훅 연결
  const logout = useLogout();
  const withdraw = useWithdraw();
  const changePassword = useChangePassword();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user && !signal.aborted) {
          const provider = user.user_metadata?.provider || user.app_metadata?.provider || "email";
          setLoginProvider(provider);
          setUserEmail(user.email);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("사용자 정보를 가져오는 중 에러 발생:", error.message);
        }
      }
    };

    fetchUser();
    return () => { controller.abort(); };
  }, []);

  const visibleAccountItems = accountItems.filter(item => {
    if (item.id === 'password' && loginProvider !== 'email') return false;
    return true;
  });

  // 로그아웃 확인 - useLogout이 백엔드 호출 + 로컬 세션 정리를 담당
  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      setDialog(null);
      setResultDialog('logout');
    } catch (error) {
      console.error("로그아웃 중 에러 발생:", error);
      alert("로그아웃에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  // 회원탈퇴 확인 - 소셜 유저는 password 없이 요청
  const handleWithdrawal = async (password) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    const body = loginProvider === 'email' ? { password } : {};

    try {
      await withdraw.mutateAsync(body);
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

  // 비밀번호 변경 - useChangePassword가 새 토큰으로 세션 동기화까지 담당
  const handlePasswordChange = async ({ currentPw, newPw }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    try {
      await changePassword.mutateAsync({ current_password: currentPw, new_password: newPw });
      setDialog(null);
      setResultDialog('passwordSuccess');
    } catch (error) {
      console.error('비밀번호 변경 중 에러 발생:', error);
      let message = '비밀번호 변경에 실패했습니다.';

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

  const handleResultConfirm = async () => {
    const targetDialog = resultDialog;
    setResultDialog(null);
    if (targetDialog === 'logout' || targetDialog === 'withdrawal') {
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <div
      className="w-full h-screen overflow-hidden pt-[16%] pb-[8%] flex flex-col bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})` }}
    >
      <Header title="계정 설정" />

      <ul className="list-none p-0 m-0 flex flex-col">
        {visibleAccountItems.map((item) => (
          <li
            key={item.id}
            className={`w-full -mt-1 first:mt-0 ${item.id !== 'email' ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (item.id === 'email' || item.id === 'version') return;
              if (item.id === 'logout') setDialog('logout');
              else if (item.id === 'withdrawal') setDialog('withdrawal');
              else if (item.id === 'password') setDialog('password');
              else if (item.path) navigate(item.path);
            }}
          >
            <div className="relative w-full">
              <img
                src={getAssetUrl(currentTheme, 'boxes', 'menu_box_x3')}
                alt="메뉴 배경"
                className="relative w-full h-auto block"
              />
              <span className={`absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-sm ${item.isDanger ? 'text-[#ef4444]' : 'text-black'}`}>
                {item.label}
              </span>

              {item.id === 'email' && (
                <div className={`absolute z-10 top-1/2 -translate-y-1/2 flex items-center gap-[4%]
                                ${loginProvider === 'email' || !loginProvider ? 'right-[3%]' : 'right-[1%]'}`}>
                  {loginProvider === 'google' && (
                    <img src={getAssetUrl(currentTheme, 'icons', 'google_icon_x3')} alt="Google" className="w-[22%] h-auto object-contain" />
                  )}
                  {loginProvider === 'kakao' && (
                    <img src={getAssetUrl(currentTheme, 'icons', 'kakaotalk_icon_x3')} alt="Kakao" className="w-[22%] h-auto object-contain" />
                  )}
                  {loginProvider === 'naver' && (
                    <img src={getAssetUrl(currentTheme, 'icons', 'naver_icon_x3')} alt="Naver" className="w-[22%] h-auto object-contain" />
                  )}
                  <span className="text-sm text-gray-500">{userEmail}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {dialog === 'password' && (
        <PasswordChangeDialog onConfirm={handlePasswordChange} onCancel={() => setDialog(null)} />
      )}

      {dialog === 'logout' && (
        <LogoutDialog onConfirm={handleLogout} onCancel={() => setDialog(null)} maxWidth="320px" />
      )}

      {dialog === 'withdrawal' && (
        <WithdrawalDialog
          loginProvider={loginProvider}
          onConfirm={handleWithdrawal}
          onCancel={() => setDialog(null)}
          maxWidth="320px"
        />
      )}

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
