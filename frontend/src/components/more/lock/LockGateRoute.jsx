// components/more/lock/LockGateRoute.jsx
// <Routes> 안에서 레이아웃 라우트로 쓰기 위한 어댑터
// LockGate는 {children} prop을 받지만, 중첩 라우트는 <Outlet />으로 하위 라우트를 그려야 해서
// 그 사이를 이어주는 컴포넌트 (AppShell을 layout route로 쓰는 것과 같은 패턴)
import { Outlet } from 'react-router-dom';
import { LockGate } from './LockGate';

export function LockGateRoute() {
  return (
    <LockGate>
      <Outlet />
    </LockGate>
  );
}
