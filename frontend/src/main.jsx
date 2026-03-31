// 1. React 실행에 필요한 필수도구 import
import { StrictMode } from 'react'            // 개발 모드에서 잠재적인 문제를 체크해줌
import { createRoot } from 'react-dom/client' // React 요소를 실제 브라우저 화면에 그리는 기능 담당

// 2. 전체 앱에 적용될 전역 스타일(폰트, 배경 등)을 불러옴
import './index.css'

// 3. 프로젝트의 메인 네비게이션 역할을 하는 App 컴포넌트 불러옴
import App from './App.jsx'

/**
 * [앱 시작 지점]
 * index.html 파일에 있는 <div id="root"></div> 요소를 찾아 그 안에 우리 앱을 렌더링합니다.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 실제 프로젝트의 모든 화면은 <App /> 컴포넌트 내부에서 시작됨 */}
    <App />
  </StrictMode>,
)
