import { useLocation, Outlet } from 'react-router-dom'; // 경로 읽어오기
import NavigationBar from './NavigationBar'; // 네비게이션 바

// 기준 해상도 상수 — 모든 UI는 이 크기 안에서 작업 (9 : 20)
const BASE_WIDTH = 360;
const BASE_HEIGHT = 720; 

export default function AppShell({ children }) {
  // children: 부모 컴포넌트가 자식한테 내용 전달하는 방식
  // 예시: <AppShell><Home /></AppShell> 에서 Home이 children으로 들어옴

  const location = useLocation();

  // 네비게이션 바가 보이지 않는 페이지 경로를 여기에 작성
  const hideNavigationBarPaths = [
    '/login',
    '/auth-redirect',
    '/signup',
    '/game1run',
    '/more/setting',
    '/more/setting/account',
    '/more/setting/notification',
    '/more/profile',
    '/more/shop',
    '/more/inventory',
    '/more/daily',
    '/more/info'];

  // 현재 경로가 제외 리스트에 포함되어 있는지 확인
  const checkHideNavigationBarPaths = hideNavigationBarPaths.includes(location.pathname);

  return (
    // 브라우저 전체 화면을 채우는 바깥 래퍼 — 레터박스(검은 여백) 역할
    // flex justify-center items-center → 가운데 정렬
    // bg-black → 360×720 밖 영역 검은색 처리
    <div className="overflow-hidden flex justify-center items-center w-full h-full bg-black">

      {/* 360×640 고정 캔버스 — 모든 UI 요소는 여기 안에
          aspect-ratio: 9/20 → 360:720 모바일 비율 유지
          h-screen → 화면 높이에 맞춤
          relative → 자식 요소들이 absolute 쓸 때 기준점
          overflow-hidden → 캔버스 밖으로 넘치는 요소 잘라줌
          bg-white → 기본 배경색 (페이지별 배경 이미지로 덮어씌워짐)
      */}
      <div
        className="app-root relative overflow-hidden bg-white flex flex-col"
        style={{
          // Tailwind에 없는 속성들 — style로 직접 지정
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`, // 360:720 비율 유지
          height: '100dvh',                               // vh대신 dvh를 사용해 주소창 변화에 따라 높이를 동적으로 조절
          width: 'auto',                                 // 비율에 맞게 자동 계산
        }}
      >
        {/* 페이지별 내용 — 배경/콘텐츠 전부 여기로 들어옴 */}
        <main className={`flex-1 w-full overflow-y-auto overflow-x-hidden relative ${!checkHideNavigationBarPaths ? 'pb-20' : ''}`}>
          {/* children이 있으면 children을 보여주고, 없으면 라우터의 Outlet을 보여줍니다. */}
          {children || <Outlet />}
        </main>

        {/* 하단 네비게이션 바 — 조건부 렌더링 : 네비게이션바 표시X 페이지 리스트에 없을 때만 출력 */}
        <footer className="w-full shrink-0">
          { !checkHideNavigationBarPaths && <NavigationBar/> }
        </footer>

      </div>
    </div>
  );
}
