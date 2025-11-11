// src/hooks/useAuthGuard.ts
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation'; // ✅ usePathname/useSearchParams 제거
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';

type Role = 'CLIENT' | 'COMPANY' | 'ADMIN' | 'SUPER';

type Options = {
  /** 이 페이지에 필요한 역할 (없으면 역할 검증 생략) */
  requireRoles?: Role[];

  /** 로그인된 사용자를 이 페이지에서 막고 메인으로 보낼지 (ex. 로그인/회원가입 페이지) */
  blockWhenAuthed?: boolean;

  /** 경고창 사용 (기본 true) */
  useAlert?: boolean;

  /** 미인증/권한없음 시 보낼 경로 (기본 /login). 실제 이동은 ?from=현재경로 를 붙여 전달 */
  redirectTo?: string;

  /** 로그인된 사용자 강제 보낼 경로 (기본 /) — blockWhenAuthed=true일 때 사용 */
  redirectAuthedTo?: string;

  /** 문구 커스텀 */
  messages?: {
    needLoginTitle?: string;
    needLoginText?: string;
    forbiddenTitle?: string;
    forbiddenText?: string;
    authedBlockTitle?: string;
    authedBlockText?: string;
  };

  /** true면 리디렉션/알림 없이 상태만 반환(표시만 하고 내부적으로 막지 않음) */
  soft?: boolean;
};

export function useAuthGuard(options: Options = {}) {
  const {
    requireRoles,
    blockWhenAuthed = false,
    useAlert = true,
    redirectTo = '/login',
    redirectAuthedTo = '/',
    messages,
    soft = false,
  } = options;

  const router = useRouter();
  const { data: session, status } = useSession();

  const user = session?.user as any | undefined;
  const isAuthed = status === 'authenticated' && !!user;

  const roleOk = useMemo(() => {
    if (!requireRoles || requireRoles.length === 0) return true;
    const role = (user?.role ?? '').toUpperCase();
    return requireRoles.map((r) => r.toUpperCase()).includes(role);
  }, [requireRoles, user?.role]);

  const authed = isAuthed && roleOk;
  const checked = status !== 'loading';

  // ✅ pathname/search 훅 대신 window.location 사용 (Suspense 필요 X)
  const fromRef = useRef<string>('/');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { pathname, search } = window.location;
      fromRef.current = `${pathname}${search || ''}`;
    }
  }, []);

  // 중복 실행 방지
  const handledRef = useRef(false);

  // ✅ A. 로그인된 사용자를 차단해야 하는 페이지(예: 로그인/회원가입)
  useEffect(() => {
    if (!checked) return;
    if (soft) return;
    if (!blockWhenAuthed) return;
    if (!isAuthed) return; // 비로그인 사용자는 이 페이지에 머무르게 함(로그인 가능)
    if (handledRef.current) return;
    handledRef.current = true;

    const title = messages?.authedBlockTitle ?? '이미 로그인되어 있습니다';
    const text =
      messages?.authedBlockText ??
      '해당 페이지는 로그인이 필요 없는 페이지입니다. 메인으로 이동합니다.';

    (async () => {
      if (useAlert) {
        await Swal.fire({
          icon: 'info',
          title,
          text,
          confirmButtonText: '확인',  // 확인만 표시
          showCancelButton: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
        });
      }
      router.replace(redirectAuthedTo);
    })();
  }, [
    checked,
    soft,
    blockWhenAuthed,
    isAuthed,
    messages?.authedBlockTitle,
    messages?.authedBlockText,
    useAlert,
    redirectAuthedTo,
    router,
  ]);

  // ✅ B. 보호 페이지: 미인증 또는 권한 부족일 때 → 경고 확인 후 로그인 페이지로
  useEffect(() => {
    if (!checked) return;
    if (soft) return;
    if (handledRef.current) return;

    const needProtect = !!requireRoles && requireRoles.length > 0; // 역할 제약이 있으면 보호 페이지로 판단
    if (!needProtect) return; // 보호 페이지가 아니면 여기선 아무 것도 안 함

    // 통과면 그대로 사용
    if (authed) return;

    handledRef.current = true;

    const loginUrl = `${redirectTo}?from=${encodeURIComponent(fromRef.current)}`;

    const isUnauth = !isAuthed;
    const title = isUnauth
      ? messages?.needLoginTitle ?? '로그인이 필요합니다'
      : messages?.forbiddenTitle ?? '접근 권한이 없습니다';

    const text = isUnauth
      ? messages?.needLoginText ?? '이 페이지는 로그인 후 이용할 수 있습니다.'
      : messages?.forbiddenText ?? '해당 페이지는 지정된 권한 사용자만 접근할 수 있습니다.';

    (async () => {
      if (useAlert) {
        await Swal.fire({
          icon: 'warning',
          title,
          text,
          confirmButtonText: '확인', // 확인만 표시
          showCancelButton: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
        });
      }
      router.replace(loginUrl);
    })();
  }, [
    checked,
    soft,
    authed,
    isAuthed,
    requireRoles,
    messages?.needLoginTitle,
    messages?.needLoginText,
    messages?.forbiddenTitle,
    messages?.forbiddenText,
    redirectTo,
    router,
    useAlert,
  ]);

  return {
    checked,
    authed,    // 역할까지 통과 여부(보호 페이지 통과)
    isAuthed,  // 로그인 여부
    user,
    status,
  };
}

export default useAuthGuard;
