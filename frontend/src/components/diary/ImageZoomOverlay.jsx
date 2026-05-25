import CloseButton from "../common/CloseButton";

const ImageZoomOverlay = ({ imageUrl, onClose, footer }) => {

  return (
    <div
      className="absolute inset-0 flex justify-center bg-black/60 backdrop-blur-xs z-60"
    >
      {/* 닫기 버튼 */}
      <div className="absolute w-full h-full z-50 pointer-events-none">
        <CloseButton onClose={onClose} className="left-[85%] top-[8%] pointer-events-auto" />
      </div>

      {/* 확대 이미지 영역 */}
      <div
        className="absolute w-[85%] aspect-square mt-[30%]"
        onClick={(e) => e.stopPropagation()} // 이미지 클릭 시에는 닫히지 않게 방지
      >
        {imageUrl ? (
          // 1. 이미지가 있을 때
          <img
            src={imageUrl}
            className="w-full h-full object-contain"
            alt="확대 이미지"
          />

        ) : (
          // 2. 이미지가 없을 때: 흰색 배경 칸
          <div className="w-full h-full bg-white flex justify-center items-center">
            <span className="text-gray-400 text-xl">이미지가 없습니다</span>
          </div>
        )}
      </div>
      <div className="absolute w-full h-full flex justify-center items-end pb-[20%] z-40">
        {footer}
      </div>
    </div>
  );
};

export default ImageZoomOverlay;