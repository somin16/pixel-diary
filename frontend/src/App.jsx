// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell"; // AppShell 불러오기
import Home from "./pages/home/Home"; // 홈 화면 부품을 가져온다
import Game1 from "./game/game1/Game1"; // 게임1 화면
import Game2 from "./game/game2/Game2"; // 게임2 화면
import MorePage from "./pages/more/MorePage"; // 더보기 화면
import Profile from "./pages/profile/Profile"; // 더보기 - 프로필 화면
import Login from "./pages/auth/Login"; // 로그인 화면
import AuthRedirect from "./pages/auth/AuthRedirect"; // 소셜 로그인 성공 시 페이지
import Signup from "./pages/auth/SignUp"; // 회원가입 화면
import Setting from "./pages/setting/Setting"; // 더보기 - 설정 메인화면

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. AppShell이 필요 없는 완전 독립 페이지 (게임 등) */}
        {/* 주소가 /game1run 이면 미니게임1 화면을 보여줘 */}
        <Route path="/game1run" element={<Game1 />} /> 

        {/* 주소가 /game2run 이면 미니게임2 화면을 보여줘 */}
        <Route path="/game2run" element={<Game2 />} /> 

        {/* 2. AppShell 레이아웃을 공유하는 일반 페이지들 */}
        <Route element={<AppShell />}>
          {/* 주소가 / 이면 홈화면을 보여줘 */}
          <Route path="/" element={<Home />} />

          {/* 주소가 /more 이면 더보기 화면을 보여줘 */}
          <Route path="/more" element={<MorePage />} />

          {/* 주소가 /more/profile 이면 프로필 화면을 보여줘 */}
          <Route path="/more/profile" element={<Profile />} />

          {/* 주소가 /login 이면 로그인 화면을 보여줘 */}
          <Route path="/login" element={<Login />} />

          {/* 주소가 /auth-redirect 이면 로그인/ 회원가입 정보 화면을 보여줘 */}
          <Route path="/auth-redirect" element={<AuthRedirect />} />

          {/* 주소가 /signup 이면 회원가입 화면을 보여줘 */}
          <Route path="/signup" element={<Signup />} />

          {/* 주소가 /more/setting 이면 설정 메인 화면을 보여줘 */}
          <Route path="/more/setting" element={<Setting />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App; // 이 부품을 밖에서 쓸 수 있게 내보낸다
