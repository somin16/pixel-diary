import { getAssetUrl } from "../../utils/AssetHelper" // 이미지 url
import AuthValidator from "../../utils/AuthValidator"; // 유효성검사

/**
 * [auth 컴포넌트] 로그인 및 회원가입 전용 픽셀아트 입력창
 * @param {string} label - 입력창 왼쪽 상단에 표시될 이름 (이메일, 비밀번호 등)
 * @param {string} type - input의 타입 (text, email, password 등)
 * @param {string} placeholder - 미입력 시 보여줄 안내 문구
 * @param {string} value - 현재 입력된 값
 * @param {function} onChange - 값 변경 시 실행될 핸들러 함수
 * @param {object} status - 유효성 검사 상태 ({ state: 'success'|'error', message: '...' })
 * @param {string} currentTheme - 앱의 현재 테마 (라이트/다크 등)
 */

// auth/InputBox 컴포넌트 선언
const InputBox = ({ label, type, placeholder, value, onChange, status, currentTheme}) => {

    const inputBoxStyle = {// 픽셀 아트 배경 이미지 & 비율 설정
        backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'auth_info_input_box_x3')})`,
        backgroundSize: '100% 100%', // 이미지를 박스 크기에 꽉 채움
        aspectRatio: '261/72' // 비율을 유지해 픽셀 왜곡 방지
    };

    return (
        <div className="w-full flex flex-col gap-1">
            {/* 입력 창 본체 영역 */}
            <div 
                className="w-full relative flex items-center"
                style={inputBoxStyle}>

                {/* 입력창 라벨: 배경 이미지 위쪽에 배치 */}
                <span className="absolute -mt-9 ml-4 font-bold text-xs">
                    {label}
                </span>

                <input // 실제 input 필드 : input 필드 배경이 투명해야 픽셀 이미지가 보임
                    type={type}
                    placeholder={placeholder}
                    className="w-full h-full p-6 bg-transparent outline-none placeholder:text-gray-400 text-m font-bold text-center mt-2 -mb-0.5"
                    value={value}
                    onChange={onChange}/>
            </div>

            <div className="h-5 flex items-center pl-2">
                {status.message && (
                    // AuthValidator에 정의된 컬러 규격에 따라 텍스트 색상 변경 (Red/Green 등)
                    <span className={`text-xs font-bold ${AuthValidator.STATUS_COLORS[status.state]}`}>
                        {status.message}    
                    </span>
                )}
            </div>
        </div>
    )
}

export default InputBox;