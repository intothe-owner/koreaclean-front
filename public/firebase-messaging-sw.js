// /firebase-messaging-sw.js  (반드시 사이트 루트 경로)
const SW_VERSION = 'v3';  // 변경하고 저장 → 새 버전이 보이면 SW가 갱신된 것
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
const config = {
  apiKey: "AIzaSyDEKi1-vgVSuOrzw2xWiCRAOg0ibVp0m7w",
  authDomain: "koreaclean1-777e4.firebaseapp.com",
  projectId: "koreaclean1-777e4",
  storageBucket: "koreaclean1-777e4.firebasestorage.app",
  messagingSenderId: "33020294721",
  appId: "1:33020294721:web:9a6247ebb384103c49f8c0",
  measurementId: "G-H44X646JC4"
}

// ✅ 웹앱(firebaseConfig) - 프론트에서 쓰는 값과 "같은 프로젝트"여야 함
firebase.initializeApp(config);

// v9 compat
const messaging = firebase.messaging();

// 백그라운드 수신 시 직접 알림 표시
messaging.onBackgroundMessage(async (payload) => {
  console.log('[SW] onBackgroundMessage:', payload);

  const title = payload.notification?.title || '알림';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',      // public에 파일 하나 두세요 (404 방지)
    data: payload?.data || {},            // click_url 등
  };

  try {
    await self.registration.showNotification(title, options);
    console.log('[SW] showNotification: shown');
  } catch (e) {
    console.error('[SW] showNotification ERROR:', e);
  }
});

// 알림 클릭 시 URL 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification?.data && event.notification.data.click_url) || '/';
  event.waitUntil(clients.openWindow(url));
});