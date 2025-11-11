// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useState, useMemo } from 'react';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';
import Link from 'next/link';
import { useNoticeListQuery, PriorityCode } from "@/hooks/useNotice";

export default function NoticeList() {
  const items: TabItem[] = [
    { label: '공지사항', href: '/customer/notice/list' },
    { label: '자주 묻는 질문', href: '/customer/faq' },
    { label: '문의하기', href: '/customer/qna' },
    { label: '다운로드', href: '/customer/download/list' },
  ];
  const [tab, setTab] = useState<string>('reserve');

  // ✅ 홈에선 상단 고정 우선 + 최신순, 6개만 노출
  const params = useMemo(
    () => ({
      page: 1,
      page_size: 6,
      order_by: 'createdAt' as const,
      order_dir: 'DESC' as const,
    }),
    []
  );
  const { data, isFetching, isError, error } = useNoticeListQuery(params);

  const PRIORITY_BADGE: Record<PriorityCode, string> = {
    EMERGENCY: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    IMPORTANT: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    NORMAL: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200',
  };
  const PRIORITY_LABEL: Record<PriorityCode, string> = {
    EMERGENCY: '긴급',
    IMPORTANT: '중요',
    NORMAL: '일반',
  };
  const toDate = (v?: string | Date | null) => {
    if (!v) return '-';
    const d = typeof v === 'string' ? new Date(v) : (v as Date);
    if (isNaN(d.getTime())) return '-';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

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

      {/* 공지사항 최신 목록 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-12">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold">공지사항</h2>
              <Link
                href="/customer/notice/list"
                className="text-sm text-blue-700 hover:underline"
                aria-label="공지사항 더보기"
              >
                더보기 &rsaquo;
              </Link>
            </div>

            {/* 본문: 목록 */}
            <div className="p-3 sm:p-4">
              {/* 로딩/에러/빈 상태 */}
              {isFetching && (
                <div className="py-10 text-center text-sm text-gray-500">불러오는 중...</div>
              )}
              {!isFetching && isError && (
                <div className="py-10 text-center text-sm text-red-600">
                  {(error as Error)?.message || '공지 목록을 불러오지 못했습니다.'}
                </div>
              )}

              {!isFetching && !isError && (
                <>
                  {data?.items?.length ? (
                    <ul className="divide-y divide-gray-200">
                      {data.items.map((n) => (
                        <li key={n.id} className="px-2 sm:px-3 py-3">
                          <Link
                            href={`/customer/notice/${n.id}`}
                            className="group flex items-start gap-2 sm:gap-3"
                          >
                            {/* 고정/중요도 배지 */}
                            <div className="mt-0.5 flex shrink-0 items-center gap-1">
                              {/** 상단 고정 */}
                              {Boolean((n as any).is_pinned) && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200">
                                  고정
                                </span>
                              )}
                              {/** 중요도 */}
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_BADGE[(n as any).priority as PriorityCode]}`}
                              >
                                {PRIORITY_LABEL[(n as any).priority as PriorityCode]}
                              </span>
                            </div>

                            {/* 제목/메타 */}
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-1 text-sm font-medium text-gray-900 group-hover:underline">
                                {n.title}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                                <span>{toDate(n.createdAt)}</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="hidden sm:inline">관리자</span>
                                {'views' in n && typeof (n as any).views === 'number' && (
                                  <>
                                    <span className="hidden sm:inline text-gray-300">|</span>
                                    <span className="hidden sm:inline">조회 {(n as any).views.toLocaleString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-10 text-center text-sm text-gray-500">등록된 공지가 없습니다.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
