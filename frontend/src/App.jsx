// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./utils/SupabaseClient";
import { useAndroidBackButton } from "./hooks/useAndroidBackButtons"; // 모바일에서 뒤로가기 훅
import { useTheme } from './stores/useThemeStore';
import useMusicStore from './stores/useMusicStore';
import { queryKeys } from "./utils/queryKeys"; // 캐시 key 모음
import { storeApi } from "./api/storeApi";     
import { inventoryApi } from "./api/inventoryApi"; 
import { coinApi } from "./api/coinApi";         

// ----------------- 컴포넌트 불러오기 ----------------------------------
import AppShell from "./components/layout/AppShell"; // AppShell 불러오기
import Home from "./pages/home/Home"; // 홈 화면
// ----------------------- 게임 ---------------------------------------
import Game1 from "./games/game1/Game1"; // 게임1 화면
import Game2 from "./games/game2/Game2"; // 게임2 화면
// ----------------------- 계정 ---------------------------------------
import Login from "./pages/auth/Login"; // 로그인 화면
import AuthRedirect from "./pages/auth/AuthRedirect"; // 로그인, 회원가입 진행 시 화면
import SendResetPasswordLink from "./pages/auth/SendResetPasswordLink"; // 비밀번호 재설정 링크 이메일 발송 화면
import ResetPassword from "./pages/auth/ResetPassword"; // 비밀번호 재설정 화면
import Signup from "./pages/auth/Signup"; // 회원가입 화면
// ----------------------- 일기 ---------------------------------------
import ListDiary from "./pages/diary/ListDiary"; // 일기 목록 화면
import DiaryDetail from "./pages/diary/DiaryDetail"; // 일기 상세 보기 화면
import DiaryForm from "./pages/diary/DiaryForm"; // 일기 작성/수정 화면
// ---------------------- 더보기 --------------------------------------
import MorePage from "./pages/more/MorePage"; // 더보기 화면
import Profile from "./pages/more/profile/Profile"; // 더보기 - 프로필 화면
import Setting from "./pages/more/setting/Setting"; // 더보기 - 설정 메인화면
import Shop from "./pages/more/shop/Shop"; // 더보기 - 상점 화면
import Inventory from "./pages/more/inventory/Inventory"; // 더보기 - 보관함 화면
import Account from "./pages/more/account/Account"; // 더보기 - 계정 설정 화면
import Notification from "./pages/more/notification/Notification"; // 더보기 - 알림 설정 화면
import Contact from "./pages/more/contact/Contact"; // 더보기 - 문의사항 화면
// ---------------------- 더보기 (공지사항) -----------------------------
import AnnouncementList from "./pages/more/announcement/AnnouncementList"; // 더보기 - 공지사항 목록 화면
import AnnouncementDetail from "./pages/more/announcement/AnnouncementDetail"; // 더보기 - 공지사항 상세 조회 화면
import AnnouncementForm from "./pages/more/announcement/AnnouncementForm"; // 더보기 - 공지사항 작성/수정 화면
// ----------------------- 더보기 (유저관리(관리자만))---------------------
import AdminUserList from "./pages/more/user_management/AdminUserList"; // 더보기 - 유저 관리 목록 화면
import AddItemPage from "./pages/more/add_item/AddItemPage"; // 더보기 - 아이템 추가 화면
import ContactReply from "./pages/more/contact_reply/ContactReply"; // 더보기 - 문의사항 답변 화면
// ------------------------ 리액트 쿼리 ----------------------------
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30, // 캐시 완전 삭제까지 30분 (화면 벗어나도 캐시 유지 시간) -> 리액트 쿼리 v5부터 캐시타임이 gc타임으로 변경됨
      retry: (failureCount, error) => {
        if (error?.status === 401) return false; // 인증 에러는 재시도 안 함
        if (error?.status === 404) return false; // 없는 리소스도 재시도 무의미
        return failureCount < 2;
      },
      refetchOnWindowFocus: true, // 앱이 다시 포커스될 때 자동 재확인 (카카오톡도 이렇게 함) -> 백그라운드 갔다가 다시 열 때 해당 됨
      refetchOnReconnect: true,   // 네트워크 끊겼다 복구되면 자동 재확인 (모바일 필수)
    },
    mutations: {
      retry: 0, // mutation은 재시도 안 함 (중복 결제/중복 생성 방지)
    },
  },
});

// BrowserRouter 안에서 훅을 호출하는 내부 컴포넌트
function AppInner() {
  useAndroidBackButton(); // BrowserRouter 안에서 호출

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentTheme } = useTheme();

  async function prefetchCriticalData(queryClient) {
    // ‼️TODO: 각 담당자 API 완성되면 주석 해제, 로그인시 프리패치 되어야하는 목록 위치: src/App.jsx
    
    await Promise.all([
    //   queryClient.prefetchQuery({ queryKey: queryKeys.profile, queryFn: profileApi.getProfile }),
    queryClient.prefetchQuery({ queryKey: queryKeys.coins, queryFn: coinApi.getCoin }),
    queryClient.prefetchQuery({ queryKey: queryKeys.items, queryFn: storeApi.getItem }),
    queryClient.prefetchQuery({ queryKey: queryKeys.inventory, queryFn: inventoryApi.getItem }),
    //   queryClient.prefetchQuery({ queryKey: queryKeys.attendance, queryFn: attendanceApi.getAttendance }),
    ]);
  }

  useEffect(() => {
    // 현재 세션 가져오기 (앱 최초 실행 시)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
       if (session) prefetchCriticalData(queryClient); // 세션 확인되면 바로 병렬 prefetch
    });

    // 로그인 상태 변화 감시 (로그아웃/재로그인 포함)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
      queryClient.clear(); // 이전 계정 캐시 제거 (다른 유저 데이터 노출 방지)
    }

    if (_event === 'SIGNED_IN' && session) {
      prefetchCriticalData(queryClient); // 로그인마다 prefetch 재실행
    }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 첫 터치/클릭 시 배경음악 시작 (자동재생 정책 대응)
  useEffect(() => {
    if (!session) return; // 로그인 전에는 음악 재생 안 함

    const handleFirstInteraction = () => {
      useMusicStore.getState().playForTheme(currentTheme);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction); // Capacitor 대응

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [session]); // 세션 생기는 순간 이벤트 등록

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

          {/* 주소가 /password/reset 이면 비밀번호 재설정 화면을 보여줘 */}
          <Route path="/auth/password/reset" element={<ResetPassword />} />

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

            {/* 주소가 /password/reset 이면 비밀번호 재설정 화면을 보여줘*/}
            <Route path="/auth/password/reset" element={<ResetPassword />} />

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

            {/* 주소가 /more/notification 이면 알림 설정 화면을 보여줘 */}
            <Route path="/more/notification" element={<Notification />} />

            {/* 주소가 /more/contact 이면 문의사항 화면을 보여줘 */}
            <Route path="/more/contact" element={<Contact />} />

            {/* 주소가 /more/account 이면 계정 설정 화면을 보여줘 */}
            <Route path="/more/setting/account" element={<Account />} />

            {/* 주소가 /more/user-list 이면 유저 관리 화면을 보여줘 */}
            <Route path="/more/user-list" element={<AdminUserList />} />

            {/* 주소가 /more/add-item 이면 아이템 추가 화면을 보여줘 (관리자 전용) */}
            <Route path="/more/add-item" element={<AddItemPage />} />

            {/* 주소가 /more/contact-reply 이면 문의사항 답변 화면을 보여줘 (관리자 전용) */}
            <Route path="/more/contact-reply" element={<ContactReply />} />

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
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
    </QueryClientProvider>
  );
}