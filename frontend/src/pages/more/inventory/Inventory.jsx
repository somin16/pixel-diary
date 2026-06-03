import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // 토스트메세지 라이브러리
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기 
import { authFetch } from '../../../utils/AuthHelper';

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import CategoryTabs from "../../../components/more/shop/CategoryTabs";
import InventoryItemGrid from "../../../components/more/inventory/InventoryItemGrid";

// zuStand 함수 불러오기
import { useGetCoinStore } from "../../../store/useCoinStore";

// 아이템 카테고리 목록
const TABS = ["모두", "스티커", "이모티콘", "테마"];

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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 아이템 타입별 정렬 순서 설정
  const TYPE_ORDER = {
    'app_theme': 0,
    'emoji': 1,
    'sticker': 2,
    'ticket': 3,
  };

  // 인벤토리 아이템 목록 불러오기
  // 인벤토리 API와 아이템 API를 동시에 호출하여 아이템 상세 정보를 매핑
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const [inventoryResult, itemsResult] = await Promise.all([
          authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/inventory/`),
          authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/items/`),
        ]);

        // items 테이블 데이터를 item_id로 빠르게 찾기 위한 맵 생성
        const itemMap = {};
        (itemsResult.items || []).forEach(item => {
          itemMap[item.item_id] = item;
        });

        const mappedItems = (inventoryResult.items || [])
          .filter(inv => {
            const item = itemMap[inv.item_id];
            // diary_theme는 app_theme 구매 시 자동 지급되므로 보관함에서 제외
            return item && item.item_type !== 'diary_theme';
          })
          .map(inv => {
            const item = itemMap[inv.item_id];
            return {
              id: item.item_id,
              name: item.item_type === 'ticket'
                ? `${item.item_info} - ${inv.item_count}` // 티켓은 수량 표시
                : item.item_info,
              type: item.item_type,
              icon: item.item_image_url || 'home_icon_x3',
              item_count: inv.item_count,

              // app_theme 타입인 경우 item_name에서 _theme를 제거하여 themeKey 자동 생성
              // 예시: winter_light_theme → winter_light
              // 주의: item_name이 반드시 {themeKey}_theme 형식이어야 합니다
              themeKey: item.item_type === 'app_theme' ? item.item_name.replace('_theme', '') : null,
            };
          })
          // 타입별 정렬 (app_theme → emoji → sticker → ticket)
          .sort((a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99));
        setItems(mappedItems);
      } catch (error) {
        console.error('인벤토리 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
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

  // 보관함을 열었을 시 현재 적용된 테마 아이템에 초록색 테두리 씌우기(보관함의 초록색 선택 테두리 위치를 현재 테마에 맞게 업데이트)
  useEffect(() => {
    const appliedThemeItem = items.find(
      // 아이템의 themeKey가 '현재 Zustand 스토어에 저장된 테마 값(currentTheme)'과 일치해야 함
      (item) => item.type === "app_theme" && item.themeKey === currentTheme
    );
    if (appliedThemeItem) {
      setSelectedItemId(appliedThemeItem.id);
    }
  }, [currentTheme, items]);

  // 아이템 클릭 핸들러 로직
  // app_theme 타입만 클릭 시 테마 변경 및 선택 테두리 표시
  // 그 외 타입(sticker, emoji 등)은 클릭해도 선택 상태 변경 없음
  const handleItemClick = (item) => {
    if (item.type === "app_theme") {
      // 이미 적용된 테마인 경우 토스트 메시지 표시
      if (item.themeKey === currentTheme) {
        toast("이미 적용 중인 테마입니다");
        return;
      }
      setTheme(item.themeKey);      // 전역 테마 변경
      toast("테마를 변경했습니다")
      setSelectedItemId(item.id);   // 선택된 아이템에 초록색 테두리 표시
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
          className="text-5xl font-extrabold m-0 text-left"
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
          <span className="absolute right-[25%] top-1/2 -translate-y-1/2 text-base font-bold text-black tracking-wider pointer-events-none">
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

      {/* 로딩 중에는 로딩 메시지를 표시 */}
      {/* 보관함 아이템 그리드 분리 */}
      {/* 탭 조건에 맞게 필터링된 아이템 목록을 화면에 렌더링 */}
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
          items={filteredItems}
          selectedItemId={selectedItemId}
          onItemClick={handleItemClick}
        />
      )}

    </div>
  );
};

export default Inventory;