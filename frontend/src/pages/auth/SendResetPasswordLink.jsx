// 1. 리액트 불러오기
import { data, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// 2. 유틸 함수 불러오기
import { getAssetUrl } from "../../utils/AssetHelper";
import AuthValidator from '../../utils/AuthValidator';

// 3. 커스텀 훅 불러오기
import { useTheme } from '../../store/useThemeStore';
import useDebounce from '../../hooks/useDebounce';

// 4. 슈파베이스 불러오기
import { supabase } from "../../utils/SupabaseClient";

// 5. 컴포넌트 불러오기
import InputBox from '../../components/auth/InputBox';
import SubmitButton from '../../components/auth/SubmitButton';

export default function SendResetPasswordLink() { // 비밀번호 재설정 링크 이메일로 보내는 페이지 내보내기
    // 페이지 이동
    const navigate = useNavigate();

    // [상태] 입력값 관리
    const [step, setStep] = useState(1); // 1. 이메일 입력, 2. 발송 완료
    const [loading, setLoading] = useState(false);
    const [user_email, setUser_email] = useState('');

    // [상태] 피드백 메시지
    const [emailStatus, setEmailStatus] = useState({ state: 'default', message: '' });

    // 디바운스 적용 (서버 요청 횟수 조절)
    const debouncedUserEmail = useDebounce(user_email, 500); // 0.5초 딜레이 

    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme)
    
    // 유효성 검사 / 이메일 형식만 체크 (checkDuplicate = false)
    useEffect(() => {
        const checkEmail = async () => {
            if (debouncedUserEmail) {
                const status = await AuthValidator.validateEmail(debouncedUserEmail, false);
                setEmailStatus(status);
            } else {
                setEmailStatus({ state: 'default', message: '' })
            }
        };
        checkEmail();
    }, [debouncedUserEmail]);

    // 링크 발송 함수 (백엔드 API 연동)
    const handleSendEmail = async (e) => {
        e.preventDefault();

        // 이메일 형식이 안 맞거나 빈 값이면 중단
        if (emailStatus.state !== 'success' || !user_email) {
            return; 
        }

        setLoading(true);

        try{
            const sendMailEndpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/password/reset/`;
            const response = await fetch(sendMailEndpoint, {
                method: 'POST',
                headers: { 'Content-Type' : 'application/json'},
                body: JSON.stringify({ user_email: user_email })
            });

            // 응답 상태 확인
            if(response.ok) { // 성공
                const authData = await response.json(); // 성공했을 때만 JSON을 파싱
                setStep(2); // 성공 시 2단계 화면으로 전환 (이메일 발송 완료)
            } else {
                // 실패했을 때 (400, 404, 500 등)
            // 에러 메시지 추출 시도 (JSON이 아닐 경우를 대비해 처리)
            let errorMessage = "서버 오류로 인해 발송 실패. 다시 시도해 주세요.";
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (pasingError) {
                // 서버가 JSON이 아닌 HTML 에러 페이지를 보낸 경우 대응
                console.error("에러 데이터 파싱 실패:", pasingError);
            }

            setEmailStatus({
                state: 'error',
                message: errorMessage
            });
            }
        } catch (error) {
            console.error("통신 장애:", error);
            setEmailStatus({
                state: 'error',
                message: '서버와 연결할 수 없습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    return(
        // 전체 컨테이너
        <div className='w-full h-full items-center flex flex-col p-[15%]'>
            {/* 비밀번호 재설정 글씨 */}
            <h1 className='text-4xl font-bold text-center mt-[25%]'>Pixel Diary</h1><br/>
            <h1 className='text-2xl font-bold text-center mb-[10%]'>비밀번호 재설정</h1>
            {step === 1 ? (
                /* STEP 1 : 이메일 입력 화면 */
            <form onSubmit={handleSendEmail} noValidate className='w-full flex flex-col'>

                {/* 이메일 입력 창 */}
                <InputBox // auth/InputBox 컴포넌트를 불러와서 사용
                    label="이메일"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={user_email}
                    onChange={(e) => setUser_email(e.target.value)}
                    status={emailStatus}
                    currentTheme={currentTheme}
                />

                {/* 발송 버튼 */}
                <SubmitButton // auth/SubmitButton 컴포넌트 불러와서 사용
                    loading={loading}
                    disabled={loading || emailStatus.state !== 'success'}
                    currentTheme={currentTheme}
                    text="발송"
                />

            </form>

            ) : (
                /* STEP 2 : 이메일 발송 완료 화면 */
                <div className="w-full flex flex-col items-center gap-[10%] text-center">
                    
                    
                    {/* 입력했던 이메일을 강조해서 보여줌 */}
                    <div className="bg-gray-50 p-4 rounded-lg w-full border border-dashed border-gray-300">
                        <span className="text-blue-500 font-normal text-base break-all">{user_email}</span>
                    </div>

                    <p className="font-bold text-xl text-gray-800">메일이 발송되었습니다!</p>
                    <p className="text-1xl text-gray-500 leading-relaxed">
                        메일함에 도착한 재설정 링크를 클릭하여 비밀번호 변경을 완료해 주세요.
                    </p>

                    <SubmitButton
                        currentTheme={currentTheme}
                        text="확인"
                        onClick={() => navigate('/auth/login')}
                    />
                </div>
            )}
        </div>
    );
}