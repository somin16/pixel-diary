import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기 
import { authFetch } from '../../../utils/AuthHelper';

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog";
import PreviewDialog from "../../../components/more/shop/PreviewDialog";
import ShopItemGrid from "../../../components/more/shop/ShopItemGrid";
import ItemDetailDialog from "../../../components/more/shop/ItemDetailDialog";
import PurchaseDialog from "../../../components/more/shop/PurchaseDialog";
import CategoryTabs from "../../../components/more/shop/CategoryTabs"; 

// zuStand 함수 불러오기
import { useGetCoinStore } from "../../../store/useCoinStore";

// 아이템 카테고리 목록
const TABS = ["모두", "스티커", "이모티콘", "테마"];



const Shop = () => {
  // navigate('/경로') 처럼 사용하여 원하는 주소로 화면을 전환
  const navigate = useNavigate();

  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 컴포넌트 상태 관리 (State)
  const [activeTab, setActiveTab] = useState("모두");
  const { coin: myCoins, setMyCoins} = useGetCoinStore(); // 유저 코인관련 함수들 불러오기(변수명은 유지했습니다)
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogStep, setDialogStep] = useState(null); 
  const [items, setItems] = useState([]); // API에서 불러온 아이템 목록
  const [loading, setLoading] = useState(true); // 아이템 목록 로딩 상태

  // 아이템 구매 처리 로직
  const handlePurchase = () => {
    // 보유 코인이 아이템 가격보다 크거나 같은지 검사
    if (myCoins >= selectedItem.price) {
      setMyCoins(myCoins - selectedItem.price); // 코인 차감(useCoinStore.js에서 가져옵니다)
      setDialogStep("success"); // 성공 팝업으로 이동
    } else {
      setDialogStep("fail"); // 코인 부족 시 실패 팝업으로 이동
    }
  };

  // 모든 다이얼로그 창을 닫고 선택된 아이템 상태를 초기화하는 함수
  const closeDialog = () => {
    setSelectedItem(null);
    setDialogStep(null);
  };

  // 아이템 목록 불러오기
  useEffect(() => {
      const fetchItems = async () => {
          try {
              const result = await authFetch(
                  `${import.meta.env.VITE_BACKEND_URL}api/v1/items/`
              );
              const mappedItems = (result.items || [])
                  .filter(item => item.item_type !== 'diary_theme' && item.item_type !== 'ticket')  // diary_theme는 app_theme 구매 시 자동 지급되므로 상점에서 제외, 티켓은 상점에서 구매 불가능
                  .map(item => ({
                      id: item.item_id,
                      name: item.item_name,
                      type: item.item_type,
                      price: item.item_price,
                      icon: item.item_image_url || 'home_icon_x3',  // 이미지 URL이 없으면 기본 아이콘 사용
                      isSoldOut: false,  // 추후 인벤토리 조회 결과와 비교하여 설정 예정
                  }));
              setItems(mappedItems);
          } catch (error) {
              console.error('아이템 목록 조회 실패:', error);
          } finally {
              setLoading(false);
          }
      };
      fetchItems();
  }, []);

  // 아이템 카테고리 필터링 
  // activeTab이 "모두"일 때는 전체 리스트를, 아니면 타입이 일치하는 것만 걸러내서 나타냄
  const filteredItems = activeTab === "모두" 
    ? items
    : items.filter(item => {
        if (activeTab === "스티커") return item.type === "sticker";
        if (activeTab === "이모티콘") return item.type === "emoji";
        if (activeTab === "테마") return item.type === "app_theme";
        return true;
    });

  return (
    // 상점 전체 화면 컨테이너 (배경 이미지 적용)
    <div 
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'store_background_x3')})` }}
    >
      {/* 뒤로가기 버튼만 있는 헤더 */}
      <Header isBackButton={true} backPath="/more" />

      {/* 상점 타이틀 영역 */}
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
          상점
        </h1>
      </div>

      {/* 보관함 & 재화 영역 */}
      <div className="absolute top-[14%] right-[2%] flex flex-col items-end z-10 gap-3">
        {/* 보관함 아이콘 */}
        <button 
          onClick={() => navigate('/more/inventory')} 
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          {/* 부모 너비가 명확하지 않아서 px로 유지 */}
          <img src={getAssetUrl(currentTheme, 'icons', 'inventory_icon_x3')} className="w-[80px] h-auto block" alt="보관함" /> 
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
      />

      {/* 로딩 중에는 로딩 메시지를 표시 */}
      {/* 아이템 그리드 분리 - ShopItem에 filteredItems를 전달*/}
      {/* 탭 조건에 맞게 필터링된 아이템 목록을 화면에 렌더링 */}
      {loading ? (
          <div className="flex justify-center mt-[50%] text-sm text-gray-500 font-bold animate-bounce">
              불러오는 중...
          </div>
      ) : (
          <ShopItemGrid
              items={filteredItems}
              onItemClick={(item) => {
                  setSelectedItem(item);  // 클릭한 아이템 정보 저장
                  setDialogStep("detail");  // 상세 정보 팝업 띄우기
              }}
          />
      )}
    
      {/* 다이얼로그 영역(dialogStep 상태에 따라 다른 팝업을 렌더링) */}

      {/* 아이템 상세 정보 팝업 */}
      {dialogStep === 'detail' && (
        <ItemDetailDialog 
          selectedItem={selectedItem} 
          setDialogStep={setDialogStep} 
          closeDialog={closeDialog}
          maxWidth="380px"
        />
      )}

      {/* 구매 확인 팝업 */}
      {dialogStep === 'confirm' && (
        <PurchaseDialog 
          selectedItem={selectedItem} 
          setDialogStep={setDialogStep} 
          handlePurchase={handlePurchase}
          maxWidth="380px"
        />
      )}

      {/* 결과 알림 및 미리보기 창 */}

      {/* 구매 성공 알림 팝업 */}
      {dialogStep === 'success' && (
        <ResultDialog 
          message="구매가 완료되었습니다" 
          onConfirm={closeDialog} 
          boxImageName="store_item_popup_box_x3"
          width="100%" 
          maxWidth="380px"
          textMt="mt-[18%]"
          textSize="text-[14px]"
        />
      )}

      {/* 구매 실패 (재화 부족) 알림 팝업 */}
      {dialogStep === 'fail' && (
        <ResultDialog 
          message={
            <>
              재화가 부족합니다<br />
              {/* 부족한 재화 표시 */}
              <span className="text-[14px] font-medium block mt-1">
              부족한 재화 : {selectedItem.price - myCoins} 코인
              </span>
            </>
            
          }
          onConfirm={closeDialog} 
          boxImageName="store_item_popup_box_x3"
          width="100%" 
          maxWidth="380px"
          textMt="mt-[15%]"
          textSize="text-[15px]"
        />
      )}

      {/* 테마 미리보기 팝업 */}
      {dialogStep === "preview" && (
        <PreviewDialog
          previews={selectedItem?.previews}
          onClose={() => setDialogStep("detail")}
          width="100%" 
          maxWidth="480px"
        />
      )}

    </div>
  );
};

export default Shop;