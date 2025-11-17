// components/app/VisitTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // 같은 경로로 중복 호출 방지 (선택사항)
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    // ✅ /admin 이하 페이지는 제외
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return;
    }

    fetch('/backend/visit/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
