import React, { useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog";
import PreviewDialog from "../../../components/more/shop/PreviewDialog";
import ShopItemGrid from "../../../components/more/shop/ShopItemGrid";
import ItemDetailDialog from "../../../components/more/shop/ItemDetailDialog";
import PurchaseDialog from "../../../components/more/shop/PurchaseDialog";
import CategoryTabs from "../../../components/more/shop/CategoryTabs";

import { useStoreItems, usePurchaseItem } from "../../../hooks/queries/useStoreQueries";
import { useInventoryItems } from "../../../hooks/queries/useInventoryQueries";
import { useCoin } from "../../../hooks/queries/useCoinQueries";

const TABS = ["모두", "스티커", "이모티콘", "테마"];

const Shop = () => {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const [activeTab, setActiveTab] = useState("모두");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogStep, setDialogStep] = useState(null);

  // ── 상점 아이템 목록 조회 ──────────────────────────────
  const { data: itemsData, isLoading: isItemsLoading, isError: isItemsError } = useStoreItems();
  // ── 보관함 조회 ──────────────────────────────
  const { data: inventoryData, isLoading: isInventoryLoading, isError: isInventoryError } = useInventoryItems();
  // ── 코인 조회 ──────────────────────────────
  const { data: coinData, isLoading: isCoinLoading, isError: isCoinError } = useCoin();
  const myCoins = coinData?.coin ?? 0;

  const loading = isItemsLoading || isInventoryLoading || isCoinLoading;
  const isError = isItemsError || isInventoryError || isCoinError; // 셋 중 하나라도 실패하면 에러 처리

  const purchaseItem = usePurchaseItem();

  const items = useMemo(() => {
    const ownedItemIds = new Set(
      (inventoryData?.items || []).map((item) => item.item_id)
    );
    return (itemsData?.items || [])
      .filter((item) => item.item_type !== 'diary_theme' && item.item_type !== 'ticket')
      .map((item) => ({
        id: item.item_id,
        name: item.item_info,
        type: item.item_type,
        price: item.item_price,
        icon: item.item_image_url || 'home_icon_x3',
        preview: item.item_name,
        isSoldOut: !item.item_stackable && ownedItemIds.has(item.item_id),
      }));
  }, [itemsData, inventoryData]);

  const handlePurchase = () => {
    purchaseItem.mutate(
      { itemId: selectedItem.id },
      {
        onSuccess: () => setDialogStep("success"),
        onError: (error) => {
          if (error.message === "이미 보유한 아이템입니다.") {
            setDialogStep("soldout");
          } else {
            setDialogStep("fail");
          }
        },
      }
    );
  };

  const closeDialog = () => {
    setSelectedItem(null);
    setDialogStep(null);
  };

  const filteredItems = activeTab === "모두"
    ? items
    : items.filter(item => {
      if (activeTab === "스티커") return item.type === "sticker";
      if (activeTab === "이모티콘") return item.type === "emoji";
      if (activeTab === "테마") return item.type === "app_theme";
      return true;
    });

  return (
    <div
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'store_background_x3')})` }}
    >
      <Header isBackButton={true} backPath="/more" />

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

      <div className="absolute top-[14%] right-[2%] flex flex-col items-end z-10 gap-3">
        <button
          onClick={() => navigate('/more/inventory')}
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          <img src={getAssetUrl(currentTheme, 'icons', 'inventory_icon_x3')} className="w-[80px] h-auto block" alt="보관함" />
        </button>

        <div className="relative flex items-center justify-center h-[44px]">
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'have_money_box_x2')}
            className="h-full w-auto block pointer-events-none"
            alt="코인 배경"
          />
          <span className="absolute right-[25%] top-1/2 -translate-y-1/2 text-base font-bold text-black tracking-wider pointer-events-none">
            {myCoins}
          </span>

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

      <CategoryTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        marginTop="mt-[100px]"
      />

      {/* ── 로딩 / 에러 / 정상 3단 분기 ── */}
      {isError ? (
        <div className="w-full flex-1 flex items-center justify-center text-sm text-gray-500 font-bold">
          상점 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : loading ? (
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

      {dialogStep === 'detail' && (
        <ItemDetailDialog
          selectedItem={selectedItem}
          setDialogStep={setDialogStep}
          closeDialog={closeDialog}
          maxWidth="380px"
        />
      )}

      {dialogStep === 'confirm' && (
        <PurchaseDialog
          selectedItem={selectedItem}
          setDialogStep={setDialogStep}
          handlePurchase={handlePurchase}
          maxWidth="380px"
        />
      )}

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

      {dialogStep === 'fail' && (
          <ResultDialog 
              message={
                  <>
                      재화가 부족합니다<br />
                      <span className="text-xs font-medium block mt-1">
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