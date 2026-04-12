import { useNavigate, useLocation } from 'react-router-dom';
// useNavigate: 버튼 클릭 시 페이지 이동할 때 사용하는 훅
// useLocation: 현재 어떤 경로에 있는지 확인할 때 사용하는 훅
// 훅 (Hook): React에서 use로 시작하는 특별한 함수, 컴포넌트 안에서만 사용 가능

import { getAssetUrl } from '../../utils/AssetHelper';
// 에셋 이미지 경로 헬퍼 함수

// 네비게이션 탭 목록 상수 — 탭이 추가되거나 변경될 때 여기서만 수정하면 됨
const NAVIGATION_ITEMS = [
  {
    id: 'home',       // 탭 고유 식별자 — key prop에 사용
    label: '홈',      // 접근성(alt)용 텍스트
    path: '/',        // 이동할 경로 — App.jsx의 Route path와 반드시 일치해야 함
    iconActive: getAssetUrl('winter_light', 'icons', 'home_icon_x3'),     // 현재 선택된 탭 아이콘
    iconInactive: getAssetUrl('winter_light', 'icons', 'home_icon_x3'), // 선택되지 않은 탭 아이콘
  },
  {
    id: 'diary',
    label: '일기',
    path: '/diarylist',
    iconActive: getAssetUrl('winter_light', 'icons', 'gallery_icon_x3'),
    iconInactive: getAssetUrl('winter_light', 'icons', 'gallery_icon_x3'),
  },
  {
    id: 'game',
    label: '게임',
    path: '/game1run',
    iconActive: getAssetUrl('winter_light', 'icons', 'game_icon_x3'),
    iconInactive: getAssetUrl('winter_light', 'icons', 'game_icon_x3'),
  },
  {
    id: 'more',
    label: '더보기',
    path: '/more',
    iconActive: getAssetUrl('winter_light', 'icons', 'menu_icon_x3'),
    iconInactive: getAssetUrl('winter_light', 'icons', 'menu_icon_x3'),
  },
];

export default function NavigationBar() {

  const navigate = useNavigate();
  // navigate(경로): 해당 경로로 페이지 이동
  // 예시: navigate('/diary') → 일기 페이지로 이동

  const location = useLocation();
  // location.pathname: 현재 페이지 경로를 문자열로 반환
  // 예시: 홈화면이면 '/', 일기면 '/diary'

  // 현재 경로와 탭 경로가 같으면 true 반환 → 활성화 상태 판단
  // 예시: 현재 경로가 '/'이고 탭 경로도 '/'이면 true
  function checkIsActive(path) {
    return location.pathname === path;
  }

  // 탭 클릭 시 해당 경로로 이동
  function handleNavigationClick(path) {
    navigate(path);
  }


  return (
    /* ── 하단 네비게이션 바 전체 컨테이너 ──────────────────────────────────
       absolute bottom-0 → 화면 하단에 고정
       z-50 → 다른 UI 요소(카드, 리스트 등)보다 항상 위에 표시
       grid grid-cols-4 → 4개의 버튼을 1/4씩 정확하게 공간 배분
    ────────────────────────────────────────────────────────────────────── */

      <div 
        className="absolute bottom-0 left-0 w-full z-50 grid grid-cols-4 items-center"
        style={{
          /* 1. 네비게이션바 배경 이미지 불러오기 */
          backgroundImage: `url(${getAssetUrl('winter_light', 'boxes', 'nav_bar_box_x3')})`,
          
          /* 2. 비율 설정: 이미지 원본 크기(360x78) 비율을 유지하여 높이 자동 계산 
          고정값 대신 사용하여 이미지 찌그러짐 방지*/
          aspectRatio: '360 / 78', 
          
          /* 3. 배경 이미지 출력 설정: 컨테이너에 딱 맞춰서 꽉 채움 */
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >

        {/* 상수(NAVIGATION_ITEMS) 배열을 순회하며 버튼 생성 */}
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            className="flex flex-col items-center justify-center h-full outline-none border-none bg-transparent"
            onClick={() => handleNavigationClick(item.path)}
          >
            {/* 아이콘 이미지 렌더링 
              네비게이션바의 세로를 약 55%를 아이콘이 차지하도록 설정해 모니터 해상도에 따른 차이를 제거
              가로는 세로에 맞춰서 자동으로 비율조절
              이미지 원본의 픽셀 비율(도트)을 유지하기 위함 */}
            <img
              src={checkIsActive(item.path) ? item.iconActive : item.iconInactive}
              className="w-auto"
              style={{
                width: 'auto',
                height: '55%'
              }}
              alt={item.label}
            />
          </button>
        ))}
      </div>


  );
}