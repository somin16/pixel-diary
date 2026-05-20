import React, { useState, useEffect } from "react";
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
import AuthValidator from '../../../utils/AuthValidator';
import { supabase } from "../../../utils/SupabaseClient"; // supabase 불러오기

// 컴포넌트 불러오기
import DialogBox from '../../common/dialog/DialogBox';
import ImageButton from '../../common/ImageButton';
import InputField from '../auth/InputField';

const PasswordChangeDialog = ({ onConfirm, onCancel, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);
  
  // 'current' (현재 비번 입력) -> 'new' (새 비번 입력) 상태 관리
  const [step, setStep] = useState('current'); 
  
  // 입력값 상태 관리
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");

  // 에러 및 성공 메시지 상태 관리
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 
  const [loading, setLoading] = useState(false);

  // 입력값이 바뀔 때 에러를 초기화해주는 함수
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError("");
  };

  // 새 비밀번호 입력 시 AuthValidator로 실시간 유효성 검사
  const handleNewPwChange = (e) => {
    const val = e.target.value;
    setNewPw(val);
    setError("");
    setSuccessMsg("");

    // 유틸 클래스의 메서드로 실시간 검사 진행
    const result = AuthValidator.validatePassword(val);
    
    // 조건 만족 시 "안전한 비밀번호입니다." 문구 띄우기
    if (result.state === 'success') {
      setSuccessMsg(result.message);
    }
  };

  // 재확인 비밀번호 입력 시 에러 초기화
  const handleConfirmPwChange = (e) => {
    setConfirmNewPw(e.target.value);
    if (error) setError("");
  };

  // 1단계: 현재 비밀번호 확인 후 다음 단계로 넘어가기
  const handleNextStep = () => {
    if (!currentPw) {
      setError("현재 비밀번호를 입력해주세요");
      return;
    }
    setError(""); // 성공 시 에러 초기화
    setStep('new');
  };

  // 2단계: 최종 변경 확인
  const handleSubmit = async () => {
    // 1. 필수 미입력 검사
    if (!newPw || !confirmNewPw) {
      setError("새로운 비밀번호를 모두 입력해주세요"); 
      return;
    }

    // 2. AuthValidator로 새 비밀번호 최종 유효성 검사 (길이, 영문, 숫자, 특수문자 조합 전체)
    const pwValidation = AuthValidator.validatePassword(newPw);
    if (pwValidation.state === 'error') {
      setError(pwValidation.message); // "최소 8자 이상", "영문, 숫자... 포함해야 합니다"
      return;
    }

    // 3. AuthValidator로 두 비밀번호가 일치하는지 검사
    const confirmValidation = AuthValidator.validateConfirmPassword(newPw, confirmNewPw);
    if (confirmValidation.state === 'error') {
      setError(confirmValidation.message); // "비밀번호가 일치하지 않습니다."
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // 부모 컴포넌트(Account.jsx)의 비밀번호 변경 API 함수 실행
      await onConfirm({ currentPw, newPw });
      
    } catch (errMessage) {
      // 4. 현재 비밀번호와 일치하지 않는다는 장고 서버 에러가 올 때 처리
      const message = typeof errMessage === 'string' 
        ? errMessage 
        : "현재 비밀번호와 일치하지 않습니다";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1단계 - 현재 비밀번호 입력 */}
      {step === 'current' && (
        <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
          <p className="text-[13px] font-bold text-center m-0">현재 비밀번호를 입력하세요</p>
          
          <div className="w-[90%] mt-[2%]">
            <InputField 
              type="password"
              value={currentPw}
              onChange={handleInputChange(setCurrentPw)}
              placeholder="현재 비밀번호"
              textAlign="center"
            />
          </div>

          {/* 에러 메시지 표시 영역 */}
          {error && (
            <div className="flex items-center justify-center mt-[2%] mb-[1%]">
              <p className="text-[#ef4444] text-[11px] font-bold m-0">{error}</p>
            </div>
          )}

          {/* 에러가 없을 때를 대비해 버튼 영역에 약간의 상단 여백 추가 */}
          <div className={`flex gap-[5%] justify-center w-full ${!error ? 'mt-[3%]' : 'mt-[1%]'}`}>
            <ImageButton
              label="취소하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
              onClick={onCancel}
            />
            <ImageButton
              label="확인"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
              onClick={handleNextStep}
            />
          </div>
        </DialogBox>
      )}

      {/* 2단계 - 새로운 비밀번호 입력 */}
      {step === 'new' && (
        <DialogBox boxImageName="popup_message_box_long_x3" width={width} maxWidth={maxWidth}>
          <p className="text-[13px] font-bold text-center m-0 mt-[5%]">새로운 비밀번호를 입력하세요</p>
          
          <div className="w-[90%] flex flex-col gap-[9%] mt-[2%]">
            <InputField 
              type="password"
              value={newPw}
              onChange={handleNewPwChange} 
              placeholder="새로운 비밀번호"
              textAlign="center"
            />
            <InputField 
              type="password"
              value={confirmNewPw}
              onChange={handleConfirmPwChange} 
              placeholder="새로운 비밀번호 재확인"
              textAlign="center"
            />
          </div>

          {/* 에러 메시지 표시 영역 */}
          {error && (
            <div className="flex items-center justify-center mt-[2%] mb-[1%]">
              <p className="text-[#ef4444] text-[11px] font-bold m-0">{error}</p>
            </div>
          )}

          {/* 안전한 비밀번호일 경우 메세지 */}
          {successMsg && !error && (
            <div className="flex items-center justify-center mt-[2%] mb-[1%]">
              <p className="text-[#22c55e] text-[11px] font-bold m-0">{successMsg}</p>
            </div>
          )}

          <div className={`flex gap-[3%] justify-center w-full ${(!error && !successMsg) ? 'mt-[3%]' : 'mt-[1%]'}`}>
            <ImageButton
              label="취소하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
              onClick={loading ? null : onCancel}
            />
            <ImageButton
              label={loading ? "변경 중..." : "변경하기"}
              imageSrc={getAssetUrl(currentTheme, 'buttons', loading ? 'blue_button_x3' : 'green_button_x3')}
              onClick={loading ? null : handleSubmit}
            />
          </div>
        </DialogBox>
      )}
    </>
  );
};

export default PasswordChangeDialog;