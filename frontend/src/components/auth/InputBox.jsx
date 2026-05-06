import { getAssetUrl } from "../../utils/AssetHelper" // 이미지 url
import AuthValidator from "../../utils/AuthValidator"; // 유효성검사

/**
 * @typedef {Object} InputStatus
 * @property {'success' | 'error' | 'default'} state - 입력값의 유효성 검사 상태
 * @property {string} message - 사용자에게 보여줄 안내 또는 에러 메시지
 */

/**
 * [auth 컴포넌트] 로그인 및 회원가입 화면에서 사용하는 픽셀아트 스타일의 커스텀 입력창입니다.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.label - 입력창 왼쪽 상단에 표시될 필드 이름 (예: '이메일', '비밀번호')
 * @param {string} props.type - HTML input 요소의 타입 (예: 'text', 'email', 'password')
 * @param {string} props.placeholder - 값이 입력되지 않았을 때 표시할 안내 문구
 * @param {string} props.value - input 필드에 바인딩된 현재 값
 * @param {function(React.ChangeEvent<HTMLInputElement>): void} props.onChange - 사용자가 값을 입력할 때 실행되는 핸들러 함수
 * @param {InputStatus} props.status - 유효성 검사 결과 상태 객체
 * @param {string} props.currentTheme - 앱의 현재 테마 모드 (예: 'light', 'dark', 'winter_light' 등)
 * @param {string} [props.autoComplete] - 브라우저 자동완성 속성 (예: 'current-password', 'username')
 * 
 * @example
 * <InputBox 
 *   label="비밀번호" 
 *   type="password" 
 *   value={password} 
 *   onChange={e => setPassword(e.target.value)} 
 *   status={{ state: 'error', message: '비밀번호가 일치하지 않습니다.' }}
 *   currentTheme="light"
 *   autoComplete="current-password"
 * />
 * 
 * @returns {JSX.Element} 픽셀아트 스타일이 적용된 입력 상자 컴포넌트
 */

// auth/InputBox 컴포넌트 선언
const InputBox = ({ label, type, placeholder, value, onChange, status, currentTheme, autoComplete}) => {

    const inputBoxStyle = {// 픽셀 아트 배경 이미지 & 비율 설정
        backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'auth_info_input_box_x3')})`,
        backgroundSize: '100% 100%', // 이미지를 박스 크기에 꽉 채움
        aspectRatio: '261/72' // 비율을 유지해 픽셀 왜곡 방지
    };

    return (
        <div className="w-full flex flex-col">
            {/* 입력 창 본체 영역 */}
            <div 
                className="w-full relative flex items-center"
                style={inputBoxStyle}>

                {/* 입력창 라벨: 배경 이미지 위쪽에 배치 */}
                <span className="absolute -mt-[15%] ml-[5%] font-bold text-3xs">
                    {label}
                </span>

                <input 
                    type={type}
                    placeholder={placeholder}
                    className="w-full h-full outline-none placeholder:text-gray-400 text-2xs font-bold text-center mt-[1%] -mb-[1%]"
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}/>
            </div>

            <div className="min-h-[1.5rem] flex items-center pl-[3%]">
                {status.message && (
                    // AuthValidator에 정의된 컬러 규격에 따라 텍스트 색상 변경 (Red/Green 등)
                    <span className={`text-3xs font-bold ${AuthValidator.STATUS_COLORS[status.state]}`}>
                        {status.message}    
                    </span>
                )}
            </div>
        </div>
    )
}

export default InputBox;