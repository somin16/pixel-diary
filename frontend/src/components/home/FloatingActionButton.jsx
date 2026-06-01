import { getAssetUrl } from "../../utils/AssetHelper"

/**
 * @typedef {Object} FloatingActionButtonProps
 * @property {function} onClick - 버튼 클릭 시 실행될 핸들러 함수
 * @property {string} currentTheme - 현재 앱의 테마 (예: 'winter', 'spring')
 * @property {string} [ariaLabel="일기작성버튼"] - 스크린 리더용 웹 접근성 레이블 (기본값: "일기작성버튼")
 */

// home/FloatingActionButton FAB버튼 컴포넌트 선언
const FloatingActionButton = ({ onClick, currentTheme, ariaLabel = "일기작성버튼" }) => {

  return (
    <button
      className="absolute bottom-[12%] right-[3%] h-auto outline-none"
      onClick={onClick}
      aria-label={ariaLabel} // 눈에 보이지 않는 텍스트 이름표 (화면 낭독기가 어떤 버튼인지 음성으로 읽어줌(기본값: 일기작성버튼))
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'icons', 'add_icon_x3')})`,
        backgroundSize: '100% 100%',// 이미지를 박스 크기에 꽉 채움
        aspectRatio: '1/1',// 비율을 유지해 픽셀 왜곡 방지
        width: 'calc(var(--scale, 1) * 65px)',
        minWidth: '90px'
      }}
    />
  )

}

export default FloatingActionButton