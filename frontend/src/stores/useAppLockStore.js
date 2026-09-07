// stores/useAppLockStore.js
// LockGate, 설정 화면 등 여러 곳에서 같은 잠금 상태를 공유하는 zustand 스토어
import { create } from 'zustand';
import { App } from '@capacitor/app';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import {
  isPinSet,
  savePin,
  verifyPin,
  clearPin,
  getLockSettings,
  setLockSettings,
  getAttemptState,
  setAttemptState,
  clearAttemptState,
} from '../utils/LockStorage';

const MAX_ATTEMPTS = 5; // 연속 실패 허용 횟수
const LOCKOUT_MS = 30 * 1000; // 잠금(쿨다운) 지속 시간

// 모듈 스코프 변수 - 여러 컴포넌트가 이 스토어를 구독해도 초기화/리스너 등록은 한 번만 실행
let backgroundedAt = null;  // 마지막으로 백그라운드로 넘어간 시각
let appStateListenerAttached = false;  // appStateChange 리스너 중복 등록 방지
let didInit = false;  // init() 중복 실행 방지

const useAppLockStore = create((set, get) => ({
  isReady: false,  // 초기 로딩이 끝났는지 (콘텐츠 flash 방지용)
  hasPin: false,  // PIN이 설정되어 있는지 여부
  isLocked: false,  // 지금 LockScreen을 보여줘야 하는 상태인지 여부
  biometricEnabled: false,  // 사용자가 설정에서 생체인증을 켜뒀는지 여부
  biometricAvailable: false,  // 기기가 생체인증 하드웨어 자체를 지원하는지 여부
  lockedUntil: 0,  // PIN 재시도 가능 시각(ms epoch), 0이면 쿨다운 없음

  // 앱 전체에서 딱 한 번만 실행 - LockGate, 설정 화면 등 여러 곳에서 불러도 중복 실행 안 됨
  init: async () => {
    if (didInit) return;
    didInit = true;

    // PIN 설정 여부 + 잠금 설정값 + 실패 시도 상태를 한 번에 조회
    const [pinSet, settings, attempt] = await Promise.all([
      isPinSet(),
      getLockSettings(),
      getAttemptState(),
    ]);

    // 저장된 쿨다운이 아직 유효하면 복원, 이미 끝나있었다면 남은 기록 정리
    let lockedUntil = 0;
    if (attempt.lockedUntil > Date.now()) {
      lockedUntil = attempt.lockedUntil;
    } else if (attempt.lockedUntil) {
      await clearAttemptState();
    }

    // 생체인증 하드웨어 지원 여부 확인, 예외 발생 시 미지원으로 간주
    let biometricAvailable = false;
    try {
      const result = await NativeBiometric.isAvailable();
      biometricAvailable = !!result.isAvailable;
    } catch {
      biometricAvailable = false;
    }

    // 지금까지 조회한 값을 한 번에 반영
    set({
      hasPin: pinSet,
      biometricEnabled: settings.biometricEnabled,
      isLocked: pinSet && settings.lockEnabled,
      lockedUntil,
      biometricAvailable,
      isReady: true,
    });

    // 백그라운드 → 포그라운드 복귀 감지, 잠금 설정이 켜져 있으면 재잠금
    if (!appStateListenerAttached) {
      appStateListenerAttached = true;
      await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          backgroundedAt = Date.now();
          return;
        }
        (async () => {
          const currentSettings = await getLockSettings();
          if (!currentSettings.lockEnabled) return;
          const elapsed = backgroundedAt ? Date.now() - backgroundedAt : Infinity;
          if (elapsed >= currentSettings.gracePeriodMs) set({ isLocked: true });
        })();
      });
    }
  },

  // PIN 검증 + 실패 횟수/쿨다운 처리
  // 반환값: { ok, lockedUntil } — lockedUntil이 0보다 크면 이번 시도로 쿨다운이 새로 걸린 것
  unlockWithPin: async (pin) => {
    const attempt = await getAttemptState();
    const now = Date.now();

    // 이미 쿨다운 중이면 검증 자체를 시도하지 않고 즉시 반환
    if (attempt.lockedUntil > now) {
      set({ lockedUntil: attempt.lockedUntil });
      return { ok: false, lockedUntil: attempt.lockedUntil };
    }

    const ok = await verifyPin(pin);
    if (ok) {
      await clearAttemptState();
      set({ lockedUntil: 0, isLocked: false });
      return { ok: true, lockedUntil: 0 };
    }

    // 실패 시 카운트 증가, 임계치 도달하면 새 쿨다운 시작
    const failCount = attempt.failCount + 1;
    if (failCount >= MAX_ATTEMPTS) {
      const newLockedUntil = now + LOCKOUT_MS;
      await setAttemptState({ failCount: 0, lockedUntil: newLockedUntil });
      set({ lockedUntil: newLockedUntil });
      return { ok: false, lockedUntil: newLockedUntil };
    }

    await setAttemptState({ failCount, lockedUntil: 0 });
    return { ok: false, lockedUntil: 0 };
  },

  // OS 생체인증 프롬프트 호출, 성공하면 PIN 실패 기록도 함께 초기화
  unlockWithBiometric: async () => {
    try {
      await NativeBiometric.verifyIdentity({
        reason: '일기를 보려면 인증이 필요해요',
        title: '잠금 해제',
      });
      await clearAttemptState();
      set({ lockedUntil: 0, isLocked: false });
      return true;
    } catch {
      return false; // 인증 실패 또는 사용자 취소
    }
  },

  // 최초 PIN 설정 - salt/해시 저장, 잠금 기능 켜기, 기존 실패 기록 초기화
  setupLock: async (pin) => {
    await savePin(pin);
    await setLockSettings({ lockEnabled: true });
    await clearAttemptState();
    set({ hasPin: true, lockedUntil: 0, isLocked: false });
  },

  // 기존 PIN 변경 - 새 salt/해시로 통째로 교체, 실패 기록도 같이 초기화
  changePin: async (newPin) => {
    await savePin(newPin);
    await clearAttemptState();
    set({ lockedUntil: 0 });
  },

  // 앱 잠금 완전히 끄기 - salt/해시, 잠금 설정, 실패 기록까지 전부 정리
  disableLock: async () => {
    await clearPin();
    await setLockSettings({ lockEnabled: false, biometricEnabled: false });
    await clearAttemptState();
    set({ hasPin: false, biometricEnabled: false, lockedUntil: 0, isLocked: false });
  },

  // 생체인증 사용 여부만 토글 (PIN 설정 자체는 안 건드림)
  toggleBiometric: async (enabled) => {
    await setLockSettings({ biometricEnabled: enabled });
    set({ biometricEnabled: enabled });
  },

  // 외부에서 강제로 즉시 잠금 상태로 전환할 때 사용 (예: "지금 잠그기" 버튼)
  lockNow: () => set({ isLocked: true }),
}));

export default useAppLockStore;