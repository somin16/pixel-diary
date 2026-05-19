import { useLocation, Outlet } from 'react-router-dom'; // 경로 읽어오기
import NavigationBar from './NavigationBar'; // 네비게이션 바
import { Toaster } from 'react-hot-toast'; // Toaster 불러오기
import { useEffect, useState } from 'react'; // JS로 크기 직접 계산하기 위해

export default function AppShell({ children }) {
    const location = useLocation();
    const path = location.pathname;

    // 네비게이션 바가 보이지 않는 페이지 경로를 여기에 작성
    const hideNavigationBarPaths =
        path.startsWith('/auth') ||
        (path.startsWith('/diary/') && path !== '/diary/list') || // /diary/list를 제외한 /diary/.. 은 안보이도록 설정
        path.startsWith('/game1run') ||
        (path.startsWith('/more/') && path !== '/more'); // /more은 보이고, /more/..부터는 안보이도록 조건 설정

    return (
        // 브라우저 전체 화면을 채우는 바깥 래퍼 — 레터박스(검은 여백) 역할
        <div 
            className="flex justify-center items-center w-full"
            style={{ height: `${window.innerHeight}px` }}
        >

            {/* 360×720 고정 캔버스 — 모든 UI 요소는 여기 안에
          JS로 계산한 width/height를 px로 직접 지정
          → Phaser가 canvas를 window.innerWidth/Height로 계산하는 방식과 동일
          → Capacitor WebView에서 dvh/aspectRatio CSS가 불안정한 문제 해결
      */}
            <div
                className="w-full h-full app-root relative overflow-hidden bg-white flex flex-col max-w-[500px]"
                style={{
                    // 예) 캔버스가 180px(절반)으로 줄면 --scale도 0.5가 돼서 폰트도 절반
                    '--scale': Math.min(window.innerWidth, 500) / 360,
                }}
            >
                {/* 페이지별 내용 — 배경/콘텐츠 전부 여기로 들어옴 */}
                <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
                    {/* children이 있으면 children을 보여주고, 없으면 라우터의 Outlet을 보여줍니다. */}
                    {children || <Outlet />}
                </main>

                {/* 하단 네비게이션 바 — 조건부 렌더링 : 네비게이션바 표시X 페이지 리스트에 없을 때만 출력 */}
                <footer className="w-full shrink-0">
                    {!hideNavigationBarPaths && <NavigationBar />}
                </footer>

                {/* Toaster 추가 */}
                <Toaster
                    position="bottom-center" // 모바일 앱 느낌이 나도록 하단 중앙에 배치
                    toastOptions={{
                        className: 'instant-toast',
                        duration: 2000, // 2초 동안 노출
                        style: {
                            marginBottom: hideNavigationBarPaths ? '20px' : '80px', // 네비바 유무에 따라 높이 조절 가능
                            animation: 'none !important',
                        },
                    }}
                />

            </div>
        </div>
    );
}