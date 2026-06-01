import React from "react";
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import TicketBadge from "./TicketBadge";

// 개별 출석 박스 컴포넌트
const DayBox = ({ item, isAttended, onClick, currentTheme, coinReward }) => {
  const pixelStyle = { imageRendering: 'pixelated' };

  return (
    <div className="relative flex flex-col items-center cursor-pointer w-full" onClick={onClick}>

      {/* 4일차, 7일차 항상 고정되는 빨간 테두리 티켓 뱃지 */}
      {/* 특별 보상(special) 타입일 경우에만 상단에 티켓 뱃지 컴포넌트를 렌더링 */}
      {item.type === "special" && (
        <TicketBadge
          ticketCount={item.ticketCount}
          isAttended={isAttended}
          currentTheme={currentTheme}
        />
      )}

      {/* 메인 출석 보상 상자 */}
      <div
        className="relative w-full aspect-[7/8] flex flex-col items-center justify-between p-[4%] overflow-hidden"
        style={{
          backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'daily_check_coin_box_x3')})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          ...pixelStyle
        }}
      >
        {/* 기본 보상(코인) 아이콘 */}
        <div className="flex-1 flex flex-col items-center justify-center w-full mt-[2%]">
          <img
            src={getAssetUrl(currentTheme, 'icons', 'coin_icon_x3')}
            alt="코인"
            className="w-[60%] h-auto object-contain"
            style={pixelStyle}
          />
          <span className="text-xs text-black mt-[2%]">{coinReward}</span>
        </div>

        {/* 출석 완료 상태 오버레이 처리 */}
        {isAttended && (
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'daily_check_frame_overlay')}
            alt="출석_오버레이"
            className="absolute inset-0 w-full h-full z-20"
            style={pixelStyle}
          />
        )}

        {/* 출석 완료 스탬프 */}
        {isAttended && (
          <div className="absolute top-[10%] left-0 w-full flex justify-center z-40 pointer-events-none animate-in fade-in zoom-in duration-300">
            <img
              src={getAssetUrl(currentTheme, 'icons', 'daily_check_stamp_icon_x3')}
              alt="출석완료"
              className="w-[55%] h-auto drop-shadow-md"
              style={pixelStyle}
            />
          </div>
        )}

        {/* 일차 표시 */}
        <span className="text-sm text-black mb-[1%] tracking-tighter relative z-20">
          day 0{item.day}
        </span>
      </div>
    </div>
  );
};

export default DayBox;