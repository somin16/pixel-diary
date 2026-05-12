import React, { useState, useEffect } from "react";
import { useTheme } from '../../../store/useThemeStore'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기
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

  // 에러 메시지 상태 관리
  const [error, setError] = useState("");

  // 입력값이 바뀔 때 에러를 초기화해주는 함수
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError("");
  };

  // 1단계: 현재 비밀번호 확인 후 다음 단계로 넘어가기
  const handleNextStep = () => {
    if (!currentPw) {
      setError("현재 비밀번호를 입력해주세요");
      return;
    }
    // TODO: 여기서 현재 비밀번호가 맞는지 서버 검증 API 호출
    setError(""); // 성공 시 에러 초기화
    setStep('new');
  };

  // 2단계: 최종 변경 확인
  const handleSubmit = () => {
    if (!newPw || !confirmNewPw) {
      setError("새로운 비밀번호를 모두 입력해주세요"); 
      return;
    }
    if (newPw !== confirmNewPw) {
      setError("새로운 비밀번호가 일치하지 않습니다"); 
      return;
    }
    
    // 최종 확인 시 부모 컴포넌트(Account.jsx)로 데이터 전달
    // API 연동을 위해 현재 비번과 새 비번을 같이 넘김
    setError("");
    onConfirm({ currentPw, newPw });
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

          {/* 에러 메시지 표시 영역 - 에러가 있을 때만 렌더링되어 공간 차지 */}
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
              onChange={handleInputChange(setNewPw)}
              placeholder="새로운 비밀번호"
              textAlign="center"
            />
            <InputField 
              type="password"
              value={confirmNewPw}
              onChange={handleInputChange(setConfirmNewPw)}
              placeholder="새로운 비밀번호"
              textAlign="center"
            />
          </div>

          {/* 에러 메시지 표시 영역 - 에러가 있을 때만 렌더링되어 공간 차지 */}
          {error && (
            <div className="flex items-center justify-center mt-[2%] mb-[1%]">
              <p className="text-[#ef4444] text-[11px] font-bold m-0">{error}</p>
            </div>
          )}

          <div className={`flex gap-[3%] justify-center w-full ${!error ? 'mt-[3%]' : 'mt-[1%]'}`}>
            <ImageButton
              label="취소하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
              onClick={onCancel}
            />
            <ImageButton
              label="변경하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
              onClick={handleSubmit}
            />
          </div>
        </DialogBox>
      )}
    </>
  );
};

export default PasswordChangeDialog;