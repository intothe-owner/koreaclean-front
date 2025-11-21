// components/Header.tsx
'use client';

import { baseUrl, MENUS } from '@/lib/variable';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineMenu, HiOutlineX, HiChevronDown } from 'react-icons/hi';
import { useSession, signOut } from 'next-auth/react';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';
import useAutoLoginCheck from '@/hooks/useAutoLoginCheck';

export default function Header() {
  const router = useRouter();
    const { loading, authed, method} = useAutoLoginCheck();
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';
  const user = session?.user;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordions, setMobileAccordions] = useState<Record<number, boolean>>({});

  // 오버레이 열릴 때 바디 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleAccordion = (i: number) =>
    setMobileAccordions(prev => ({ ...prev, [i]: !prev[i] }));

  const handleLogout = async () => {
    // (선택) 백엔드 쿠키 로그아웃도 함께 처리하고 싶다면 주석 해제
    try {
      await fetchWithAuth(`${baseUrl}/users/logout`, { method: 'POST', credentials: 'include' });
    } catch (_) { /* noop */ }

    // NextAuth 세션 종료
    await signOut({ callbackUrl: '/' });
  };

  const isClientOrCompany = user?.role === 'CLIENT' || user?.role === 'COMPANY';
  const isAdmin = user?.role === 'SUPER' || user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* 로고 + 데스크탑 메뉴 */}
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold">
            <Link href="/">경로당토탈케어</Link>
          </div>

          {/* 데스크탑: 가로 메뉴 + 호버 드롭다운 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-800">
            {MENUS.map((m) => (
              <div key={m.label} className="relative group">
                <Link
                  href={m.href || '#'}
                  className="flex items-center gap-1 py-3 hover:text-black"
                >
                  {
                    m.label === '업체 등록'?
                      session?.user?.is_company?'업체 수정':m.label
                    :m.label
                  }
                  {m.children && <HiChevronDown className="mt-0.5" />}
                </Link>

                {m.children && (
                  <div
                    className="
                      absolute left-0 top-full
                      hidden group-hover:block
                      w-56 rounded-xl border border-black/10 bg-white shadow-lg p-2
                    "
                  >
                    {m.children.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block rounded-lg px-3 py-2 text-[14px] hover:bg-gray-100"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* 데스크탑 우측: 로그인/회원가입 ↔️ 👤 로그아웃/정보수정 */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-800">
          {isAuthed ? (
            <>
              {user?.name && <span className="text-gray-700">{user.name}님</span>}

              {isClientOrCompany && (
                <Link href="/mypage" className="hover:text-black">마이페이지</Link>
              )}
              {isClientOrCompany && (
                <Link href="/signup" className="hover:text-black">정보수정</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="hover:text-black">관리자모드</Link>
              )}

              <button
                onClick={handleLogout}
                className="hover:text-black"
                style={{cursor:'pointer'}}
                aria-label="logout"
              >
                👤 로그아웃
              </button>
            </>
          ) : (
            <>
              <Link className="hover:text-black" href="/login">로그인</Link>
              <span className="text-gray-400">/</span>
              <Link className="hover:text-black" href="/signup">회원가입</Link>
            </>
          )}
        </div>

        {/* 모바일: 햄버거 */}
        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-white/85 backdrop-blur-md">
          <div className="mx-auto   max-w-7xl px-4 py-3" style={{ backgroundColor: '#fff', overflowY: 'auto',height:'100vh'}}>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold">경로당 케어</div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* 모바일 아코디언 메뉴 */}
            <nav className="mt-4">
              {MENUS.map((m, i) => {
                const open = !!mobileAccordions[i];
                const hasChildren = !!m.children?.length;
                return (
                  <div key={m.label} className="border-b border-gray-200">
                    <button
                      className="w-full flex items-center justify-between py-4 text-[17px] font-semibold text-gray-900"
                      onClick={() => (hasChildren ? toggleAccordion(i) : window.location.assign(m.href || '#'))}
                      aria-expanded={open}
                    >
                      <span>{m.label}</span>
                      {hasChildren && (
                        <HiChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {hasChildren && (
                      <div
                        className="overflow-hidden transition-[max-height] duration-300"
                        style={{ maxHeight: open ? 400 : 0 }}
                      >
                        <div className="pb-3 pl-2">
                          {m.children!.map(sub => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              className="block rounded-lg px-3 py-2 text-[15px] text-gray-700 hover:bg-gray-100"
                              onClick={() => setMobileOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 모바일 하단: 인증 영역 */}
              <div className="pt-4 border-t border-gray-200 mt-4 overflow-y">
                {isAuthed ? (
                  <div className="flex flex-col gap-2">
                    {isClientOrCompany && (
                      <Link
                        href="/signup"
                        className="block py-3 text-[16px] font-medium text-gray-700"
                        onClick={() => setMobileOpen(false)}
                      >
                        정보수정
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block py-3 text-[16px] font-medium text-gray-700"
                        onClick={() => setMobileOpen(false)}
                      >
                        관리자모드
                      </Link>
                    )}
                    <Link
                        href="/mypage"
                        className="block py-3 text-[16px] font-medium text-gray-700"
                        onClick={() => setMobileOpen(false)}
                      >
                        마이페이지
                      </Link>
                    <button
                      className="block text-left py-3 text-[16px] font-medium text-gray-700"
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                    >
                      👤 로그아웃
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      className="block py-3 text-[16px] font-medium text-gray-700"
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                    >
                      로그인
                    </Link>
                    <Link
                      className="block py-3 text-[16px] font-medium text-gray-700"
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                    >
                      회원가입
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
