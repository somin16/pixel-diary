// components/more/lock/PinResetDialog.jsx
// "PIN을 잊어버리셨나요?" 다이얼로그 - 계정 이메일로 인증번호(OTP) 발송 후 확인
// 실제 API 호출(발송/검증)은 부모(LockScreen)가 담당, 이 컴포넌트는 UI 흐름만 담당
import { useState, useEffect, useRef } from "react";
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

import DialogBox from '../../common/dialog/DialogBox';
import ImageButton from '../../common/ImageButton';
import InputField from '../auth/InputField';

/**
 * PinResetDialog (PIN 재설정 다이얼로그)
 * 1단계(안내 + 인증번호 발송) → 2단계(인증번호 검증) 후 PIN 초기화
 * @param {function} onConfirm - 인증번호 제출 시 실행. 번호 문자열 전달, 실패 시 reject(메시지)
 * @param {function} onSendCode - 인증번호 발송 함수 (Promise, 실패 시 reject)
 * @param {function} onCancel - '취소하기' 클릭 시 팝업을 닫는 함수
 * @param {string} [width="100%"]
 * @param {string} [maxWidth="320px"]
 */

const RESEND_COOLDOWN = 60; // Supabase OTP 재발송 60초에 1번으로 제한

const PinResetDialog = ({ onConfirm, onSendCode, onCancel, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);
  // 'intro'(안내+발송) | 'code'(인증번호 입력)
  const [step, setStep] = useState('intro');
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  // 재발송 쿨다운 타이머 - cooldown이 0보다 크면 1초마다 감소
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  // 인증번호 발송 - 쿨다운 및 발송 중 상태 관리
  const handleSendCode = async () => {
    if (sending || cooldown > 0) return;
    try {
      setSending(true);
      setError("");
      await onSendCode();
      setCooldown(RESEND_COOLDOWN);
      setStep('code'); // 발송 성공해야 다음 단계로
    } catch (errMessage) {
      setError(typeof errMessage === 'string' ? errMessage : '인증번호 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 최종 확인 버튼 클릭 시 실행
  const handleCodeSubmit = async () => {
    if (!code || !code.trim()) {
      setError("인증번호를 입력해주세요");
      return;
    }
    try {
      setError("");
      await onConfirm(code);
    } catch (errMessage) {
      setError(typeof errMessage === 'string' ? errMessage : '인증번호가 올바르지 않습니다.');
    }
  };

  return (
    <>
      {/* 1단계 - 안내 + 발송 */}
      {step === 'intro' && (
        <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
          <div className="flex flex-col items-center mt-[8%] gap-[20%]">
            <p className="text-xs font-bold text-center m-0">
              PIN 재설정을 위해<br />이메일로 인증번호를 보내드릴게요.
            </p>
          </div>

          {error && (
            <div className="flex items-center justify-center mt-[1%] mb-[1%]">
              <p className="text-[#ef4444] text-[10px] font-bold m-0">{error}</p>
            </div>
          )}

          <div className="flex gap-[5%] justify-center w-full">
            <ImageButton
              label="취소하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
              onClick={onCancel}
              disabled={sending}
            />
            <ImageButton
              label={sending ? '발송 중...' : '인증번호 보내기'}
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
              onClick={handleSendCode}
              disabled={sending}
            />
          </div>
        </DialogBox>
      )}

      {/* 2단계 - 인증번호 입력 */}
      {step === 'code' && (
        <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
          <p className="text-xs font-bold text-center m-0">이메일로 전송된 인증번호를 입력하세요</p>

          <div className="w-[90%] mb-[2%]">
            <InputField
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); if (error) setError(""); }}
              placeholder="인증번호 8자리"
              maxLength={8}
              textAlign="center"
            />
          </div>

          {/* 재발송 버튼 - 60초 쿨다운, 발송 중에는 비활성화 */}
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sending || cooldown > 0}
            className="text-[10px] text-gray-500 underline disabled:opacity-50"
          >
            {cooldown > 0 ? `재발송 (${cooldown}초 후 가능)` : sending ? '발송 중...' : '인증번호 재발송'}
          </button>

          {error && (
            <div className="flex items-center justify-center mt-[1%] mb-[1%]">
              <p className="text-[#ef4444] text-[10px] font-bold m-0">{error}</p>
            </div>
          )}

          <div className="flex gap-[5%] justify-center w-full">
            <ImageButton
              label="취소하기"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
              onClick={onCancel}
              disabled={sending}
            />
            <ImageButton
              label="확인"
              imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
              onClick={handleCodeSubmit}
              disabled={sending}
            />
          </div>
        </DialogBox>
      )}
    </>
  );
};

export default PinResetDialog;