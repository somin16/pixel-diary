import React, { useState } from "react";
import { useTheme } from '../../../hooks/useTheme'; // useTheme 불러오기
import { getAssetUrl } from "../../../utils/AssetHelper"; // 헬퍼 불러오기

// 컴포넌트 불러오기
import DialogBox from '../../common/dialog/DialogBox';
import ImageButton from '../../common/ImageButton';
import InputField from '../auth/InputField';

/**
 * WithdrawalDialog (회원 탈퇴 다이얼로그)
 * 1단계(의사 확인)와 2단계(비밀번호 검증) 과정을 거쳐 회원 탈퇴를 진행
 * @param {function} onConfirm - 최종 비밀번호 입력 후 '확인' 클릭 시 실행 (password 인자 전달)
 * @param {function} onCancel - '취소하기' 클릭 시 팝업을 닫는 함수
 */

const WithdrawalDialog = ({ onConfirm, onCancel }) => {
  // 테마 전역 관리
  const currentTheme = useTheme((state) => state.currentTheme);
  // 'confirm' (탈퇴 확인) 또는 'password' (비밀번호 입력) 상태 관리
  const [step, setStep] = useState('confirm'); // 'confirm' | 'password'
  const [password, setPassword] = useState("");

  return (
    <>
      {/* 1단계 - 탈퇴 확인 */}
      {step === 'confirm' && (
        <DialogBox boxImageName="popup_message_box_x3">
          <div className="flex flex-col items-center mt-[10px] gap-2">
            <p className="text-[13px] font-bold text-center m-0">정말 탈퇴 하시겠습니까?</p>
            <p className="text-[13px] font-bold text-[#ef4444] text-center m-0 leading-tight">탈퇴 버튼 선택 시, 계정은 삭제되며 <br />복구되지 않습니다.</p>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="flex gap-[12px] justify-center w-full">
            <ImageButton
              label="회원탈퇴"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')}
              onClick={() => setStep('password')}
            />
            <ImageButton
              label="취소하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
              onClick={onCancel}
            />
          </div>
        </DialogBox>
      )}

      {/* 2단계 - 비밀번호 입력 */}
      {step === 'password' && (
        <DialogBox boxImageName="popup_message_box_x3">
          <p className="text-[13px] font-bold text-center m-0">현재 비밀번호를 입력하세요</p>
          
          {/* 입력창 배경 이미지 위에 투명하게 겹쳐서 배치 */}
          <div className="w-[90%] mb-[4px]">
          <InputField 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            textAlign="center"
          />
          </div>

          {/* 취소하기&확인 버튼 영역 */}
          <div className="flex gap-[12px] justify-center w-full">
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