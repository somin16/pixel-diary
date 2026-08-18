import React, { useState, useMemo } from "react"; // 코인을 react-query로 옮기면서 useEffect(수동 fetch)는 더 이상 필요 없음
import { useNavigate } from 'react-router-dom'; // 보관함 화면으로 이동할 때 사용
import { useTheme } from '../../../stores/useThemeStore'; // 현재 앱 테마(배경/색상) 가져오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 테마별 이미지 경로를 만들어주는 헬퍼

// 화면에서 쓰는 하위 컴포넌트들
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog"; // 구매 성공/실패 알림 팝업
import PreviewDialog from "../../../components/more/shop/PreviewDialog"; // 테마 미리보기 팝업
import ShopItemGrid from "../../../components/more/shop/ShopItemGrid"; // 아이템 목록을 격자로 보여주는 컴포넌트
import ItemDetailDialog from "../../../components/more/shop/ItemDetailDialog"; // 아이템 클릭 시 상세 정보 팝업
import PurchaseDialog from "../../../components/more/shop/PurchaseDialog"; // 구매 확인 팝업
import CategoryTabs from "../../../components/more/shop/CategoryTabs"; // 상단 카테고리 탭

// react-query 훅: 상점 아이템 목록 조회 + 구매 요청
import { useStoreItems, usePurchaseItem } from "../../../hooks/queries/useStoreQueries";
// react-query 훅: 보관함(보유 아이템) 목록 조회 - 이미 산 아이템인지 확인하기 위해 필요
import { useInventoryItems } from "../../../hooks/queries/useInventoryQueries";
// react-query 훅: 코인 잔액 조회 - zustand 대신 서버 데이터를 직접 구독하는 방식으로 변경
import { useCoin } from "../../../hooks/queries/useCoinQueries";

// 카테고리 탭에 표시할 목록 (컴포넌트 밖에 선언 - 리렌더링마다 새로 안 만들도록)
const TABS = ["모두", "스티커", "이모티콘", "테마"];

