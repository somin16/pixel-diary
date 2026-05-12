import React, { useState } from "react";
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import DialogBox from '../../common/dialog/DialogBox';
import ImageButton from '../../common/ImageButton';
import InputField from '../auth/InputField';

/**
 * WithdrawalDialog (회원 탈퇴 다이얼로그)
 * 이메일 유저: 1단계(의사 확인) → 2단계(비밀번호 검증) 후 탈퇴 진행
 * 소셜 유저: 1단계(의사 확인) 후 바로 탈퇴 진행
 * @param {function} onConfirm - 탈퇴 확정 시 실행. 이메일 유저는 password 문자열, 소셜 유저는 null 전달
 * @param {function} onCancel - '취소하기' 클릭 시 팝업을 닫는 함수
 * @param {string} loginProvider - 로그인 수단 ('email' | 'google' | 'kakao' | 'naver')
 * @param {string} [width="100%"] - 다이얼로그의 가로 너비 (기본값: "100%")
 * @param {string} [maxWidth="320px"] - 다이얼로그의 최대 가로 너비 (기본값: "320px") -> 상한선 값이기 때문에 px로 유지
 */

const WithdrawalDialog = ({ onConfirm, onCancel, loginProvider, width = "100%", maxWidth = "320px" }) => {
    // 테마 전역 관리
    const currentTheme = useTheme((state) => state.currentTheme);
    // 'confirm' (탈퇴 확인) 또는 'password' (비밀번호 입력) 상태 관리
    const [step, setStep] = useState('confirm'); // 'confirm' | 'password'
    const [password, setPassword] = useState("");
    // 소셜 유저 여부
    const isSocialUser = loginProvider !== 'email';
    return (
        <>
            {/* 1단계 - 탈퇴 확인 */}
            {step === 'confirm' && (
                <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
                    <div className="flex flex-col items-center mt-[5%] gap-[20%]">
                        <p className="text-[13px] font-bold text-center m-0">정말 탈퇴 하시겠습니까?</p>
                        <p className="text-[13px] font-bold text-[#ef4444] text-center m-0 leading-tight">탈퇴 버튼 선택 시, 계정은 삭제되며 <br />복구되지 않습니다.</p>
                    </div>

                    {/* 하단 버튼 영역 */}
                    <div className="flex gap-[5%] justify-center w-full">
                        <ImageButton
                            label="회원탈퇴"
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')}
                            onClick={() => {
                                if (isSocialUser) {
                                    onConfirm(null); // 소셜 유저 → 바로 탈퇴
                                } else {
                                    setStep('password'); // 이메일 유저 → 비밀번호 단계로
                                }
                            }}
                        />
                        <ImageButton
                            label="취소하기"
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
                            onClick={onCancel}
                        />
                    </div>
                </DialogBox>
            )}

            {/* 2단계 - 비밀번호 입력 (이메일 유저만 도달 가능) */}
            {step === 'password' && (
                <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
                    <p className="text-[13px] font-bold text-center m-0">현재 비밀번호를 입력하세요</p>

                    {/* 입력창 배경 이미지 위에 투명하게 겹쳐서 배치 */}
                    <div className="w-[90%] mb-[2%]">
                        <InputField
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            textAlign="center"
                        />
                    </div>

                    {/* 취소하기&확인 버튼 영역 */}
                    <div className="flex gap-[5%] justify-center w-full">
                        <ImageButton
                            label="취소하기"
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
                            onClick={onCancel}
                        />
                        <ImageButton
                            label="확인"
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
                            onClick={() => onConfirm(password)}
                        />
                    </div>
                </DialogBox>
            )}
        </>
    );
};

export default WithdrawalDialog;