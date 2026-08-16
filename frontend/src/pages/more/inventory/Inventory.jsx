import React, { useState, useEffect, useMemo } from "react"; // useMemo: items 가공 결과 재사용
import { useNavigate } from 'react-router-dom'; // 상점 화면으로 이동할 때 사용
import toast from 'react-hot-toast'; // 화면 하단에 짧게 뜨는 알림 메시지 라이브러리
import { useTheme } from '../../../stores/useThemeStore'; // 테마 조회/변경 둘 다 여기서 가져옴
import { getAssetUrl } from "../../../utils/AssetHelper"; // 테마별 이미지 경로 생성 헬퍼

// 화면 구성 컴포넌트
import Header from "../../../components/common/Header";
import CategoryTabs from "../../../components/more/shop/CategoryTabs"; // 상점과 동일한 탭 컴포넌트 재사용
import InventoryItemGrid from "../../../components/more/inventory/InventoryItemGrid"; // 보관함 전용 그리드

// 코인 전역 상태
import { useGetCoinStore } from "../../../stores/useCoinStore";

// react-query 훅: 보관함 목록 + 상점 아이템 목록(상세 정보 매핑용)
import { useStoreItems } from "../../../hooks/queries/useStoreQueries";
import { useInventoryItems } from "../../../hooks/queries/useInventoryQueries";

// 카테고리 탭 목록
const TABS = ["모두", "스티커", "이모티콘", "테마"];

// 아이템 타입별로 정렬할 때 쓰는 우선순위 (숫자가 작을수록 먼저 표시)
// 컴포넌트 밖에 선언 - 매 렌더링마다 새로 안 만들도록
const TYPE_ORDER = {
  'app_theme': 0,
  'emoji': 1,
  'sticker': 2,
  'ticket': 3,
};

