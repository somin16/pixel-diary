import { getAssetUrl } from "../../utils/AssetHelper"
import ImageButton from "./ImageButton"
import { useTheme } from "../../store/useThemeStore"
import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

/**
 * @typedef {Object} CloseButtonProps
 * @property {() => void} [onClose] - 버튼 클릭 시 실행할 커스텀 핸들러. 
 * 전달되지 않으면 기본적으로 navigate(-1)을 통해 이전 페이지로 이동합니다.
 * @property {string} [className] - 추가적인 스타일 확장을 위한 클래스명
 */

/**
 * 앱 전역에서 사용하는 테마 대응형 닫기(X) 버튼 컴포넌트입니다.
 * 클릭 시 이전 페이지로 이동하거나, 주입된 onClose 함수를 실행합니다.
 * * @param {CloseButtonProps} props
 * @returns {JSX.Element}
 */

const CloseButton = ({ onClose, className}) => {
    // 네비게이트 함수 생성
    const navigate = useNavigate(); 
    
    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme);

    /**
     * 클릭 이벤트 핸들러
     * @param {React.MouseEvent} e - 클릭 이벤트 객체
     */
    const handleClose = (e) => {
        // 부모 요소로의 클릭 이벤트 전파를 막아 의도치 않은 동작 방지
        e.stopPropagation();

        if (onClose) {
            // 별도의 닫기 로직이 주입된 경우 실행
            onClose();
        } else {
            // 기본 동작: 뒤로 가기
            navigate(-1);
        }
    };

    return(
        <ImageButton
            onClick = {handleClose}
            imageSrc = {getAssetUrl(currentTheme, 'icons', 'close_icon_x3')}
            className = {`aspect-[27/24] w-[35px] ${className}`}
        />
    )
}

export default CloseButton;