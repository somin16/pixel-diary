import React from "react";
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

/**
 * ItemDetailDialog 컴포넌트
 * 상점 아이템의 상세 정보를 보여주는 다이얼로그
 * @param {object} selectedItem - 사용자가 선택한 아이템 데이터 객체 (이름, 가격, 아이콘 등 포함)
 * @param {function} setDialogStep - 다이얼로그 단계를 변경하는 함수 (미리보기 'preview' 또는 구매 확인 'confirm'으로 이동 시 사용)
 * @param {function} closeDialog - 다이얼로그를 완전히 닫는 함수 (우측 상단 X 버튼 클릭 시 실행)
 * @param {string} [width="100%"] - 다이얼로그의 기본 가로 너비
 * @param {string} [maxWidth="320px"] - 다이얼로그의 최대 가로 너비 (화면이 커져도 이 이상 커지지 않음) -> 상한선 값이기 때문에 px로 유지
 */

const ItemDetailDialog = ({ selectedItem, setDialogStep, closeDialog, width = "100%", maxWidth = "320px" }) => {
  //  테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 선택된 아이템이 없으면 렌더링하지 않음 (오류 방지용 예외 처리)
  if (!selectedItem) return null;

  return (
    <DialogBox boxImageName="store_item_popup_box_x3" width={width} maxWidth={maxWidth}>
      {/* 전체 내용물을 감싸는 컨테이너 */}
      <div className="relative flex flex-col items-center w-full px-4 py-6 top-[-20%]">

        {/* 우측 상단 X 닫기 버튼 */}
        <button
          className="absolute -top-11 -right-4 p-2 z-50 cursor-pointer outline-none transition-transform"
          onClick={closeDialog}
        >
          <img src={getAssetUrl(currentTheme, 'icons', 'close_icon_x3')} className="w-9 h-auto" alt="닫기" />
        </button>

        {/* 아이템 가격 */}
        {/* 컨테이너 기준 우측 상단에 고정되도록 top과 right 위치값 지정 */}
        <div className="absolute top-8 right-0 flex items-center gap-1">
          <img src={getAssetUrl(currentTheme, 'icons', 'coin_icon_x3')} className="w-8 h-auto" alt="코인" />
          <span className="text-[24px] text-black tracking-wider">{selectedItem.price}</span>
        </div>

        {/* 아이템 박스와 제목을 위한 가로 배열 컨테이너 */}
        <div className="flex flex-row items-center w-full mt-4 px-4">

          {/* 아이템 박스: 왼쪽에 배치 */}
          <div className="relative w-[44%] aspect-square flex-shrink-0 flex items-center justify-center -ml-6">

            {/* 아이템 박스 배경 이미지 */}
            <img
              src={getAssetUrl(currentTheme, 'boxes', 'store_popup_item_box_x2')}
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              alt="아이템 배경" />

            {/* 실제 아이템 아이콘 이미지 */}
            <img
              src={getAssetUrl(currentTheme, 'icons', selectedItem.icon)}
              className="relative z-10 w-[70%] h-auto mb-[5%]"
              alt="" />
          </div>

          {/* 아이템 제목 */}
          {/* flex-1을 주어 남은 공간 전체를 차지하게 하고 text-center로 중앙 정렬 */}
          <div className="flex-1 text-center pl-2">
            <span className="text-[16px] font-bold text-black text-center break-keep">
              {selectedItem.name}
            </span>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-center gap-[14%] mt-[5%] w-full">
          <ImageButton
            label="미리 보기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
            onClick={() => setDialogStep("preview")}
          />
          <ImageButton
            label="구매하기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
            onClick={() => setDialogStep("confirm")}
          />
        </div>
      </div>
    </DialogBox>
  );
};

export default ItemDetailDialog;