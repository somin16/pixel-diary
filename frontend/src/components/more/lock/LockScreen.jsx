// components/more/lock/LockScreen.jsx
// 앱이 잠긴 상태일 때 화면 전체를 덮는 풀스크린 잠금 해제 화면
// PIN 입력 + (설정되어 있으면) 생체인증을 함께 제공
import { useState, useCallback, useEffect, useRef } from 'react';
import { PinPad } from './PinPad';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';

const PIN_LENGTH = 4;

// 쿨다운 종료 시각(ms epoch)까지 남은 초를 계산, 이미 지났으면 0
function secondsLeft(untilMs) {
  return Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
}

export function LockScreen({
  onUnlockWithPin,
  onUnlockWithBiometric,
  biometricAvailable,
  biometricEnabled,
  lockedUntil, // useAppLockStore가 내려주는 재시도 가능 시각(ms epoch), 0이면 쿨다운 없음
}) {
  const [pin, setPin] = useState(''); // 지금까지 입력된 PIN 자릿수
  const [error, setError] = useState(false); // 틀렸을 때 PinPad에 흔들림 등 에러 표시용 플래그
  const [wrongAttempt, setWrongAttempt] = useState(false); // "PIN이 일치하지 않습니다" 표시 여부
  const [localLockedUntil, setLocalLockedUntil] = useState(lockedUntil || 0); // 화면 자체적으로 들고 있는 쿨다운 종료 시각
  const [remaining, setRemaining] = useState(secondsLeft(lockedUntil || 0)); // 쿨다운 카운트다운 표시용 남은 초

  const currentTheme = useTheme((state) => state.currentTheme);
  const appIconUrl = getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3');

  // 부모(useAppLockStore)의 lockedUntil이 바뀌면(예: 앱 재시작 후 쿨다운 복원) 로컬 상태에도 반영
  useEffect(() => {
    setLocalLockedUntil(lockedUntil || 0);
  }, [lockedUntil]);

  // 쿨다운이 걸려있는 동안만 1초마다 남은 시간 갱신, 다 되면 자동으로 쿨다운 해제
  useEffect(() => {
    if (!localLockedUntil) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const left = secondsLeft(localLockedUntil);
      setRemaining(left);
      if (left <= 0) setLocalLockedUntil(0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [localLockedUntil]);

  const isLockedOut = localLockedUntil > Date.now(); // 지금 이 순간 쿨다운 중인지 여부

  // 사용자가 "생체 인증 사용하기"를 눌렀을 때, 그리고 화면이 처음 뜰 때 자동으로도 호출됨
  // isAuthenticatingRef: 이전 인증 세션이 안 끝났는데 새로 호출되는 걸 막기 위한 가드
  // (일부 기기에서 인증 세션이 겹치면 보안 영역 쪽 에러가 나는 경우가 있어 추가함)
  const isAuthenticatingRef = useRef(false);

  const tryBiometric = useCallback(async () => {
    if (!biometricAvailable || !biometricEnabled) return;
    if (isLockedOut) return; // PIN 쿨다운 중엔 생체인증도 같이 막음
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;
    try {
      await onUnlockWithBiometric();
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, [biometricAvailable, biometricEnabled, isLockedOut, onUnlockWithBiometric]);

  // 잠금 화면에 들어오면 생체인증이 켜져 있는 경우 자동으로 한 번 시도
  useEffect(() => {
    tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 숫자 하나 입력 처리 - 4자리 다 채워지면 그 시점에 검증까지 같이 수행
  const handleDigit = async (digit) => {
    if (isLockedOut || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    setWrongAttempt(false);

    if (next.length === PIN_LENGTH) {
      const result = await onUnlockWithPin(next);
      if (!result.ok) {
        setError(true);
        if (result.lockedUntil) {
          setLocalLockedUntil(result.lockedUntil); // 이번 시도로 새로 쿨다운 걸림 (5회 실패)
        } else {
          setWrongAttempt(true); // 단순 불일치, 아직 쿨다운은 아님
        }
        // 잠깐 에러 표시했다가 입력값 초기화 (사용자가 바로 재입력할 수 있게)
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 350);
      }
      // 성공 시엔 별도 처리 없음 - isLocked가 false로 바뀌면서 LockGate가 알아서 화면을 내려줌
    }
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  // 화면 상단 안내 문구 - 쿨다운 > 단순 불일치 > 기본 안내 순으로 우선순위
  const message = isLockedOut
    ? `잘못된 입력으로 잠금 해제하지 못했습니다.\n${remaining}초 후에 다시 시도하세요.`
    : wrongAttempt
    ? 'PIN이 일치하지 않습니다.'
    : 'PIN을 입력해주세요.';

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-start gap-3 bg-white px-6 pt-10 font-mono text-neutral-900">
      {/* 앱 아이콘 + 타이틀 */}
      <img src={appIconUrl} alt="Pixel Diary" className="h-30 w-30 mb-1 [image-rendering:pixelated]" />
        <div className="text-xl font-black tracking-[4px]" style={{ WebkitTextStroke: '0.5px currentColor' }}>
          PIXEL DIARY
        </div>

      {/* 상태별 안내 문구 - 평소엔 회색, 에러/쿨다운일 땐 빨간색 */}
      <p
        className={`mb-2 max-w-[300px] whitespace-pre-line break-keep text-center text-sm font-bold ${
          wrongAttempt || isLockedOut ? 'text-red-500' : 'text-neutral-500'
        }`}
      >
        {message}
      </p>

      {/* PIN 점 표시 + 숫자 키패드, 쿨다운 중엔 입력 자체가 비활성화됨 */}
      <PinPad
        length={PIN_LENGTH}
        value={pin}
        onDigit={handleDigit}
        onDelete={handleDelete}
        error={error}
        disabled={isLockedOut}
      />

      {/* 생체인증이 가능하고 사용자가 켜둔 경우에만 재시도 버튼 노출 */}
      {biometricAvailable && biometricEnabled && (
        <button
          type="button"
          onClick={tryBiometric}
          disabled={isLockedOut}
          className="mt-1 text-sm text-emerald-600 underline underline-offset-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          생체 인증 사용하기
        </button>
      )}
    </div>
  );
}