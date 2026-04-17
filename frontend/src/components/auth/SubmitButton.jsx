import { getAssetUrl } from "../../utils/AssetHelper"; // 이미지 url

/**
 * [공통 컴포넌트] 인증(로그인/회원가입) 전용 제출 버튼
 * @param {function} onClick - 버튼 클릭 시 실행될 핸들러 함수
 * @param {boolean} loading - 현재 서버 통신 중인지 여부 (문구 변경 및 클릭 방지)
 * @param {boolean} disabled - 버튼 활성화 여부 (유효성 검사 결과에 따름)
 * @param {string} currentTheme - 현재 적용된 앱 테마 (이미지 경로 결정용)
 * @param {string} text - 버튼에 표시될 기본 문구 (예: '로그인', '회원가입')
 */

// auth/SubmitButton 컴포넌트 선언
const SubmitButton = ({ onClick, loading, disabled, currentTheme, text }) => {

    const SubmitButtonStyle = {// 픽셀 아트 배경 이미지 & 비율 설정
        backgroundImage: `url(${getAssetUrl(currentTheme, 'buttons', 'auth_submit_button_x3')})`,
        backgroundSize: '100% 100%',// 이미지를 박스 크기에 꽉 채움
        aspectRatio: '261/72'// 비율을 유지해 픽셀 왜곡 방지
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading} // 로딩 중이거나 비활성화 상태일 때 클릭 이벤트 차단
            type="submit"
            className={`w-full p-5 text-white font-bold text-2xl transition-opacity outline-none
                ${(disabled || loading) ? 'opacity-50' : 'opacity-100'}`} // 로딩 중이거나 비활성화 상태일 때 버튼이 흐려짐
            style={SubmitButtonStyle}
        >
            {/* 로딩 상태에 따라 문구를 동적으로 변경 (예: 로그인 -> 로그인 중) */}
            {loading ? `${text} 중` : text}
        </button>
    )
}
export default SubmitButton;