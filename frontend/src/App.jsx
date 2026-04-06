// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home"; // 홈 화면 부품을 가져온다
import Game1 from "./game/game1/Game1"; // 게임1 화면
import Game2 from "./game/game2/Game2"; // 게임2 화면
import MorePage from "./pages/more/MorePage"; // 더보기 화면
import Profile from "./pages/profile/Profile"; // 더보기 - 프로필 화면

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 지금은 홈 화면 하나뿐, 나중에 아래에 Route 추가 */}
        {/* 주소가 / 이면 홈화면을 보여줘 */}
        <Route path="/" element={<Home />} />

        {/* 주소가 /game1run 이면 미니게임1 화면을 보여줘 */}
        <Route path="/game1run" element={<Game1 />} /> 

        {/* 주소가 /game2run 이면 미니게임2 화면을 보여줘 */}
        <Route path="/game2run" element={<Game2 />} /> 

        {/* 주소가 /more 이면 더보기 화면을 보여줘 */}
        <Route path="/more" element={<MorePage />} />

        {/* 주소가 /more/profile 이면 프로필 화면을 보여줘 */}
        <Route path="/more/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; // 이 부품을 밖에서 쓸 수 있게 내보낸다