const Shop = () => {
  // 뒤로가기/화면 이동에 쓸 navigate 함수
  const navigate = useNavigate();

  // 전역 테마 상태 중 현재 적용된 테마 이름만 구독
  const currentTheme = useTheme((state) => state.currentTheme);

  // 현재 선택된 카테고리 탭 ("모두"가 기본값)
  const [activeTab, setActiveTab] = useState("모두");

  // 유저가 클릭해서 선택한 아이템 정보 (없으면 null)
  const [selectedItem, setSelectedItem] = useState(null);

  // 현재 어떤 팝업을 띄울지 결정하는 상태 (detail/confirm/success/fail/soldout/preview 중 하나, 없으면 null)
  const [dialogStep, setDialogStep] = useState(null);

  // ── 상점 아이템 목록 조회 (react-query) ──────────────────────────────
  const { data: itemsData, isLoading: isItemsLoading } = useStoreItems();

  // ── 보관함(보유 아이템) 목록 조회 (react-query) ──────────────────────────────
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventoryItems();

  // ── 코인 잔액 조회 (react-query) ──────────────────────────────
  // coinData는 서버 응답 그대로 옴 (예: { coin: 1000 }) - 실제 필드명은 백엔드 응답 확인해서 맞춰야 함
  const { data: coinData, isLoading: isCoinLoading } = useCoin();
  const myCoins = coinData?.coin ?? 0; // 데이터가 아직 없으면 0으로 표시 (undefined 방지)

  // 세 가지 요청 중 하나라도 로딩 중이면 전체를 로딩 상태로 취급
  const loading = isItemsLoading || isInventoryLoading || isCoinLoading;

  // ── 구매 요청 훅 (react-query mutation) ──────────────────────────────
  const purchaseItem = usePurchaseItem();

  // ── 화면에서 쓸 형태로 아이템 데이터 가공 ──────────────────────────────
  // itemsData, inventoryData가 바뀔 때만 다시 계산 (useMemo)
  const items = useMemo(() => {
    // 보관함에 있는 아이템의 id들만 모아서 Set으로 만듦 (포함 여부 확인이 배열보다 빠름)
    const ownedItemIds = new Set(
      (inventoryData?.items || []).map((item) => item.item_id)
    );

    return (itemsData?.items || [])
      // diary_theme(자동 지급)와 ticket(별도 화면에서 처리)은 상점 목록에서 제외
      .filter((item) => item.item_type !== 'diary_theme' && item.item_type !== 'ticket')
      // 서버 응답 필드명을 화면에서 쓰기 편한 이름으로 매핑
      .map((item) => ({
        id: item.item_id,
        name: item.item_info,
        type: item.item_type,
        price: item.item_price,
        icon: item.item_image_url || 'home_icon_x3',
        preview: item.item_name,
        // item_stackable이 false(중복 구매 불가)인데 이미 보관함에 있으면 품절 처리
        isSoldOut: !item.item_stackable && ownedItemIds.has(item.item_id),
      }));
  }, [itemsData, inventoryData]);

  // ── 아이템 구매 처리 ──────────────────────────────
  const handlePurchase = () => {
    purchaseItem.mutate(
      { itemId: selectedItem.id }, // 구매할 아이템 id를 객체로 감싸서 전달
      {
        // 서버 요청 성공 시: coins/items/inventoryItems 캐시는 usePurchaseItem 내부에서
        // 이미 자동으로 무효화(재조회)되므로, 여기서는 성공 팝업만 띄우면 됨
        onSuccess: () => setDialogStep("success"),
        // 서버 요청 실패 시
        onError: (error) => {
          if (error.message === "이미 보유한 아이템입니다.") {
            setDialogStep("soldout"); // 이미 보유 중이면 전용 팝업
          } else {
            setDialogStep("fail"); // 그 외(주로 코인 부족)는 실패 팝업
          }
        },
      }
    );
  };

  // 팝업을 닫고 선택 상태도 초기화하는 함수
  const closeDialog = () => {
    setSelectedItem(null);
    setDialogStep(null);
  };

  // ── 카테고리 탭에 따른 아이템 필터링 ──────────────────────────────
  const filteredItems = activeTab === "모두"
    ? items
    : items.filter(item => {
      if (activeTab === "스티커") return item.type === "sticker";
      if (activeTab === "이모티콘") return item.type === "emoji";
      if (activeTab === "테마") return item.type === "app_theme";
      return true;
    });

  return (
    // 상점 전체 화면 컨테이너 (배경 이미지는 현재 테마에 맞춰 동적으로 결정)
    <div
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'store_background_x3')})` }}
    >
      {/* 뒤로가기 버튼만 있는 상단 헤더 */}
      <Header isBackButton={true} backPath="/more" />

      {/* 상점 타이틀 텍스트 영역 */}
      <div className="absolute top-[17%] left-[12%] z-20 pointer-events-none">
        <h1
          className="text-5xl font-extrabold m-0 text-left"
          style={{
            color: '#926653',
            WebkitTextStroke: '10px white',
            textShadow: '0 0 1px white',
            paintOrder: 'stroke fill',
            letterSpacing: '-4px'
          }}
        >
          상점
        </h1>
      </div>

      {/* 우측 상단: 보관함 이동 버튼 + 코인 표시 영역 */}
      <div className="absolute top-[14%] right-[2%] flex flex-col items-end z-10 gap-3">
        {/* 보관함 아이콘 클릭 시 /more/inventory로 이동 */}
        <button
          onClick={() => navigate('/more/inventory')}
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          <img src={getAssetUrl(currentTheme, 'icons', 'inventory_icon_x3')} className="w-[80px] h-auto block" alt="보관함" />
        </button>

        {/* 코인 잔액 박스 */}
        <div className="relative flex items-center justify-center h-[44px]">
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'have_money_box_x2')}
            className="h-full w-auto block pointer-events-none"
            alt="코인 배경"
          />
          {/* useCoin()에서 가져온 최신 코인 값을 표시 */}
          <span className="absolute right-[25%] top-1/2 -translate-y-1/2 text-base font-bold text-black tracking-wider pointer-events-none">
            {myCoins}
          </span>

          {/* 코인 충전 버튼 (아직 클릭 로직 없음) */}
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
        marginTop="mt-[100px]"
      />

      {/* 로딩 중이면 로딩 문구, 아니면 아이템 그리드를 보여줌 */}
      {loading ? (
        <div
          className="w-full flex-1 p-[3%] pb-0 overflow-y-auto bg-[length:100%_100%]"
          style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'store_box_x3')})` }}
        >
          <div className="flex justify-center mt-[50%] text-sm text-gray-500 font-bold animate-bounce">
            불러오는 중...
          </div>
        </div>
      ) : (
        <ShopItemGrid
          items={filteredItems}
          onItemClick={(item) => {
            setSelectedItem(item);
            setDialogStep("detail");
          }}
        />
      )}

      {/* ── 아래부터는 dialogStep 값에 따라 조건부로 뜨는 팝업들 ── */}

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

      {/* 구매 성공 알림 팝업 */}
      {dialogStep === 'success' && (
        <ResultDialog
          message="구매가 완료되었습니다"
          onConfirm={closeDialog}
          boxImageName="store_item_popup_box_x3"
          width="100%"
          maxWidth="380px"
          textMt="mt-[18%]"
          textSize="text-xs"
        />
      )}

      {/* 구매 실패 알림 팝업 (코인 부족) */}
      {dialogStep === 'fail' && (
          <ResultDialog 
              message={
                  <>
                      재화가 부족합니다<br />
                      <span className="text-xs font-medium block mt-1">
                          {/* 부족한 코인 = 아이템 가격 - 보유 코인. 음수 방지를 위해 0보다 작으면 0으로 표시 */}
                          부족한 재화 : {selectedItem && (selectedItem.price - myCoins) > 0 ? selectedItem.price - myCoins : 0} 코인
                      </span>
                  </>
              }
              onConfirm={closeDialog} 
              boxImageName="store_item_popup_box_x3"
              width="100%" 
              maxWidth="380px"
              textMt="mt-[15%]"
              textSize="text-xs"
          />
      )}

      {/* 테마 미리보기 팝업 */}
      {dialogStep === "preview" && (
        <PreviewDialog
          currentTheme={selectedItem.preview}
          onClose={() => setDialogStep("detail")}
          width="100%"
          maxWidth="480px"
        />
      )}

    </div>
  );
};

export default Shop;