import React from "react";
import { useTheme } from '../../hooks/useTheme';
import { getAssetUrl } from "../../utils/AssetHelper";

/**
 * ShopItemGrid 컴포넌트
 * 상점의 아이템 목록을 그리드 형태로 렌더링하는 컴포넌트
 * @param {Array} items - 화면에 보여줄 아이템 객체들이 담긴 배열
 * @param {function} onItemClick - 개별 아이템을 클릭했을 때 실행할 함수 (클릭된 아이템 객체를 인자로 전달)
 */

const ShopItemGrid = ({ items, onItemClick }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <div 
      className="w-full flex-1 p-[3%] pb-0 overflow-y-auto bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'store_box_x3')})` }}
    > 
      <div className="grid grid-cols-4 gap-3 pb-[5.5%]">
        
        {/* 실제 아이템 렌더링 */}
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => {
              // 품절되지 않은(isSoldOut이 false인) 아이템만 클릭 이벤트를 실행
              if (!item.isSoldOut) {
                // 클릭 시 Shop.jsx에서 넘겨준 함수(상세 팝업 띄우기 등)를 실행, 현재 아이템 정보를 넘겨줌
                onItemClick(item); 
              }
            }}
            className={`relative w-full ${item.isSoldOut ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {/* 아이템 슬롯의 배경 박스 이미지 */}
            <img 
              src={getAssetUrl(currentTheme, 'boxes', 'store_item_box_x2')} 
              className="w-full h-auto block pointer-events-none" 
              alt="아이템 배경" 
            />
            {/* 실제 아이템 아이콘 */}
            <img 
              src={getAssetUrl(currentTheme, 'icons', item.icon)} 
              className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[70%] h-auto z-10 pointer-events-none" 
              alt={item.name} 
            />

            {/* 가격 정보 (코인 아이콘 + 가격 텍스트) */}
            <div className="absolute bottom-[12%] w-full flex justify-center items-center gap-[4%] z-10 pointer-events-none">
              <img src={getAssetUrl(currentTheme, 'icons', 'coin_icon_x3')} className="w-[19%] h-auto" alt="코인" />
              <span className={`text-[14px] leading-none ${item.isSoldOut ? 'text-[#FF4D4D]' : 'text-black'}`}>
                {item.isSoldOut ? "품절" : item.price}
              </span>
            </div>

            {/* 품절된 아이템일 경우, 어둡게 처리하는 오버레이 이미지(반투명 레이어 등)를 맨 위에 덮어씌움 */}
            {item.isSoldOut && (
              <img 
                src={getAssetUrl(currentTheme, 'boxes', 'store_item_box_select_x2')} 
                className="absolute inset-0 w-full h-full z-20 pointer-events-none" 
                alt="품절" 
              />
            )}
          </div>
        ))}

        {/* 아이템 칸 16개로 고정 */}
        {Array.from({ length: Math.max(0, 16 - items.length) }).map((_, idx) => (
          <div key={`empty-${idx}`} className="relative w-full">
            <img 
              src={getAssetUrl(currentTheme, 'boxes', 'store_item_box_x2')} 
              className="w-full h-auto block pointer-events-none" 
              alt="빈 슬롯" 
            />
          </div>
        ))}

      </div>
    </div>
  );
};

export default ShopItemGrid;