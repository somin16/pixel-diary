import React from "react";
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

/**
 * InventoryItemGrid 컴포넌트
 * 보관함의 아이템 목록을 그리드 형태로 렌더링
 * @param {Array} items - 화면에 보여줄 아이템 객체 배열
 * @param {number|string} selectedItemId - 현재 선택된 아이템의 ID
 * @param {function} onItemClick - 아이템 클릭 시 실행할 함수
 */

const InventoryItemGrid = ({ items, selectedItemId, onItemClick }) => {
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <div
      className="w-full flex-1 p-[15px] pb-0 overflow-y-auto bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'inventory_box_x3')})` }}
    >
      <div className="grid grid-cols-4 gap-3 pb-[20px]">

        {/* 실제 아이템 렌더링 */}
        {items.map((item, idx) => {
          const isSelected = item.id === selectedItemId;

          return (
            <div
              key={idx}
              onClick={() => onItemClick(item)}
              className="relative w-full cursor-pointer"
            >
              {/* 기본 아이템 배경 박스 */}
              <img
                src={getAssetUrl(currentTheme, 'boxes', `inventory_item_box${item.type === 'app_theme' ? '_theme' : item.type === 'sticker' ? '_sticker' : item.type === 'emoji' ? '_emoji' : ''}_x2`)}
                className="w-full h-auto block pointer-events-none"
                alt="아이템 배경"
              />

              {/* 아이템 아이콘 */}
              <div className="absolute top-[15%] h-auto z-10 pointer-events-none aspect-square w-full px-[10%] pb-[35%] flex justify-center">
                <img
                  src={item.icon}
                  alt={item.name}
                  className="object-contain"
                />
              </div>
              

              {/* 아이템 이름 */}
              <div className="absolute bottom-[10%] w-full flex justify-center items-center z-30 pointer-events-none">
                <span className="text-[11px] text-black font-bold tracking-tighter">
                  {item.name}
                </span>
              </div>

              {/* 선택된 아이템일 경우: 초록색 테두리 반투명 이미지 오버레이 */}
              {isSelected && (
                <img
                  src={getAssetUrl(currentTheme, 'boxes', 'inventory_item_box_select_x2')}
                  className="absolute inset-0 w-full h-full z-20 pointer-events-none"
                  alt="선택됨"
                />
              )}
            </div>
          );
        })}

        {/* 아이템 칸 16개로 고정 */}
        {Array.from({ length: Math.max(0, 16 - items.length) }).map((_, idx) => (
          <div key={`empty-${idx}`} className="relative w-full">
            <img
              src={getAssetUrl(currentTheme, 'boxes', 'inventory_item_box_x2')}
              className="w-full h-auto block pointer-events-none"
              alt="빈 슬롯"
            />
          </div>
        ))}

      </div>
    </div>
  );
};

export default InventoryItemGrid;