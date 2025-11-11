import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from './firebase';

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;

export async function issueFcmToken(swPath = '/firebase-messaging-sw.js') {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return { token: null, reason: 'unsupported' as const };

  const permission = await Notification.requestPermission(); // 'granted'|'denied'|'default'
  if (permission !== 'granted') return { token: null, reason: permission };

  const reg = await navigator.serviceWorker.register(swPath);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
  return { token, reason: 'granted' as const };
}

export async function listenForeground(cb: (payload: any) => void) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  const unsub = onMessage(messaging, (p) => cb(p));
  return unsub;
}
