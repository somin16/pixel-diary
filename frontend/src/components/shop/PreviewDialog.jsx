import React from "react";
import { useTheme } from '../../hooks/useTheme';
import { getAssetUrl } from "../../utils/AssetHelper";

/**
 * PreviewDialog 
 * 아이템의 미리보기를 보여주는 전용 다이얼로그
 * @param {array} previews - 미리보기 이미지 파일명 배열 (예: ['preview_1', 'preview_2'])
 * @param {function} onClose - 닫기 버튼 클릭 또는 배경 오버레이 클릭 시 실행할 닫기 함수
 */

const PreviewDialog = ({ previews, onClose }) => {
  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  return (
    <>
      {/* 어두운 배경 오버레이 (바깥 클릭 시 닫기) */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* 중앙에 뜨는 핑크색 프리뷰 박스 */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[450px] h-[65vh] flex flex-col items-center justify-center bg-[length:100%_100%] bg-no-repeat"
        style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'store_box_x3')})` }} 
      >
        
        {/* 닫기 버튼 */}
        <button
          className="absolute -top-[60px] -right-[5px] p-2 z-[60] cursor-pointer outline-none transition-transform"
          onClick={onClose}
        >
          <img
            src={getAssetUrl(currentTheme, 'icons', 'cancle_icon_x3')}
            className="w-[35px] h-auto"
            alt="닫기"
          />
        </button>

        {/* 가로 스크롤 영역 */}
        <div className="w-full flex-1 flex flex-row flex-nowrap overflow-x-auto gap-6 py-6 pl-6 pr-6 no-scrollbar items-center justify-start min-w-0">
          {previews?.map((img, idx) => (
            <div 
              key={idx}
              className="h-full shrink-0"
            >
              <img
                src={getAssetUrl(currentTheme, 'previews', img)}
                className="h-full w-auto block"
                draggable="false" 
                alt={`미리보기 ${idx + 1}`}
                onError={(e) => console.error(`이미지 로드 실패: ${img}`)}
              />
            </div>
          ))}
        </div>

      </div>
    </>
  );
};

export default PreviewDialog;