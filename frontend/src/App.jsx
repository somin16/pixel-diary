// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import { supabase } from "./utils/SupabaseClient";
import { useAndroidBackButton } from "./hooks/useAndroidBackButtons"; // 모바일에서 뒤로가기 훅

// ----------------- 컴포넌트 불러오기 ----------------------------------
import AppShell from "./components/layout/AppShell"; // AppShell 불러오기
import Home from "./pages/home/Home"; // 홈 화면
// ----------------------- 게임 ---------------------------------------
import Game1 from "./game/game1/Game1"; // 게임1 화면
import Game2 from "./game/game2/Game2"; // 게임2 화면
// ----------------------- 계정 ---------------------------------------
import Login from "./pages/auth/Login"; // 로그인 화면
import AuthRedirect from "./pages/auth/AuthRedirect"; // 로그인, 회원가입 진행 시 화면
import SendResetPasswordLink from "./pages/auth/SendResetPasswordLink"; // 비밀번호 재설정 링크 이메일 발송 화면
import Signup from "./pages/auth/SignUp"; // 회원가입 화면
// ----------------------- 일기 ---------------------------------------
import ListDiary from "./pages/diary/ListDiary"; // 일기 목록 화면
import DiaryDetail from "./pages/diary/diaryDetail"; // 일기 상세 보기 화면
import DiaryForm from "./pages/diary/DiaryForm"; // 일기 작성/수정 화면
// ---------------------- 더보기 --------------------------------------
import MorePage from "./pages/more/MorePage"; // 더보기 화면
import Profile from "./pages/more/profile/Profile"; // 더보기 - 프로필 화면
import Setting from "./pages/more/setting/Setting"; // 더보기 - 설정 메인화면
import Shop from "./pages/more/shop/Shop"; // 더보기 - 상점 화면
import Inventory from "./pages/more/inventory/Inventory"; // 더보기 - 보관함 화면
// ---------------------- 더보기 (공지사항) -----------------------------
import AnnouncementList from "./pages/more/announcement/AnnouncementList"; // 더보기 - 공지사항 목록 화면
import AnnouncementDetail from "./pages/more/announcement/AnnouncementDetail"; // 더보기 - 공지사항 상세 조회 화면
import AnnouncementForm from "./pages/more/announcement/AnnouncementForm"; // 더보기 - 공지사항 작성/수정 화면

// BrowserRouter 안에서 훅을 호출하는 내부 컴포넌트
function AppInner() {
    useAndroidBackButton(); // BrowserRouter 안에서 호출

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

                        {/* 주소가 /diary/list 이면 일기 목록 조회 화면을 보여줘 */}
                        <Route path="/diary/list" element={<ListDiary />} />

                        {/* 주소가 /diary/:date 이면 일기 상세 조회 화면을 보여줘 */}
                        <Route path="/diary/:date" element={<DiaryDetail />} />

                        {/* 주소가 /diary/write/:date 이면 일기 작성 화면을 보여줘 */}
                        <Route path="/diary/write/:date" element={<DiaryForm />} />
                        {/* 주소가 /diary/edit/:date 이면 일기 수정 화면을 보여줘 */}
                        <Route path="/diary/edit/:date" element={<DiaryForm />} />

                        {/* 주소가 /more 이면 더보기 화면을 보여줘 */}
                        <Route path="/more" element={<MorePage />} />

                        {/* 주소가 /more/profile 이면 프로필 화면을 보여줘 */}
                        <Route path="/more/profile" element={<Profile />} />

                        {/* 주소가 /more/setting 이면 설정 메인 화면을 보여줘 */}
                        <Route path="/more/setting" element={<Setting />} />

                        {/* 주소가 /more/shop 이면 상점 화면을 보여줘 */}
                        <Route path="/more/shop" element={<Shop />} />

                        {/* 주소가 /more/inventory 이면 보관함 화면을 보여줘 */}
                        <Route path="/more/inventory" element={<Inventory />} />

                        {/* 주소가 /more/announcement/list이면 공지사항 목록 화면을 보여줘 */}
                        <Route path="/more/announcement/list" element={<AnnouncementList />} />

                        {/* 주소가 /more/announcement/detail이면 공지사항 상세 조회 화면을 보여줘 */}
                        <Route path="/more/announcement/detail/:announcement_id" element={<AnnouncementDetail />} />

                        {/* 주소가 /more/announcement/write이면 공지사항 작성 화면을 보여줘 */}
                        <Route path="/more/announcement/write" element={<AnnouncementForm />} />
                        {/* 주소가 /more/announcement/edit/:announcement_id이면 공지사항 수정 화면을 보여줘 */}
                        <Route path="/more/announcement/edit/:announcement_id" element={<AnnouncementForm />} />

                        {/* ⚠️ 이미 로그인했는데 로그인창 가려하면 홈으로 보내기 */}
                        <Route path="/auth/*" element={<Navigate to="/" replace />} />

                        {/* ⚠️ 이상한 주소로 가도 홈으로 보내기 */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </>
            )}
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppInner />
        </BrowserRouter>
    );
}