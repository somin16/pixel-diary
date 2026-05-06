import React from "react";
import { getAssetUrl } from "../../utils/AssetHelper";

// 특별 보상(4일차, 7일차) 박스에 부착되는 티켓 뱃지 컴포넌트
const TicketBadge = ({ ticketCount, isAttended, currentTheme }) => {
  const pixelStyle = { imageRendering: 'pixelated' };

  return (
    <div 
      className="absolute -top-[15%] -right-[15%] w-[65%] aspect-square z-40 flex flex-col items-center justify-center"
      style={{ 
        backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'daily_check_ticket_box_x3')})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        ...pixelStyle
      }}
    >
      {/* 보상 티켓 아이콘 */}
      <img 
        src={getAssetUrl(currentTheme, 'icons', 'ticket_icon')} 
        alt="티켓" 
        className="w-[64%] h-auto mt-[8%]"
        style={pixelStyle} // 픽셀 아트 선명도 유지
      />
      {/* 획득할 티켓 수량 */}
      <span className="text-[12px] text-black leading-none mt-[10%]">
        {ticketCount}
      </span>

      {/* 출석을 완료했을 때 표시되는 오버레이 */}
      {isAttended && (
        <img 
          src={getAssetUrl(currentTheme, 'boxes', 'ticket_frame_overlay')} 
          alt="티켓_오버레이" 
          className="absolute inset-0 w-full h-full z-20 block"
          style={pixelStyle}
        />
      )}
    </div>
  );
};

export default TicketBadge;