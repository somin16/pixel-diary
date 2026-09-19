import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { authApi } from '../api/authApi';

let listenersAdded = false;

export async function initPush() {
  if (!Capacitor.isNativePlatform()) return;
  console.log('[push] initPush 시작');

  if (!listenersAdded) {
    listenersAdded = true;
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[push] 토큰 발급:', token.value);
      try {
        await authApi.registerFcmToken(token.value);
        console.log('[push] 서버 등록 완료');
      } catch (err) {
        console.error('[push] 서버 등록 실패:', err);
      }
    });
    await PushNotifications.addListener('registrationError', (e) =>
      console.error('[push] 등록 실패:', JSON.stringify(e))
    );
  }

  let perm = await PushNotifications.checkPermissions();
  console.log('[push] 권한:', perm.receive);
  if (perm.receive !== 'granted') perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();
  console.log('[push] register() 호출 완료');
}