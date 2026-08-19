import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

import Header from "../../../components/common/Header";
import CategoryTabs from "../../../components/more/shop/CategoryTabs";
import InventoryItemGrid from "../../../components/more/inventory/InventoryItemGrid";

import { useStoreItems } from "../../../hooks/queries/useStoreQueries";
import { useInventoryItems } from "../../../hooks/queries/useInventoryQueries";
import { useCoin } from "../../../hooks/queries/useCoinQueries";

const TABS = ["모두", "스티커", "이모티콘", "테마"];

const TYPE_ORDER = {
  'app_theme': 0,
  'emoji': 1,
  'sticker': 2,
  'ticket': 3,
};

const Inventory = () => {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);
  const setTheme = useTheme((state) => state.setTheme);

  const [activeTab, setActiveTab] = useState("모두");
  const [selectedItemId, setSelectedItemId] = useState(null);

  const { data: inventoryData, isLoading: isInventoryLoading, isError: isInventoryError } = useInventoryItems();
  const { data: itemsData, isLoading: isItemsLoading, isError: isItemsError } = useStoreItems();
  const { data: coinData, isLoading: isCoinLoading, isError: isCoinError } = useCoin();
  const myCoins = coinData?.coin ?? 0;

  const loading = isInventoryLoading || isItemsLoading || isCoinLoading;
  const isError = isInventoryError || isItemsError || isCoinError;

  const items = useMemo(() => {
    const itemMap = {};
    (itemsData?.items || []).forEach((item) => {
      itemMap[item.item_id] = item;
    });

    return (inventoryData?.items || [])
      .filter((inv) => {
        const item = itemMap[inv.item_id];
        return item && item.item_type !== 'diary_theme';
      })
      .map((inv) => {
        const item = itemMap[inv.item_id];
        return {
          id: item.item_id,
          name: item.item_type === 'ticket'
            ? `${item.item_info} - ${inv.item_count}`
            : item.item_info,
          type: item.item_type,
          icon: item.item_image_url || 'home_icon_x3',
          item_count: inv.item_count,
          themeKey: item.item_type === 'app_theme' ? item.item_name.replace('_theme', '') : null,
        };
      })
      .sort((a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99));
  }, [inventoryData, itemsData]);

  const filteredItems = activeTab === "모두"
    ? items
    : items.filter(item => {
      if (activeTab === "스티커") return item.type === "sticker";
      if (activeTab === "이모티콘") return item.type === "emoji";
      if (activeTab === "테마") return item.type === "app_theme";
      return true;
    });

  useEffect(() => {
    const appliedThemeItem = items.find(
      (item) => item.type === "app_theme" && item.themeKey === currentTheme
    );
    if (appliedThemeItem) {
      setSelectedItemId(appliedThemeItem.id);
    }
  }, [currentTheme, items]);

  const handleItemClick = (item) => {
    if (item.type === "app_theme") {
      if (item.themeKey === currentTheme) {
        toast("이미 적용 중인 테마입니다");
        return;
      }
      setTheme(item.themeKey);
      toast("테마를 변경했습니다")
      setSelectedItemId(item.id);
    }
  };

  return (
    <div
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'inventory_background_x3')})` }}
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
          보관함
        </h1>
      </div>

      <div className="absolute top-[15%] right-[2%] flex flex-col items-end z-10 gap-3">
        <button
          onClick={() => navigate('/more/shop')}
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          <img src={getAssetUrl(currentTheme, 'icons', 'shop_icon_x3')} className="w-[80px] h-auto block" alt="상점" />
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
        type="inventory"
      />

      {isError ? (
        <div className="w-full flex-1 flex items-center justify-center text-sm text-gray-500 font-bold">
          보관함 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : loading ? (
        <div
          className="w-full flex-1 p-[3%] pb-0 overflow-y-auto bg-[length:100%_100%]"
          style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'inventory_box_x3')})` }}
        >
          <div className="flex justify-center mt-[50%] text-sm text-gray-500 font-bold animate-bounce">
            불러오는 중...
          </div>
        </div>
      ) : (
        <InventoryItemGrid
          items={filteredItems}
          selectedItemId={selectedItemId}
          onItemClick={handleItemClick}
        />
      )}

    </div>
  );
};

export default Inventory;