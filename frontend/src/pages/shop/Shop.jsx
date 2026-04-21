import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import Header from "../../components/common/Header";
import ImageButton from "../../components/common/ImageButton";
import DialogBox from "../../components/common/dialog/DialogBox";
import ResultDialog from "../../components/common/dialog/ResultDialog";

const TABS = ["모두", "스티커", "이모티콘", "테마"];

const MOCK_ITEMS = [
    {
    id: 1,
    name: "겨울 테마",
    price: 30,
    icon: "home_icon_x3",
    type: "테마",
    isSoldOut: false,
    // 미리보기 이미지가 들어가는 위치
    previews: [
      "winter_light_preview_1",
      "winter_light_preview_2",
      "winter_light_preview_3",
      "winter_light_preview_4",
      "winter_light_preview_5"
    ]
  },
  { id: 2, type: "티켓", name: "티켓", price: 10000, icon: "ticket_icon", previews: [], isSoldOut: false, owned: 0 },
  { id: 3, type: "티켓", name: "저렴한 티켓", price: 3, icon: "ticket_icon", previews: [], isSoldOut: false },
  { id: 4, type: "티켓", name: "품절 티켓", price: 0, icon: "ticket_icon", previews: [], isSoldOut: true },
];

const Shop = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  const [activeTab, setActiveTab] = useState("모두");
  const [myCoins, setMyCoins] = useState(100);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogStep, setDialogStep] = useState(null); // 'detail' | 'confirm' | 'success' | 'fail' | 'preview'

  // 구매 처리 함수
  const handlePurchase = () => {
    if (myCoins >= selectedItem.price) {
      setMyCoins(prev => prev - selectedItem.price);
      setDialogStep("success");
    } else {
      setDialogStep("fail");
    }
  };

  const closeDialog = () => {
    setSelectedItem(null);
    setDialogStep(null);
  };

  return (
    <div 
      className="relative w-full h-full pt-[60px] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'store_background_x3')})` }}
    >
      {/* 뒤로가기 버튼만 있는 헤더 */}
      <Header isBackButton={true} />

      {/* 상점 타이틀 영역 */}
   <div className="absolute top-[155px] left-[55px] z-20 pointer-events-none">
    <h1 
    className="text-[54px] font-extrabold m-0 text-left"
    style={{ 
      color: '#926653', // 💡 안쪽 갈색
      WebkitTextStroke: '10px white', // 💡 테두리 흰색 (Chrome, Safari용)
      textShadow: '0 0 1px white', // 💡 테두리를 보강하기 위한 그림자 효과
      paintOrder: 'stroke fill', // 💡 테두리가 글자를 갉아먹지 않게 설정
      letterSpacing: '-4px'
    }}
    >
    상점
    </h1>
   </div>

    {/* 인벤토리 & 재화 영역 */}
    <div className="absolute top-[130px] right-[10px] flex flex-col items-end z-10 gap-3">
  
    {/* 보관함 아이콘 */}
    <button 
      onClick={() => navigate('/more/inventory')} 
      className="bg-transparent border-none p-0 cursor-pointer outline-none"
    >
      <img src={getAssetUrl(currentTheme, 'icons', 'inventory_icon_x3')} className="w-[80px] h-auto block" alt="보관함" />
     </button>
  
    {/* 코인 박스 + 안쪽 플러스 버튼 */}
    <div className="relative flex items-center justify-center h-[44px]"> 
  
    <img 
      src={getAssetUrl(currentTheme, 'boxes', 'have_money_box_x2')} 
      className="h-full w-auto block pointer-events-none" 
      alt="코인 배경" 
    />
    
    {/* 코인 개수 텍스트 */}
    <span className="absolute right-[30px] top-1/2 -translate-y-1/2 text-[15px] font-bold text-black tracking-wider pointer-events-none">
      {myCoins}
    </span>

    <div className="absolute right-[2px] inset-y-0 flex items-center justify-center">
    <button 
      className="bg-transparent border-none p-0 cursor-pointer outline-none"
    >
      <img 
        src={getAssetUrl(currentTheme, 'buttons', 'add_money_button_x2')} 
        className="h-[26px] w-auto block" 
        alt="충전하기" 
      />
     </button>
     </div>
     </div>

     </div>

      {/* 카테고리 탭 */}
      <div className="w-full flex px-[10px] mt-[100px] gap-2 z-10">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 h-[38px] bg-transparent border-none flex items-center justify-center cursor-pointer"
          >
            <img 
              src={getAssetUrl(currentTheme, 'boxes', activeTab === tab ? 'store_filter_box_on_x2' : 'store_filter_box_off_x2')} 
              className="absolute inset-0 w-full h-full object-fill" 
              alt="" 
            />
            <span className={`relative z-10 text-[13px] font-bold ${activeTab === tab ? 'text-black' : 'text-[#666666]'}`}>
              {tab}
            </span>
          </button>
        ))}
      </div>

    {/* 아이템 그리드 영역 */}
    <div 
      className="w-full flex-1 p-[15px] pb-0 overflow-y-auto bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'store_box_x3')})` }}
    > 
      <div className="grid grid-cols-4 gap-3 pb-[20px]"> {/* 스크롤 시 맨 아래가 안 잘리게 그리드 자체에 pb 추가 */}
    {MOCK_ITEMS.map((item, idx) => (
      <div 
        key={idx}
        onClick={() => {
        if (!item.isSoldOut) {
          setSelectedItem(item);
          setDialogStep("detail");
      }
    }}
    className="relative w-full cursor-pointer"
  >
    <img 
      src={getAssetUrl(currentTheme, 'boxes', 'store_item_box_x2')} 
      className="w-full h-auto block pointer-events-none" 
      alt="아이템 배경" 
    />

    {/* 아이템 */}
    <img 
      src={getAssetUrl(currentTheme, 'icons', item.icon)} 
      className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[55%] h-auto z-10 pointer-events-none" 
      alt={item.name} 
    />
    
    {/* 코인 + 가격 */}
    <div className="absolute bottom-[8%] w-full flex justify-center items-center gap-[3px] z-10 pointer-events-none">
      <img src={getAssetUrl(currentTheme, 'icons', 'coin_icon_x3')} className="w-[14px] h-auto" alt="코인" />
      <span className="text-[14px] text-black leading-none">{item.price}</span>
    </div>

    {/* 품절 오버레이 */}
    {item.isSoldOut && (
      <img 
        src={getAssetUrl(currentTheme, 'boxes', 'store_item_box_select_x2')} 
        className="absolute inset-0 w-full h-full z-20 pointer-events-none" 
        alt="품절" 
      />
    )}
    </div>
    ))}
    </div>
    </div>

    </div>
  );
};

export default Shop;