const Inventory = () => {
  const navigate = useNavigate(); // 상점으로 이동할 때 사용

  const currentTheme = useTheme((state) => state.currentTheme); // 현재 적용된 테마
  const setTheme = useTheme((state) => state.setTheme); // 테마를 바꾸는 함수 (아이템 클릭 시 사용)

  // 현재 선택된 카테고리 탭
  const [activeTab, setActiveTab] = useState("모두");

  // 코인 잔액만 필요 (여기서는 갱신은 안 하므로 setMyCoins는 안 가져옴)
  const { coin: myCoins } = useGetCoinStore();

  // 현재 화면에서 초록 테두리로 표시할 아이템의 id (주로 "적용 중인 테마" 표시용)
  const [selectedItemId, setSelectedItemId] = useState(null);

  // ── 보관함(보유 아이템) 목록 조회 ──────────────────────────────
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventoryItems();

  // ── 상점 아이템 목록 조회 ──────────────────────────────
  // 보관함 응답에는 item_id, item_count 정도만 있고, 이름/이미지 같은 상세 정보는 상점 목록에서 가져와야 함
  const { data: itemsData, isLoading: isItemsLoading } = useStoreItems();

  // 두 데이터 중 하나라도 아직 로딩 중이면 전체 로딩 처리
  const loading = isInventoryLoading || isItemsLoading;

  // ── 보관함 데이터 + 아이템 상세 정보를 합쳐서 화면에서 쓸 형태로 가공 ──────────────────────────────
  const items = useMemo(() => {
    // item_id를 key로 하는 맵을 만들어서 조회를 빠르게 함 (배열 find보다 빠름)
    const itemMap = {};
    (itemsData?.items || []).forEach((item) => {
      itemMap[item.item_id] = item;
    });

    return (inventoryData?.items || [])
      .filter((inv) => {
        const item = itemMap[inv.item_id];
        // diary_theme는 app_theme 구매 시 자동으로 같이 지급되는 아이템이라 보관함 화면에서는 숨김
        return item && item.item_type !== 'diary_theme';
      })
      .map((inv) => {
        const item = itemMap[inv.item_id]; // 이 보관함 항목에 대응하는 상점 아이템 정보
        return {
          id: item.item_id,
          // 티켓 타입은 개수도 같이 보여줌 (예: "일기 이모지 티켓 - 3"), 그 외는 이름만
          name: item.item_type === 'ticket'
            ? `${item.item_info} - ${inv.item_count}`
            : item.item_info,
          type: item.item_type,
          icon: item.item_image_url || 'home_icon_x3',
          item_count: inv.item_count, // 보유 개수 (티켓처럼 여러 개 살 수 있는 아이템용)
          // app_theme 타입이면 item_name(예: winter_light_theme)에서 '_theme'를 떼어내
          // 실제 테마 전환에 쓰는 키(winter_light)를 만듦. 그 외 타입은 필요 없으므로 null.
          themeKey: item.item_type === 'app_theme' ? item.item_name.replace('_theme', '') : null,
        };
      })
      // 타입별 정렬: app_theme → emoji → sticker → ticket 순서로 보여주기 위함
      .sort((a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99));
  }, [inventoryData, itemsData]); // 두 데이터 중 하나라도 바뀌면 재계산

  // ── 카테고리 탭에 따른 필터링 ──────────────────────────────
  const filteredItems = activeTab === "모두"
    ? items
    : items.filter(item => {
      if (activeTab === "스티커") return item.type === "sticker";
      if (activeTab === "이모티콘") return item.type === "emoji";
      if (activeTab === "테마") return item.type === "app_theme";
      return true;
    });

  // ── 현재 적용 중인 테마 아이템에 자동으로 선택 테두리 표시 ──────────────────────────────
  // items나 currentTheme이 바뀔 때마다 다시 확인 (예: 화면 진입 직후 items가 늦게 채워지는 경우 대응)
  useEffect(() => {
    const appliedThemeItem = items.find(
      (item) => item.type === "app_theme" && item.themeKey === currentTheme
    );
    if (appliedThemeItem) {
      setSelectedItemId(appliedThemeItem.id); // 찾았으면 해당 아이템에 테두리 표시
    }
  }, [currentTheme, items]);

  // ── 아이템 클릭 시 처리 ──────────────────────────────
  // 현재는 테마(app_theme) 타입만 클릭에 반응함 (스티커/이모티콘은 클릭해도 아무 동작 없음)
  const handleItemClick = (item) => {
    if (item.type === "app_theme") {
      // 이미 적용 중인 테마를 또 클릭한 경우 - 변경할 필요 없으니 안내만
      if (item.themeKey === currentTheme) {
        toast("이미 적용 중인 테마입니다");
        return;
      }
      setTheme(item.themeKey);      // 전역 테마 상태 변경 → 앱 전체 배경/색상이 바뀜
      toast("테마를 변경했습니다")   // 변경됐다는 알림 표시
      setSelectedItemId(item.id);   // 방금 클릭한 아이템에 선택 테두리 표시
    }
  };

  return (
    // 보관함 전체 화면 컨테이너
    <div
      className="relative w-full h-full pt-[13%] pb-0 flex flex-col items-center bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'inventory_background_x3')})` }}
    >
      {/* 뒤로가기 버튼만 있는 헤더, 누르면 /more로 이동 */}
      <Header isBackButton={true} backPath="/more" />

      {/* 보관함 타이틀 텍스트 */}
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

      {/* 우측 상단: 상점 이동 버튼 + 코인 표시 영역 (Shop.jsx와 거의 동일한 구조) */}
      <div className="absolute top-[15%] right-[2%] flex flex-col items-end z-10 gap-3">
        {/* 상점 아이콘 클릭 시 /more/shop으로 이동 */}
        <button
          onClick={() => navigate('/more/shop')}
          className="bg-transparent border-none p-0 cursor-pointer outline-none"
        >
          <img src={getAssetUrl(currentTheme, 'icons', 'shop_icon_x3')} className="w-[80px] h-auto block" alt="상점" />
        </button>

        {/* 코인 잔액 표시 (여기서는 조회만 하고 갱신 로직은 없음) */}
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

      {/* 카테고리 탭 (type="inventory"로 상점 탭과 스타일 구분) */}
      <CategoryTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        marginTop="mt-[100px]"
        type="inventory"
      />

      {/* 로딩 중이면 로딩 문구, 아니면 보관함 아이템 그리드 표시 */}
      {loading ? (
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
          items={filteredItems}           // 카테고리 필터링된 목록
          selectedItemId={selectedItemId} // 초록 테두리로 표시할 아이템 id
          onItemClick={handleItemClick}   // 클릭 시 테마 변경 처리
        />
      )}

    </div>
  );
};

export default Inventory;