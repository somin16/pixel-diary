import React, { useState, useEffect, useMemo } from "react"; // useMemo: items 가공 결과를 매번 새로 계산 안 하고 재사용하기 위해 추가
import { useNavigate } from 'react-router-dom'; // 다른 화면(보관함)으로 이동할 때 사용
import { useTheme } from '../../../stores/useThemeStore'; // 현재 앱 테마(배경/색상) 가져오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 테마별 이미지 경로를 만들어주는 헬퍼
import { authFetch } from '../../../utils/AuthHelper'; // 프로필(코인) 조회는 아직 react-query로 안 옮겼으므로 그대로 사용

// 화면에서 쓰는 하위 컴포넌트들
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog"; // 구매 성공/실패 알림 팝업
import PreviewDialog from "../../../components/more/shop/PreviewDialog"; // 테마 미리보기 팝업
import ShopItemGrid from "../../../components/more/shop/ShopItemGrid"; // 아이템 목록을 격자로 보여주는 컴포넌트
import ItemDetailDialog from "../../../components/more/shop/ItemDetailDialog"; // 아이템 클릭 시 상세 정보 팝업
import PurchaseDialog from "../../../components/more/shop/PurchaseDialog"; // 구매 확인 팝업
import CategoryTabs from "../../../components/more/shop/CategoryTabs"; // 상단 카테고리 탭(스티커/이모티콘/테마)

// 코인(재화) 상태를 전역으로 관리하는 zustand 스토어
import { useGetCoinStore } from "../../../stores/useCoinStore";

// react-query 훅: 상점 아이템 목록 조회 + 구매 요청
import { useStoreItems, usePurchaseItem } from "../../../hooks/queries/useStoreQueries";
// react-query 훅: 보관함(보유 아이템) 목록 조회 - 어떤 아이템을 이미 샀는지 확인하기 위해 필요
import { useInventoryItems } from "../../../hooks/queries/useInventoryQueries";

// 카테고리 탭에 표시할 목록 (컴포넌트 밖에 선언 - 리렌더링마다 새로 안 만들도록)
const TABS = ["모두", "스티커", "이모티콘", "테마"];

