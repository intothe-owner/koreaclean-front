'use client';

import { useEffect, useState } from 'react';
import { issueFcmToken, listenForeground } from '@/src/lib/fcm';

export default function PushPage() {
  const [status, setStatus] = useState<'idle'|'requesting'|'granted'|'denied'|'default'|'unsupported'|'error'>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setStatus('requesting');
      try {
        
        const { token, reason } = await issueFcmToken();
        if (!token) {
          setStatus(reason);
          setLog((l) => [`권한 상태: ${reason}`, ...l]);
          return;
        }
        setToken(token);
        setStatus('granted');

        // 서버에 토큰 등록
        const res = await fetch('/backend/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error('서버 등록 실패');

        setLog((l) => [`토큰 등록 완료: ${token.slice(0, 12)}...`, ...l]);

        // 포그라운드 수신 로그
        const unsubPromise = listenForeground((p) => {
          setLog((l) => [`[포그라운드] ${JSON.stringify(p)}`, ...l]);
        });
        return () => { unsubPromise.then((u) => u && u()); };
      } catch (e: any) {
        setStatus('error');
        setLog((l) => [`오류: ${e?.message ?? e}`, ...l]);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">브라우저 FCM 토큰 발급</h1>
      <p className="text-sm text-gray-600">이 페이지에 접속하면 자동으로 권한을 요청하고 토큰을 발급해 서버에 등록합니다.</p>

      <div className="rounded-lg border p-4">
        <div><b>상태:</b> {status}</div>
        {token && (
          <div className="mt-2">
            <b>토큰:</b>
            <textarea readOnly className="mt-1 w-full h-28 border rounded p-2 text-xs" value={token} />
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-2">로그</div>
        <ul className="space-y-1 text-sm">
          {log.map((line, i) => <li key={i} className="font-mono break-all">{line}</li>)}
        </ul>
      </div>
    </main>
  );
}
