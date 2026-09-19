// components/more/lock/LockGate.jsx
// 앱 최상단(라우터)을 감싸서, 잠긴 상태면 LockScreen을 대신 보여주는 게이트 역할
import { useEffect } from 'react';
import useAppLockStore from '../../../stores/useAppLockStore';
import { LockScreen } from './LockScreen';

export function LockGate({ children }) {
  const isReady = useAppLockStore((s) => s.isReady);
  const hasPin = useAppLockStore((s) => s.hasPin);
  const isLocked = useAppLockStore((s) => s.isLocked);
  const biometricAvailable = useAppLockStore((s) => s.biometricAvailable);
  const biometricEnabled = useAppLockStore((s) => s.biometricEnabled);
  const lockedUntil = useAppLockStore((s) => s.lockedUntil);
  const unlockWithPin = useAppLockStore((s) => s.unlockWithPin);
  const unlockWithBiometric = useAppLockStore((s) => s.unlockWithBiometric);

  useEffect(() => {
    useAppLockStore.getState().init();
  }, []);

  // 초기 로딩 중 - 잠긴 콘텐츠가 잠깐 노출되는 flash 방지
  if (!isReady) return null;

  // 잠금 자체를 설정 안 했거나, 지금은 잠겨있지 않은 상태면 그대로 통과
  if (!hasPin || !isLocked) return children;

  // 잠긴 상태 - 실제 화면 대신 LockScreen을 렌더링하고, 필요한 상태/함수를 그대로 props로 전달
  return (
    <LockScreen
      onUnlockWithPin={unlockWithPin}
      onUnlockWithBiometric={unlockWithBiometric}
      biometricAvailable={biometricAvailable}
      biometricEnabled={biometricEnabled}
      lockedUntil={lockedUntil}
    />
  );
}