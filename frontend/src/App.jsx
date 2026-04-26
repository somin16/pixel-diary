// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react"; // 리액트
import { supabase } from "./utils/SupabaseClient"; // supabase

import AppShell from "./components/layout/AppShell"; // AppShell 불러오기
import Home from "./pages/home/Home"; // 홈 화면 부품을 가져온다
import Game1 from "./game/game1/Game1"; // 게임1 화면
import Game2 from "./game/game2/Game2"; // 게임2 화면
import MorePage from "./pages/more/MorePage"; // 더보기 화면
import Profile from "./pages/profile/Profile"; // 더보기 - 프로필 화면
import Login from "./pages/auth/Login"; // 로그인 화면
import AuthRedirect from "./pages/auth/AuthRedirect"; // 로그인, 회원가입 진행 시 화면
import Signup from "./pages/auth/SignUp"; // 회원가입 화면
import Setting from "./pages/setting/Setting"; // 더보기 - 설정 메인화면
import Shop from "./pages/shop/Shop"; // 더보기 - 상점 화면
import SendResetPasswordLink from "./pages/auth/SendResetPasswordLink"; // 비밀번호 재설정 링크 이메일 발송 화면

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 현재 세션 가져오기
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 로그인 상태 변화 감시
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return null; // 로딩 중에는 아무것도 안 보여주거나 로딩바 노출

    return (
        <BrowserRouter>
            <Routes>
                {/* 세션이 없을 때 (로그인 전) */}
                {!session ? (
                    <Route element={<AppShell />}>
                        {/* 주소가 /auth/login 이면 로그인 화면을 보여줘 */}
                        <Route path="/auth/login" element={<Login />} />

                        {/* 주소가 /auth/auth-redirect 이면 로그인/ 회원가입 정보 화면을 보여줘 */}
                        <Route path="/auth/auth-redirect" element={<AuthRedirect />} />

                        {/* 주소가 /signup 이면 회원가입 화면을 보여줘 */}
                        <Route path="/auth/signup" element={<Signup />} />

                        {/* 주소가 /password/send-reset-link 이면 비밀번호 재설정 이메일 발송 화면을 보여줘 */}
                        <Route path="/auth/password/send-reset-link" element={<SendResetPasswordLink />} />

                        {/* ⚠️ 로그인 안 됐으면 무조건 로그인 페이지로 튕기기 */}
                        <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    </Route>
                ) : (
                    /* 세션이 있을 때 (로그인 후) */
                    <>
                        {/* 주소가 /game1run 이면 미니게임1 화면을 보여줘 */}
                        <Route path="/game1run" element={<Game1 />} /> 

                        {/* 주소가 /game2run 이면 미니게임2 화면을 보여줘 */}
                        <Route path="/game2run" element={<Game2 />} />

                        <Route element={<AppShell />}>
                            {/* 주소가 / 이면 홈화면을 보여줘 */}
                            <Route path="/" element={<Home />} />

                            {/* 주소가 /more 이면 더보기 화면을 보여줘 */}
                            <Route path="/more" element={<MorePage />} />

                            {/* 주소가 /more/profile 이면 프로필 화면을 보여줘 */}
                            <Route path="/more/profile" element={<Profile />} />
                            
                            {/* 주소가 /more/setting 이면 설정 메인 화면을 보여줘 */}
                            <Route path="/more/setting" element={<Setting />} />

                            {/* 주소가 /more/shop 이면 상점 화면을 보여줘 */}
                            <Route path="/more/shop" element={<Shop />} />

                            {/* ⚠️ 이미 로그인했는데 로그인창 가려하면 홈으로 보내기 */}
                            <Route path="/auth/*" element={<Navigate to="/" replace />} />

                            {/* ⚠️ 이상한 주소로 가도 홈으로 보내기 */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route> 
                    </>
                )}
            </Routes>   
        </BrowserRouter>
    );
}

export default App; // 이 부품을 밖에서 쓸 수 있게 내보낸다
