import React from "react";
import { Link } from 'react-router-dom';
import { getAssetUrl } from "../../utils/assetHelper";

function Home() {
  // 현재 테마 상태
  const currentTheme = "winter_light"; 

  // 인라인 스타일로 배경 이미지를 동적으로 적용
  const containerStyle = {
    backgroundImage: `url(${getAssetUrl(currentTheme,'background', 'background_x3')})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    height: '100%',
    width: '100%',
    position: 'relative'
  };

  return (
    /* 1. index.css에서 정의한 .page-container 클래스를 사용합니다. */
    /* 2. 배경 이미지는 style 속성으로 넘겨줍니다. */
    <div className="page-container" style={containerStyle}>

      {/*콘텐츠 영역*/}
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🏠 Pixel Diary 임시<br/> 홈 화면</h1>

        <div style={{ 
          marginTop: '40px', 
          alignItems: 'center',
        }}>
          {/* 글씨 링크 */}
          <Link to="/game1run" style={{ fontSize: '14px', color: '#666' }}>
            미니게임1 테스트 이동<br/>
          </Link>
          <Link to="/game2run" style={{ fontSize: '14px', color: '#666' }}>
            미니게임2 테스트 이동<br/>
          </Link>
          <Link to="/more" style={{ fontSize: '14px', color: '#666' }}>
            더보기 페이지 테스트 이동<br/>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;