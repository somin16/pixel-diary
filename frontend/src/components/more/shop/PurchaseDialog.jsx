import React from "react";
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

/**
 * PurchaseDialog 컴포넌트
 * 아이템 구매를 최종적으로 확인하는 다이얼로그
 * @param {object} selectedItem - 구매하려는 아이템 데이터 객체
 * @param {function} setDialogStep - 다이얼로그 단계를 변경하는 함수 ('취소하기' 클릭 시 상세 화면인 'detail'로 돌아가기 위해 사용)
 * @param {function} handlePurchase - '구매하기' 버튼 클릭 시 실제 재화 차감 및 구매 로직을 처리하는 함수
 * @param {string} [width="100%"] - 다이얼로그의 기본 가로 너비
 * @param {string} [maxWidth="320px"] - 다이얼로그의 최대 가로 너비 (화면이 커져도 이 이상 커지지 않음) -> 상한선 값이기 때문에 px로 유지
 */

const PurchaseDialog = ({
  selectedItem,
  setDialogStep,
  handlePurchase,
  width = "100%",
  maxWidth = "320px"
}) => {

  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);

  // 선택된 아이템 정보가 비어있을 경우(null/undefined) 렌더링하지 않아 컴포넌트 에러를 방지
  if (!selectedItem) return null;

  return (
    <DialogBox boxImageName="store_item_popup_box_x3" width={width} maxWidth={maxWidth}>
      <div className="relative flex flex-col items-center w-full px-2 py-4 top-[-17%]" >

        {/* 중앙 아이템 박스 */}
        <div className="relative w-[31%] h-25 mt-[3%] flex items-center justify-center">
          <img src={getAssetUrl(currentTheme, 'boxes', 'store_popup_item_box_x2')} className="absolute inset-0 w-full h-full object-fill pointer-events-none" alt="아이템 배경" />
          <img src={getAssetUrl(currentTheme, 'icons', selectedItem.icon)} className="relative z-10 w-[70%] h-auto mb-[5%]" alt="" />
        </div>

        {/* 질문 텍스트 */}
        <div className="mt-[4%] text-[14px] font-bold text-black text-center whitespace-pre-wrap">
          <span className="text-[#00B050]">"{selectedItem.name}"</span>을/를 구매하시겠습니까?
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-center gap-[13%] mt-[4%] w-full">
          <ImageButton
            label="취소하기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
            onClick={() => setDialogStep("detail")}
          />
          <ImageButton
            label="구매하기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
            onClick={handlePurchase}
          />
        </div>
      </div>
    </DialogBox>
  );
};

export default PurchaseDialog;