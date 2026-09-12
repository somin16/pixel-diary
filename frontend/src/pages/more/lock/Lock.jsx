// pages/more/lock/Lock.jsx
// "잠금 설정" 페이지 - 앱 잠금/생체인증 켜고 끄기, PIN 설정/변경
import { useState } from 'react';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import useAppLockStore from '../../../stores/useAppLockStore';

// 컴포넌트 불러오기
import Header from '../../../components/common/Header';
import ToggleButton from '../../../components/more/notification/ToggleButton';
import { PinPad } from '../../../components/more/lock/PinPad';

const PIN_LENGTH = 4;

function Lock() {
  const currentTheme = useTheme((state) => state.currentTheme);

  // zustand - 필요한 상태/액션만 각각 구독 (LockGate도 같은 스토어를 구독해 값 동기화됨)
  const isReady = useAppLockStore((s) => s.isReady); // 초기 로딩 끝났는지
  const hasPin = useAppLockStore((s) => s.hasPin); // PIN이 설정되어 있는지
  const biometricAvailable = useAppLockStore((s) => s.biometricAvailable); // 기기가 생체인증 하드웨어를 지원하는지
  const biometricEnabled = useAppLockStore((s) => s.biometricEnabled); // 사용자가 생체인증을 켜뒀는지
  const setupLock = useAppLockStore((s) => s.setupLock); // 최초 PIN 설정 액션
  const changePin = useAppLockStore((s) => s.changePin); // 기존 PIN 변경 액션
  const disableLock = useAppLockStore((s) => s.disableLock); // PIN/생체인증 전부 초기화하고 잠금 끄는 액션
  const toggleBiometric = useAppLockStore((s) => s.toggleBiometric); // 생체인증 사용 여부만 토글하는 액션

  // PIN 설정/변경 입력 흐름 상태
  // step: null(설정 중 아님) / 'enter'(새 PIN 입력) / 'confirm'(새 PIN 재입력)
  const [step, setStep] = useState(null);
  const [pin, setPin] = useState(''); // 지금 입력 중인 PIN
  const [firstPin, setFirstPin] = useState(''); // 'enter' 단계에서 입력한 값 (confirm 단계와 비교용)
  const [mismatch, setMismatch] = useState(false); // enter/confirm 두 값이 서로 달랐는지 여부

  if (!isReady) return null; // 초기 로딩 끝나기 전엔 아무것도 안 그림 (flash 방지)

  // PIN 설정/변경 시작 - 상태 초기화하고 'enter' 단계로 진입
  const startSetup = () => {
    setMismatch(false);
    setFirstPin('');
    setPin('');
    setStep('enter');
  };

  // 키패드 숫자 입력 처리 - enter/confirm 두 단계를 이 함수 하나로 처리
  const handleDigit = async (d) => {
    if (pin.length >= PIN_LENGTH) return;
    if (mismatch) setMismatch(false); // 다시 입력 시작하면 이전 "불일치" 표시부터 지움
    const next = pin + d;
    setPin(next);
    if (next.length !== PIN_LENGTH) return;

    if (step === 'enter') {
      // 첫 입력 완료 - 값을 기억해두고 재입력(confirm) 단계로 이동
      setFirstPin(next);
      setStep('confirm');
      setPin('');
      return;
    }

    // step === 'confirm' - 재입력값을 첫 입력값과 비교
    if (next !== firstPin) {
      setMismatch(true);
      setStep('enter'); // 처음부터 다시
      setPin('');
      return;
    }
    // 일치하면 실제 저장 - 최초 설정이면 setupLock, 이미 PIN이 있었으면 changePin
    setMismatch(false);
    if (!hasPin) await setupLock(next);
    else await changePin(next);
    setStep(null);
    setPin('');
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  // 취소 버튼 / 오버레이 클릭 - PIN 설정/변경을 취소하고 오버레이 닫기
  const handleCancelPinEntry = () => {
    setStep(null);
    setPin('');
    setFirstPin('');
    setMismatch(false);
  };

  // ToggleButton
  const handleToggleLock = async () => {
    if (!hasPin) {
      startSetup();
    } else {
      setStep(null);
      await disableLock();
    }
  };

  const handleToggleBiometric = () => {
    toggleBiometric(!biometricEnabled);
  };

  return (
    <div
      className="w-full h-screen overflow-hidden pt-[16%] pb-[8%] flex flex-col bg-[length:100%_100%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`
      }}
    >

      {/* 상단 헤더 */}
      <Header title="잠금 설정" />

      {/* 메인 컨텐츠 영역 */}
      <div className="w-full px-[6%] flex flex-col items-center mt-[5%]">

        {/* 앱 잠금 사용 박스 */}
        <div className="relative w-full">
          <img
            src={getAssetUrl(currentTheme, 'boxes', 'alarm_all_list_box_x3')}
            alt="앱 잠금 배경"
            className="relative w-full h-auto block"
          />
          <span className="absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-sm font-bold text-black whitespace-nowrap">
            앱 잠금 사용
          </span>

          {/* 이미 PIN이 설정되어 있고 지금 설정 중이 아닐 때만 "PIN 변경하기" 노출 */}
          {hasPin && !step && (
            <button
              type="button"
              onClick={startSetup}
              className="absolute z-10 top-1/2 -translate-y-1/2 left-[31%] text-xs font-bold text-neutral-500 underline whitespace-nowrap"
            >
              PIN 변경하기
            </button>
          )}

          <ToggleButton id="lock" isOn={hasPin} onClick={handleToggleLock} />
        </div>

        {/* 생체인증 박스 - 기기가 지원하고, PIN이 이미 설정되어 있을 때만 노출 (PIN 없이는 생체인증도 못 씀) */}
        {biometricAvailable && hasPin && (
          <div className="relative w-full mt-[4%]">
            <img
              src={getAssetUrl(currentTheme, 'boxes', 'alarm_all_list_box_x3')}
              alt="생체인증 배경"
              className="relative w-full h-auto block"
            />
            <span className="absolute z-10 top-1/2 -translate-y-1/2 left-[6%] text-sm font-bold text-black whitespace-nowrap">
              생체 인증으로 잠금 해제
            </span>

            <ToggleButton id="biometric" isOn={biometricEnabled} onClick={handleToggleBiometric} />
          </div>
        )}

        {/* PIN 설정/변경용 키패드 */}
        {step && (
          // 배경(오버레이) 클릭 시 취소
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-6"
            onClick={handleCancelPinEntry}
          >
            <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              {/* 배경 이미지 */}
              <img
                src={getAssetUrl(currentTheme, 'boxes', 'announcement_alarm_page_box_x3')}
                alt=""
                className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
              />

              {/* 취소 버튼 */}
              <button
                type="button"
                onClick={handleCancelPinEntry}
                aria-label="PIN 설정 취소"
                className="absolute -top-10 right-2 z-20 h-8 w-8"
              >
                <img
                  src={getAssetUrl(currentTheme, 'icons', 'close_icon_x3')}
                  alt=""
                  className="h-full w-full [image-rendering:pixelated]"
                />
              </button>

              <div className="relative z-10 flex flex-col items-center gap-6 px-8 py-14">
                {/* 안내 문구 - 불일치 > enter 단계 > confirm 단계 순으로 우선순위 */}
                <p className={`-mt-6 text-sm font-bold ${mismatch ? 'text-red-500' : 'text-neutral-900'}`}>
                  {mismatch
                    ? 'PIN이 서로 달라요. 다시 입력해주세요.'
                    : step === 'enter'
                    ? '새 PIN 4자리를 입력하세요'
                    : '확인을 위해 한 번 더 입력하세요'}
                </p>
                <PinPad length={PIN_LENGTH} value={pin} onDigit={handleDigit} onDelete={handleDelete} error={false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lock;