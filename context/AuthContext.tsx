// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { baseUrl } from '@/lib/variable';

export type User = {
  id: number;
  email: string;
  name: string;
  inst?:string;
  contact?:string;
  phone?: string;
  role?: 'SUPER' | 'ADMIN' | 'CLIENT' | 'COMPANY';
  provider?: string;
  createdAt?: string;
  updatedAt?: string;

  /** 레거시 호환 */
  mobile?: string;
  level?: number;
  is_confirm?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  /** 인증이 필요한 fetch 래퍼: 401 시 refresh 한 번 시도 후 재요청, 그래도 실패면 자동 로그아웃 */
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  

  /** 공용 로그아웃 */
  const logout = async () => {
    try {
      await fetch(`/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      /* 서버 실패해도 클라이언트 상태만 정리 */
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthed(false);
    }
  };

  /** 세션 체크: refresh 후 me 조회. 실패 시 자동 로그아웃 */
  const checkSession = async (): Promise<boolean> => {
    try {
      // 1) 우선 access_token으로 현재 사용자 확인
    const rMe1 = await fetch(`/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    });
    if (rMe1.ok) {
      const d = await rMe1.json().catch(() => ({}));
      if (d?.is_success && d?.data?.user) {
        setUser(d.data.user);
        setIsAuthed(true);
        return true;
      }
    }

    // 2) 401 등으로 실패한 경우에만 refresh 시도
    const rRefresh = await fetch(`/api/users/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!rRefresh.ok) {
      await logout();
      return false;
    }

    // 3) refresh 성공 후 me 재호출
    const rMe2 = await fetch(`/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    });
    const d2 = await rMe2.json().catch(() => ({}));
    if (rMe2.ok && d2?.is_success && d2?.data?.user) {
      setUser(d2.data.user);
      setIsAuthed(true);
      return true;
    }

    await logout();
    return false;
    } catch {
      // 네트워크 오류 등 → 안전하게 로그아웃
      await logout();
      return false;
    }
  };

  /** 인증 fetch 래퍼: 401이면 refresh 시도 후 1회 재시도. 그래도 실패면 자동 로그아웃 */
  const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, { ...init, credentials: 'include' as const });
    if (res.status !== 401) return res;

    // 401 → refresh 시도
    const ok = await checkSession();
    if (!ok) return res; // checkSession이 logout 처리

    // access 갱신 후 한 번만 재시도
    return fetch(input, { ...init, credentials: 'include' as const });
  };

  // 앱 부팅 시: 세션 복구 시도 → 실패면 로그아웃
  useEffect(() => {
    (async () => {
      // 1차: 자동로그인(리프레시) 경로
      const ok = await checkSession();
      if (ok) {
        setIsLoading(false);
        return;
      }

      // 2차: 레거시 로컬 저장소 경로 (이전 방식 호환)
      try {
        const token = localStorage.getItem('access_token');

        const rawUser = localStorage.getItem('user');
        if (token && rawUser) {
          setUser(JSON.parse(rawUser));
          setIsAuthed(true);
        }
      } catch {
        /* noop */
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 포커스 복귀 시 세션 재확인 (만료 시 자동 로그아웃)
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState === 'visible' && isAuthed) {
        // 현재 로그인 상태에서만 확인 (불필요 호출 방지)
        const ok = await checkSession();
        if (!ok) {
          // 이미 logout 처리됨
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // (선택) 주기적 헬스체크: 5분마다 세션 확인
  useEffect(() => {
    if (!isAuthed) return;
    const id = window.setInterval(() => {
      checkSession();
    }, 60 * 60 * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // 쿠키 인증: token 없어도 로그인 처리 가능
  const login = (u: User, token?: string) => {
    
    if (token) localStorage.setItem('access_token', token); // (레거시 호환)
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    setIsAuthed(true);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthed, isLoading, login, logout, fetchWithAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
