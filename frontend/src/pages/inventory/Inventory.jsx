import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기 

// 컴포넌트 불러오기
import Header from "../../components/common/Header";
import CategoryTabs from "../../components/shop/CategoryTabs";  
import InventoryItemGrid from "../../components/inventory/InventoryItemGrid";

// 아이템 카테고리 목록
const TABS = ["모두", "스티커", "이모티콘", "테마"];

// 보관함 더미 데이터
const MOCK_INVENTORY = [
  { id: 1, name: "겨울테마", icon: "home_icon_x3", type: "테마" },
];

const Inventory = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 컴포넌트 상태 관리 (State) - 임시
  const [activeTab, setActiveTab] = useState("모두");
  const [myCoins, setMyCoins] = useState(100);
  const [selectedItemId, setSelectedItemId] = useState(null); // 선택된 아이템 ID 저장

  // 아이템 카테고리 필터링 
  // activeTab이 "모두"일 때는 전체 리스트를, 아니면 타입이 일치하는 것만 걸러내서 나타냄
  const filteredItems = activeTab === "모두" 
    ? MOCK_INVENTORY 
    : MOCK_INVENTORY.filter(item => item.type === activeTab);

  // 아이템 클릭 핸들러
  const handleItemClick = (item) => {
    // 이미 선택된 아이템을 다시 누르면 선택 해제, 아니면 새 아이템 선택
    setSelectedItemId(prev => prev === item.id ? null : item.id);
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
      <div className="absolute top-[16%] left-[12%] z-20 pointer-events-none">
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
      <div className="absolute top-[14%] right-[2%] flex flex-col items-end z-10 gap-3">
        {/* 상점 아이콘 */}
        <button 
          onClick={() => navigate('/more/shop')} 
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          {/* 부모 너비가 명확하지 않아서 px로 유지 */}
          <img src={getAssetUrl(currentTheme, 'icons', 'shop_icon_x3')} className="w-[80px] h-[75px] block" alt="상점" /> 
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