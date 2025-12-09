// app/customer/qna/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import HeroCard from '@/components/app/HeroCard';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';

type QnaStatus = 'NEW' | 'ANSWERED' | 'REOPENED' | 'CLOSED';
type QnaListItem = {
  id: number;
  title: string;
  category: '서비스 신청' | '변경' | '취소' | '불만사항' | '제안';
  status: QnaStatus;
  comment_count?: number;
  createdAt: string;
  last_commented_at?: string | null;
};

function StatusBadge({ value }: { value: QnaStatus }) {
  const map: Record<QnaStatus, string> = {
    NEW: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    ANSWERED: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    REOPENED: 'bg-orange-100 text-orange-800 ring-orange-600/20',
    CLOSED: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${map[value]}`}>
      {value}
    </span>
  );
}

export default function QnaPage() {


  const items: TabItem[] = [
    { label: '공지사항', href: '/customer/notice/list' },
    { label: '자주 묻는 질문', href: '/customer/faq' },
    { label: '문의하기', href: '/customer/qna' },
    { label: '다운로드', href: '/customer/download/list' },
  ];
  const [tab, setTab] = useState<string>('reserve');

  const [rows, setRows] = useState<QnaListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');



  async function load() {
    try {
      setLoading(true);
      setErr('');
      const res = await fetchWithAuth('/backend/qna/list', {
        method: 'GET',

        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `load failed (${res.status})`);
      }
      const json = await res.json();
      setRows(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setErr(e?.message || '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />
      <MainBannerSwiper
        src="/backend/banners/main-banners"
        height={560}
        rounded="rounded-3xl"
        autoplayDelayMs={5000}
        loop
        showDots
        showNav
      />

      {/* 탭 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* 내 문의 목록 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-0 pb-12">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">내 문의 목록</h1>

                {/* 데스크탑용 버튼 */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/customer/qna/"
                    className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                  >
                    새 문의 작성
                  </Link>
                  <button
                    onClick={load}
                    className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                  >
                    새로고침
                  </button>
                </div>
              </div>

              {/* 모바일용 버튼(큰 터치 영역, 2열) */}
              <div className="md:hidden grid grid-cols-2 gap-2 mb-4">
                <Link
                  href="/customer/qna/"
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium flex items-center justify-center active:scale-[0.99]"
                >
                  새 문의 작성
                </Link>
                <button
                  onClick={load}
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium flex items-center justify-center hover:bg-gray-50 active:scale-[0.99]"
                >
                  새로고침
                </button>
              </div>

              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center justify-between border-b p-3 text-sm">
                  <div className="font-medium">총 {rows.length}건</div>
                  {loading && <div className="text-neutral-500">불러오는 중…</div>}
                </div>

                {err ? (
                  <div className="p-4 text-sm text-rose-600">{err}</div>
                ) : rows.length === 0 && !loading ? (
                  <div className="p-6 text-sm text-neutral-500">등록된 문의가 없습니다.</div>
                ) : (
                  <>
                    {/* 모바일: 카드 리스트 */}
                    <ul className="block md:hidden divide-y divide-gray-200">
                      {rows.map((it) => (
                        <li key={it.id} className="bg-gray-50 hover:bg-gray-100">
                          <Link href={`/customer/qna/${it.id}`} className="block p-4">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-medium text-gray-900 line-clamp-1">{it.title}</h3>
                              <StatusBadge value={it.status} />
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {it.category} · 댓글 {it.comment_count ?? 0}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                              <span>등록 {new Date(it.createdAt).toLocaleString()}</span>
                              <span>
                                최근활동{' '}
                                {it.last_commented_at
                                  ? new Date(it.last_commented_at).toLocaleString()
                                  : '-'}
                              </span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* 데스크탑: 테이블 */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-neutral-600">
                          <tr>
                            <th className="px-3 py-2 w-[110px]">상태</th>
                            <th className="px-3 py-2">제목</th>
                            <th className="px-3 py-2 w-[110px]">분류</th>
                            <th className="px-3 py-2 w-[90px]">댓글</th>
                            <th className="px-3 py-2 w-[160px]">등록일</th>
                            <th className="px-3 py-2 w-[160px]">최근 활동</th>
                          </tr>
                        </thead>
                        <tbody className="text-neutral-800">
                          {rows.map((it) => (
                            <tr key={it.id} className="border-t border-gray-200 bg-gray-50 hover:bg-gray-100">
                              <td className="px-3 py-2 align-middle">
                                <StatusBadge value={it.status} />
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <Link
                                  href={`/customer/qna/${it.id}`}
                                  className="hover:underline line-clamp-1"
                                  title={it.title}
                                >
                                  {it.title}
                                </Link>
                              </td>
                              <td className="px-3 py-2 align-middle">{it.category}</td>
                              <td className="px-3 py-2 align-middle">{it.comment_count ?? 0}</td>
                              <td className="px-3 py-2 align-middle">
                                {new Date(it.createdAt).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 align-middle">
                                {it.last_commented_at
                                  ? new Date(it.last_commented_at).toLocaleString()
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
