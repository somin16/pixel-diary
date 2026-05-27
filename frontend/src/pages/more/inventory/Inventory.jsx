import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // 토스트메세지 라이브러리
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기 

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import CategoryTabs from "../../../components/more/shop/CategoryTabs";
import InventoryItemGrid from "../../../components/more/inventory/InventoryItemGrid";

// zuStand 함수 불러오기
import { useGetCoinStore } from "../../../store/useCoinStore";

// 아이템 카테고리 목록
const TABS = ["모두", "스티커", "이모티콘", "테마"];

// 보관함 더미 데이터
const MOCK_INVENTORY = [
  { id: 1, name: "펭귄테마", icon: "https://zrrizmmqdgfjmnejaqkt.supabase.co/storage/v1/object/public/items/winter_theme_icon_x3.png", type: "테마", themeKey: "winter_light" },
  { id: 2, name: "병아리테마", icon: "https://zrrizmmqdgfjmnejaqkt.supabase.co/storage/v1/object/public/items/yellow_theme_icon_x3.png", type: "테마", themeKey: "yellow_light" },
];

const Inventory = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 현재 테마 가져오기
  const currentTheme = useTheme((state) => state.currentTheme);
  // 변경 테마 가져오기
  const setTheme = useTheme((state) => state.setTheme);

  // 컴포넌트 상태 관리 (State) - 임시
  const [activeTab, setActiveTab] = useState("모두");
  const { coin: myCoins } = useGetCoinStore(); // setMyCoins는여기서는 안쓰는것 같아서 일단 뺏습니다
  const [selectedItemId, setSelectedItemId] = useState(null); // 선택된 아이템 ID 저장

  // 아이템 카테고리 필터링 
  // activeTab이 "모두"일 때는 전체 리스트를, 아니면 타입이 일치하는 것만 걸러내서 나타냄
  const filteredItems = activeTab === "모두"
    ? MOCK_INVENTORY
    : MOCK_INVENTORY.filter(item => item.type === activeTab);

  // 보관함을 열었을 시 현재 적용된 테마 아이템에 초록색 테두리 씌우기(보관함의 초록색 선택 테두리 위치를 현재 테마에 맞게 업데이트)
  useEffect(() => {
    // MOCK_INVENTORY는 서버에서 받아온 내 아이템 목록이라고 가정
    const appliedThemeItem = MOCK_INVENTORY.find(
      // 아이템의 themeKey가 '현재 Zustand 스토어에 저장된 테마 값(currentTheme)'과 일치해야 함
      (item) => item.type === "테마" && item.themeKey === currentTheme
    );
    if (appliedThemeItem) {
      setSelectedItemId(appliedThemeItem.id);
    }
  }, [currentTheme]);

  // 아이템 클릭 핸들러 로직
  const handleItemClick = (item) => {
    if (item.type === "테마") {
      // 이미 적용된 테마인지 확인
      if (item.themeKey === currentTheme) {
        // 토스트 호출
        toast("이미 적용 중인 테마입니다", {
        });
        return;
      }

      setTheme(item.themeKey); // 클릭 즉시 전역 테마 변경
      setSelectedItemId(item.id); // 방금 클릭한 테마에 초록색 테두리 (null로 풀리지 않음)
    } else {
      // 이미 선택된 아이템을 다시 누르면 선택 해제, 아니면 새 아이템 선택
      setSelectedItemId(prev => prev === item.id ? null : item.id);
    }
  };

  return (
    // 보관함 전체 화면 컨테이너
    <div
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'inventory_background_x3')})` }}
    >
      {/* 뒤로가기 버튼만 있는 헤더 */}
      <Header isBackButton={true} backPath="/more" />

      {/* 보관함 타이틀 영역 */}
      <div className="absolute top-[17%] left-[12%] z-20 pointer-events-none">
        <h1
          className="text-[54px] font-extrabold m-0 text-left"
          style={{
            color: '#926653',
            WebkitTextStroke: '10px white', // 글자 외곽선
            textShadow: '0 0 1px white',
            paintOrder: 'stroke fill',
            letterSpacing: '-4px' // 자간 조정
          }}
        >
          보관함
        </h1>
      </div>

      {/* 상점 & 재화 영역 */}
      <div className="absolute top-[15%] right-[2%] flex flex-col items-end z-10 gap-3">
        {/* 상점 아이콘 */}
        <button
          onClick={() => navigate('/more/shop')}
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          {/* 부모 너비가 명확하지 않아서 px로 유지 */}
          <img src={getAssetUrl(currentTheme, 'icons', 'shop_icon_x3')} className="w-[80px] h-auto block" alt="상점" />
        </button>

        {/* 코인 박스 + 안쪽 플러스 버튼 */}
        <div className="relative flex items-center justify-center h-[44px]">
          {/* 코인 배경 이미지 */}
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'have_money_box_x2')}
            className="h-full w-auto block pointer-events-none"
            alt="코인 배경"
          />
          {/* 현재 보유 코인 텍스트 */}
          <span className="absolute right-[25%] top-1/2 -translate-y-1/2 text-[15px] font-bold text-black tracking-wider pointer-events-none">
            {myCoins}
          </span>

          {/* 재화 충전 버튼 */}
          <div className="absolute right-[1.6%] inset-y-0 flex items-center justify-center mt-[-1%]">
            <button className="bg-transparent border-none p-0 cursor-pointer outline-none">
              <img
                src={getAssetUrl(currentTheme, 'buttons', 'add_money_button_x2')}
                className="h-[59%] w-auto block"
                alt="충전하기"
              />
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <CategoryTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        marginTop="mt-[100px]" // 필요 시 상단 여백 조절 가능
        type="inventory"
      />

      {/* 보관함 아이템 그리드 분리 */}
      {/* 탭 조건에 맞게 필터링된 아이템 목록을 화면에 렌더링 */}
      <InventoryItemGrid
        items={filteredItems}
        selectedItemId={selectedItemId} // 선택된 ID 전달
        onItemClick={handleItemClick}   // 클릭 핸들러 전달
      />

    </div>
  );
};

export default Inventory;