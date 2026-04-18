import { getAssetUrl } from "../../utils/AssetHelper"

/**
 * @typedef {Object} FloatingActionButtonProps
 * @property {function} onClick - 버튼 클릭 시 실행될 핸들러 함수
 * @property {string} currentTheme - 현재 앱의 테마 (예: 'winter', 'spring')
 * @property {string} [ariaLabel="일기작성버튼"] - 스크린 리더용 웹 접근성 레이블 (기본값: "일기작성버튼")
 */

// home/FloatingActionButton FAB버튼 컴포넌트 선언
const FloatingActionButton = ({onClick, currentTheme, ariaLabel = "일기작성버튼"}) => {

    const FloatingActionButtonStyle = {// 픽셀 아트 배경 이미지 & 비율 설정
        backgroundImage: `url(${getAssetUrl(currentTheme, 'icons', 'add_icon_x3')})`,
        backgroundSize: '100% 100%',// 이미지를 박스 크기에 꽉 채움
        aspectRatio: '1/1'// 비율을 유지해 픽셀 왜곡 방지
    };
    
    return(
        <button
            className="absolute w-19 h-auto bottom-30 right-6 outline-none" // absolute는 부모요소 내에서 포함 (부모가 position: relative;를 가지고 있어야 정상작동)
            onClick={onClick}
            aria-label={ariaLabel} // 눈에 보이지 않는 텍스트 이름표 (화면 낭독기가 어떤 버튼인지 음성으로 읽어줌(기본값: 일기작성버튼))
            style={FloatingActionButtonStyle} // 텍스트가 없는 닫기X / 추가+ / 뒤로가기 > 같은 버튼에는 aria-label 속성 부여
        />
    )
    
}

export default FloatingActionButton