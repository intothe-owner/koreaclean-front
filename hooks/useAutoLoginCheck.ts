// hooks/useAutoLoginCheck.ts
'use client';

import { fetchWithAuth } from '@/lib/fetchWitgAuth';
import { useEffect, useState } from 'react';

type Result = {
  loading: boolean;
  authed: boolean;
  method: 'none' | 'access' | 'refresh';
  user?: any;
  error?: string;
};

export default function useAutoLoginCheck(): Result {
  const [state, setState] = useState<Result>({
    loading: true,
    authed: false,
    method: 'none',
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        // 1) access로 바로 확인
        const me = await fetchWithAuth(`/backend/users/me`, { credentials: 'include' });
        if (me.ok) {
          const j = await me.json();
          if (!mounted) return;
          setState({ loading: false, authed: true, method: 'access', user: j?.data?.user });
          return;
        }

        // 2) access 실패 → refresh 시도
        const rf = await fetchWithAuth(`/backend/users/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (rf.ok) {
          // 새 access 발급됨 → 다시 me
          const me2 = await fetchWithAuth(`/backend/users/me`, { credentials: 'include' });
          if (me2.ok) {
            const j2 = await me2.json();
            if (!mounted) return;
            setState({ loading: false, authed: true, method: 'refresh', user: j2?.data?.user });
            return;
          }
        }
        const data = await rf.json();
        console.log(data);

        // 3) 전부 실패
        if (!mounted) return;
        setState({ loading: false, authed: false, method: 'none' });
      } catch (e: any) {
        if (!mounted) return;
        setState({ loading: false, authed: false, method: 'none', error: e?.message });
      }
    };

    run();
    return () => { mounted = false; };
  }, []);

  return state;
}
