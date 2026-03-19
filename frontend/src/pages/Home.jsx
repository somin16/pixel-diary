import React from "react";
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🏠 Pixel Diary 홈 화면</h1>
      <p>여기에 일기 목록이 나올 예정입니다.</p>

      <div style={{ marginTop: '10px' }}>
        {/* 글씨 링크 */}
        <Link to="/game1run" style={{ fontSize: '14px', color: '#666' }}>
          게임 이동 테스트
        </Link>
      </div>
    </div>
  );
}

export default Home;