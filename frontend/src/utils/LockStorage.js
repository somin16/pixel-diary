// utils/LockStorage.js
// PIN은 절대 평문으로 저장하지 않고, 매번 랜덤 salt를 붙여 SHA-256 해시로 저장
// 실제 값(해시/salt)은 기기 로컬(Capacitor Preferences)에만 저장, 서버로는 전송하지 않음

import { Preferences } from '@capacitor/preferences';

const KEY_SALT = 'pixeldiary_lock_salt';
const KEY_HASH = 'pixeldiary_lock_hash';
const KEY_SETTINGS = 'pixeldiary_lock_settings';

// ArrayBuffer -> 16진수 문자열 변환
function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// PIN마다 매번 다른 16바이트 랜덤 salt 생성
// crypto.getRandomValues 사용 (Math.random은 예측 가능해서 보안 용도로 쓰면 안 됨)
function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes.buffer);
}

// SHA-256 해시 계산 (Web Crypto API의 SubtleCrypto 사용)
// 주의: crypto.subtle은 secure context(https 또는 로컬호스트/네이티브 웹뷰)에서만 동작
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

// PIN이 설정되어 있는지 여부 확인 (해시 존재 여부로 판단, 값 자체는 검증 안 함)
export async function isPinSet() {
  const { value } = await Preferences.get({ key: KEY_HASH });
  return !!value;
}

// 새 PIN 저장 (최초 설정 / 변경 모두 이 함수 하나로 처리)
// 호출할 때마다 salt를 새로 생성하기 때문에, PIN 값이 같아도 저장되는 해시는 매번 달라짐
export async function savePin(pin) {
  const salt = randomSalt();
  const hash = await sha256(salt + pin); // salt + pin 순서는 verifyPin과 반드시 동일해야 함
  await Preferences.set({ key: KEY_SALT, value: salt });
  await Preferences.set({ key: KEY_HASH, value: hash });
}

// 입력받은 PIN이 저장된 salt/해시와 일치하는지 검증
// salt/해시를 Promise.all로 동시에 조회 (순차 조회 대비 왕복 시간 절약)
// 둘 중 하나라도 없으면(=PIN 미설정 상태) 예외를 던지지 않고 그냥 false로 처리
export async function verifyPin(pin) {
  const [{ value: salt }, { value: storedHash }] = await Promise.all([
    Preferences.get({ key: KEY_SALT }),
    Preferences.get({ key: KEY_HASH }),
  ]);
  if (!salt || !storedHash) return false;
  const hash = await sha256(salt + pin);
  return hash === storedHash;
}

// 저장된 salt/해시 삭제 (앱 잠금 자체를 끌 때 사용)
// 이 함수는 salt/해시만 지우고 lockEnabled 등 설정값은 안 건드리므로,
// 호출하는 쪽(useAppLockStore의 disableLock)에서 setLockSettings로 잠금 자체도 꺼줘야 함
export async function clearPin() {
  await Preferences.remove({ key: KEY_SALT });
  await Preferences.remove({ key: KEY_HASH });
}

const DEFAULT_SETTINGS = {
  lockEnabled: false,       // 앱 잠금 기능 자체를 쓰는지 여부
  biometricEnabled: false,  // PIN 검증 외에 생체인증도 허용할지 여부
  gracePeriodMs: 0,         // 백그라운드에 이 시간(ms) 이상 있다가 돌아오면 다시 잠금, 0이면 항상 즉시 잠금
};

// 저장된 잠금 설정값 조회, 없거나 파싱 실패 시 기본값 반환
export async function getLockSettings() {
  const { value } = await Preferences.get({ key: KEY_SETTINGS });
  if (!value) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// 잠금 설정값 일부 업데이트 (나머지 값은 기존 설정 유지)
// 현재 저장된 설정 전체를 먼저 읽어온 뒤, partial로 넘어온 필드만 덮어써서 다시 저장
export async function setLockSettings(partial) {
  const current = await getLockSettings();
  const next = { ...current, ...partial };
  await Preferences.set({ key: KEY_SETTINGS, value: JSON.stringify(next) });
  return next;
}

// ---- PIN 시도 횟수 / 잠금(쿨다운) 상태 ----
// 스마트폰 잠금화면처럼, 연속으로 틀리면 일정 시간 재시도를 막기 위한 상태
// 앱을 강제 종료했다가 다시 켜도 우회 못 하도록 기기 로컬에 영속 저장
 
const KEY_ATTEMPTS = 'pixeldiary_lock_attempts';
 
const DEFAULT_ATTEMPT_STATE = {
  failCount: 0, // 연속 실패 횟수 (성공하거나 쿨다운이 걸리면 0으로 리셋)
  lockedUntil: 0, // 이 시각(ms epoch) 전까지는 재시도 불가, 0이면 잠금 없음
};
 
// 저장된 시도 상태 조회, 없거나 손상됐으면 기본값 반환
export async function getAttemptState() {
  const { value } = await Preferences.get({ key: KEY_ATTEMPTS });
  if (!value) return { ...DEFAULT_ATTEMPT_STATE };
  try {
    return { ...DEFAULT_ATTEMPT_STATE, ...JSON.parse(value) };
  } catch {
    return { ...DEFAULT_ATTEMPT_STATE };
  }
}
 
// 시도 상태 일부 업데이트 (read-modify-write, setLockSettings와 동일한 패턴)
export async function setAttemptState(partial) {
  const current = await getAttemptState();
  const next = { ...current, ...partial };
  await Preferences.set({ key: KEY_ATTEMPTS, value: JSON.stringify(next) });
  return next;
}
 
// 시도 상태 초기화 (PIN 인증 성공 시 호출)
export async function clearAttemptState() {
  await Preferences.remove({ key: KEY_ATTEMPTS });
}