const Shop = () => {
  // 뒤로가기/화면 이동에 쓸 navigate 함수
  const navigate = useNavigate();

  // 전역 테마 상태 중 현재 적용된 테마 이름만 구독
  const currentTheme = useTheme((state) => state.currentTheme);

  // 현재 선택된 카테고리 탭 ("모두"가 기본값)
  const [activeTab, setActiveTab] = useState("모두");

  // 코인 잔액(myCoins)과, 코인을 갱신하는 함수(setMyCoins)를 전역 스토어에서 꺼내옴
  const { coin: myCoins, setMyCoins } = useGetCoinStore();

  // 유저가 클릭해서 선택한 아이템 정보 (없으면 null)
  const [selectedItem, setSelectedItem] = useState(null);

  // 현재 어떤 팝업을 띄울지 결정하는 상태 (detail/confirm/success/fail/soldout/preview 중 하나, 없으면 null)
  const [dialogStep, setDialogStep] = useState(null);

  // ── 상점 아이템 목록 조회 (react-query) ──────────────────────────────
  // data: 서버에서 받아온 응답 데이터, isLoading: 첫 로딩 중인지 여부
  const { data: itemsData, isLoading: isItemsLoading } = useStoreItems();

  // ── 보관함(보유 아이템) 목록 조회 (react-query) ──────────────────────────────
  // 상점 화면인데 보관함 데이터가 왜 필요하냐면, "이미 산 아이템인지(품절 처리)"를 판단하려면 필요하기 때문
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventoryItems();

  // 두 요청 중 하나라도 로딩 중이면 전체를 로딩 상태로 취급
  const loading = isItemsLoading || isInventoryLoading;

  // ── 구매 요청 훅 (react-query mutation) ──────────────────────────────
  // purchaseItem.mutate(...)로 실제 구매를 실행하고, isPending 등의 상태도 여기서 꺼내 쓸 수 있음
  const purchaseItem = usePurchaseItem();

  // ── 코인(프로필) 조회 ──────────────────────────────
  // 프로필 API는 다른 담당자 영역이라 아직 react-query 훅으로 안 옮기고 기존 방식(useEffect + authFetch) 그대로 둠
  useEffect(() => {
    authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/`) // 서버에 프로필 정보 요청
      .then((result) => {
        if (result.coin !== undefined) setMyCoins(result.coin); // 응답에 coin 값이 있으면 전역 상태 갱신
      })
      .catch((error) => console.error('프로필 조회 실패:', error)); // 실패해도 화면이 죽지 않게 콘솔에만 로그
  }, []); // []: 컴포넌트가 처음 마운트될 때 딱 한 번만 실행

  // ── 화면에서 쓸 형태로 아이템 데이터 가공 ──────────────────────────────
  // itemsData(서버 원본 응답)와 inventoryData가 바뀔 때만 다시 계산 (useMemo)
  const items = useMemo(() => {
    // 보관함에 있는 아이템의 id들만 모아서 Set으로 만듦 (포함 여부 확인이 배열보다 빠름)
    const ownedItemIds = new Set(
      (inventoryData?.items || []).map((item) => item.item_id) // inventoryData가 아직 없으면(undefined) 빈 배열로 대체
    );

    return (itemsData?.items || []) // itemsData가 아직 없으면 빈 배열로 대체
      // diary_theme(자동 지급 아이템)와 ticket(다른 화면에서 처리)은 상점 목록에서 제외
      .filter((item) => item.item_type !== 'diary_theme' && item.item_type !== 'ticket')
      // 서버 응답 필드명을 화면에서 쓰기 편한 이름으로 매핑
      .map((item) => ({
        id: item.item_id,                              // 아이템 고유 id
        name: item.item_info,                           // 화면에 보여줄 이름
        type: item.item_type,                            // 카테고리 필터링에 쓰는 타입
        price: item.item_price,                          // 가격
        icon: item.item_image_url || 'home_icon_x3',     // 이미지 없으면 기본 아이콘 사용
        preview: item.item_name,                          // 테마 미리보기에 쓰는 값
        // item_stackable이 false(중복 구매 불가)인데 이미 보관함에 있으면 품절 처리
        isSoldOut: !item.item_stackable && ownedItemIds.has(item.item_id),
      }));
  }, [itemsData, inventoryData]); // 이 두 값이 바뀔 때만 재계산

  // ── 아이템 구매 처리 ──────────────────────────────
  const handlePurchase = () => {
    purchaseItem.mutate(
      { itemId: selectedItem.id }, // 구매할 아이템 id를 객체로 감싸서 전달
      {
        // 서버 요청이 성공했을 때 실행
        onSuccess: (result) => {
          if (result.current_coin !== null) {
            setMyCoins(result.current_coin); // 서버가 알려준 최신 코인 값으로 갱신
          }
          setDialogStep("success"); // 성공 팝업 띄우기
        },
        // 서버 요청이 실패했을 때 실행
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

  // 팝업을 닫고 선택 상태도 같이 초기화하는 함수 (다음에 다른 아이템 클릭할 때 꼬이지 않도록)
  const closeDialog = () => {
    setSelectedItem(null);
    setDialogStep(null);
  };

  // ── 카테고리 탭에 따른 아이템 필터링 ──────────────────────────────
  const filteredItems = activeTab === "모두"
    ? items // "모두" 탭이면 필터링 없이 전체 반환
    : items.filter(item => {
      if (activeTab === "스티커") return item.type === "sticker";
      if (activeTab === "이모티콘") return item.type === "emoji";
      if (activeTab === "테마") return item.type === "app_theme";
      return true; // 예외 케이스는 일단 포함
    });

  return (
    // 상점 전체 화면을 감싸는 컨테이너 (배경 이미지는 현재 테마에 맞춰 동적으로 결정)
    <div
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'store_background_x3')})` }}
    >
      {/* 뒤로가기 버튼만 있는 상단 헤더, 누르면 /more로 이동 */}
      <Header isBackButton={true} backPath="/more" />

      {/* 상점 타이틀 텍스트 영역 */}
      <div className="absolute top-[17%] left-[12%] z-20 pointer-events-none">
        <h1
          className="text-5xl font-extrabold m-0 text-left"
          style={{
            color: '#926653',
            WebkitTextStroke: '10px white', // 글자에 흰색 외곽선 효과
            textShadow: '0 0 1px white',
            paintOrder: 'stroke fill', // 외곽선을 글자보다 먼저 그려서 두껍게 보이도록
            letterSpacing: '-4px' // 글자 사이 간격 좁힘
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

        {/* 코인 잔액을 보여주는 박스 */}
        <div className="relative flex items-center justify-center h-[44px]">
          {/* 코인 박스 배경 이미지 */}
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'have_money_box_x2')}
            className="h-full w-auto block pointer-events-none"
            alt="코인 배경"
          />
          {/* 현재 보유 코인 숫자 (myCoins는 전역 상태에서 가져온 값) */}
          <span className="absolute right-[25%] top-1/2 -translate-y-1/2 text-base font-bold text-black tracking-wider pointer-events-none">
            {myCoins}
          </span>

          {/* 코인 충전 버튼 (아직 클릭 로직 없음 - 추후 구현 예정으로 보임) */}
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

      {/* 카테고리 탭 (모두/스티커/이모티콘/테마) */}
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
          items={filteredItems} // 카테고리 필터링이 적용된 목록만 전달
          onItemClick={(item) => {
            setSelectedItem(item);   // 클릭한 아이템을 선택 상태로 저장
            setDialogStep("detail"); // 상세 정보 팝업을 띄우도록 설정
          }}
        />
      )}

      {/* ── 아래부터는 dialogStep 값에 따라 조건부로 뜨는 팝업들 ── */}

      {/* 아이템 상세 정보 팝업 (dialogStep이 "detail"일 때만 렌더링) */}
      {dialogStep === 'detail' && (
        <ItemDetailDialog
          selectedItem={selectedItem}
          setDialogStep={setDialogStep}
          closeDialog={closeDialog}
          maxWidth="380px"
        />
      )}

      {/* 구매 확인 팝업 - "정말 구매하시겠습니까?" 같은 확인창 */}
      {dialogStep === 'confirm' && (
        <PurchaseDialog
          selectedItem={selectedItem}
          setDialogStep={setDialogStep}
          handlePurchase={handlePurchase} // 확인 버튼 누르면 실제 구매 실행
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

      {/* 구매 실패 알림 팝업 (코인 부족일 때) */}
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

      {/* 테마 미리보기 팝업 - 아이템 타입이 테마일 때 미리보기 버튼 누르면 뜸 */}
      {dialogStep === "preview" && (
        <PreviewDialog
          currentTheme={selectedItem.preview}
          onClose={() => setDialogStep("detail")} // 미리보기 닫으면 상세 팝업으로 되돌아감
          width="100%"
          maxWidth="480px"
        />
      )}

    </div>
  );
};

export default Shop;