import { getAssetUrl } from "../../utils/AssetHelper"; // 이미지 url

/**
 * [공통 컴포넌트] 소셜 로그인(Google, Kakao, Naver) 버튼 그룹
 * @param {function} onLogin - 특정 플랫폼의 로그인 로직을 실행할 핸들러 함수
 * @param {string} currentTheme - 현재 앱의 테마 (아이콘 경로 결정용)
 */

// auth/SocialLoginButton 컴포넌트 선언
const SocialLoginButton = ({ onLogin, currentTheme }) => {
    
    // SNS 플랫폼 데이터 객체 배열
    const socialPlatforms = [
        { id: 'google', name: 'google_icon_x3' },
        { id: 'kakao', name: 'kakaotalk_icon_x3' },
        { id: 'naver', name: 'naver_icon_x3' }
    ];

    return (
        <div className="flex gap-4 mb-5"> // 버튼 간격(gap-4(16px))및 중앙 정렬 레이아웃
            {socialPlatforms.map(social => (
                <button
                    key={social.id} // 리스트 렌더링 시 교유 식별자 설정
                    onClick={() => onLogin(social.id)} // 클릭 시 해당 플랫폼 ID 전달
                    className="w-20 h-20 transition-transform outline-none" // 버튼 크기 고정 및 버튼 테두리 제거
                >
                    <img
                        src={getAssetUrl(currentTheme, 'icons', social.name)}
                        alt={`${social.id} 로그인`}
                        className="w-full h-full object-contain" // 이미지 비율을 유지하며 버튼 영역 안에 맞춤
                    />
                </button>
            ))}
        </div>
    );
};

export default SocialLoginButton;