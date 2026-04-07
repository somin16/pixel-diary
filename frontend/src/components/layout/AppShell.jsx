import './AppShell.css';
import NavigationBar from './NavigationBar';

// 기준 해상도 상수 — 모든 UI는 이 크기 안에서 작업
const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;

export default function AppShell({ children }) {
  // children: 부모 컴포넌트가 자식한테 내용 전달하는 방식
  // 예시: <AppShell><Home /></AppShell> 에서 Home이 children으로 들어옴

  return (
    // 브라우저 전체 화면을 채우는 바깥 래퍼 — 레터박스(검은 여백) 역할
    // flex justify-center items-center → 가운데 정렬
    // w-screen h-screen → 브라우저 전체 너비/높이
    // overflow-hidden → 스크롤 방지
    // fixed → 모바일 바운스 방지
    // bg-black → 360×640 밖 영역 검은색 처리
    <div className="flex justify-center items-center w-screen h-screen overflow-hidden fixed bg-black">

      {/* 360×640 고정 캔버스 — 모든 UI 요소는 여기 안에 배치
          aspect-ratio: 1/2 → 360:720 모바일 비율 유지
          h-screen → 화면 높이에 맞춤
          relative → 자식 요소들이 absolute 쓸 때 기준점
          overflow-hidden → 캔버스 밖으로 넘치는 요소 잘라줌
          bg-white → 기본 배경색 (페이지별 배경 이미지로 덮어씌워짐)
      */}
      <div
        className="app-root relative overflow-hidden bg-white flex flex-col"
        style={{
          // Tailwind에 없는 속성들 — style로 직접 지정
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`, // 360:640 비율 유지
          height: '100vh',                               // 화면 높이에 맞춤
          width: 'auto',                                 // 비율에 맞게 자동 계산
        }}
      >
        {/* 페이지별 내용 — 배경/콘텐츠 전부 여기로 들어옴 */}
        {children}

        {/* 하단 네비게이션 바 — 모든 페이지에서 공통으로 표시 */}
        <NavigationBar />

      </div>
    </div>
  );
}