// 1. 리액트 불러오기
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// 2. 유틸 함수 불러오기
import AuthValidator from '../../utils/AuthValidator';

// 3. 커스텀 훅 불러오기
import { useTheme } from '../../store/useThemeStore';

// 4. 슈파베이스 불러오기
import { supabase } from '../../utils/SupabaseClient';

// 5. 컴포넌트 불러오기
import InputBox from '../../components/auth/InputBox';
import SubmitButton from '../../components/auth/SubmitButton';

export default function ResetPassword() {
    // 페이지 이동
    const navigate = useNavigate();

    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme);

    // [상태] 입력값 관리
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // [상태] 로딩 및 완료 여부
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: 입력, 2: 완료

    // [상태] 피드백 메시지
    const [passwordStatus, setPasswordStatus] = useState({ state: 'default', message: '' });
    const [confirmStatus, setConfirmStatus] = useState({ state: 'default', message: '' });

    // 비밀번호 유효성 검사
    useEffect(() => {
        setPasswordStatus(AuthValidator.validatePassword(password));
    }, [password]);

    // 비밀번호 확인 유효성 검사
    useEffect(() => {
        setConfirmStatus(AuthValidator.validateConfirmPassword(password, confirmPassword));
    }, [password, confirmPassword]);

    // 비밀번호 재설정 제출
    const handleResetPassword = async (e) => {
        e.preventDefault();

        const isAllValid =
            passwordStatus.state === 'success' &&
            confirmStatus.state === 'success';

        if (!isAllValid) {
            alert("모든 항목을 올바르게 입력해주세요");
            return;
        }

        setLoading(true);

        try {
            // Supabase로 직접 비밀번호 변경 요청
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                throw error;
            }

            // 성공 시 완료 화면으로 전환
            setStep(2);
        } catch (err) {
            console.error("비밀번호 재설정 에러:", err);
            alert("비밀번호 재설정에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // 전체 컨테이너
        <div className='w-full h-full items-center flex flex-col p-[15%]'>
            {/* 타이틀 */}
            <h1 className='text-4xl font-bold text-center mt-[25%]'>Pixel Diary</h1><br />
            <h1 className='text-2xl font-bold text-center mb-[10%]'>비밀번호 재설정</h1>

            {step === 1 ? (
                /* STEP 1 : 비밀번호 입력 화면 */
                <form onSubmit={handleResetPassword} noValidate className='w-full flex flex-col'>

                    {/* 새 비밀번호 입력창 */}
                    <InputBox
                        label="새 비밀번호"
                        type="password"
                        placeholder="새 비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        status={passwordStatus}
                        currentTheme={currentTheme}
                        autoComplete="new-password"
                    />

                    {/* 비밀번호 확인 입력창 */}
                    <InputBox
                        label="비밀번호 확인"
                        type="confirmpassword"
                        placeholder="비밀번호를 한번 더 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        status={confirmStatus}
                        currentTheme={currentTheme}
                    />

                    {/* 변경 버튼 */}
                    <SubmitButton
                        loading={loading}
                        disabled={loading || passwordStatus.state !== 'success' || confirmStatus.state !== 'success'}
                        currentTheme={currentTheme}
                        text="변경"
                    />
                </form>
            ) : (
                /* STEP 2 : 변경 완료 화면 */
                <div className="w-full flex flex-col items-center gap-[10%] text-center">
                    <p className="font-bold text-2xl text-gray-800">비밀번호가 변경되었습니다!</p>
                    <p className="text-xl text-gray-500 leading-relaxed">
                        새 비밀번호로 로그인해 주세요.
                    </p>

                    <SubmitButton
                        currentTheme={currentTheme}
                        text="로그인하러 가기"
                        onClick={() => navigate('/auth/login')}
                    />
                </div>
            )}
        </div>
    );
}