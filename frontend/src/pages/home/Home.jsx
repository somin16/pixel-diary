import React from "react";
import { Link } from 'react-router-dom';
import { getAssetUrl } from "../../utils/assetHelper";

function Home() {
  // 현재 테마 상태
  const currentTheme = "winter_light"; 

  // 인라인 스타일로 배경 이미지를 동적으로 적용
  const containerStyle = {
    backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds', 'background_x3')})`,
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

    </div>
  );
}

export default Home;