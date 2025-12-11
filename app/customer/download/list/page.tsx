// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useEffect, useMemo, useState } from 'react';

import HeroCard from '@/components/app/HeroCard';
import { useRouter } from 'next/navigation';
import { baseUrl } from '@/lib/variable';

// ====== 타입 정의 ======
type DownloadItem = {
  id: number;
  title: string;
  views?: number;
  createdAt?: string;
};

type DownloadListResponse = {
  is_success: boolean;
  total: number;
  items: DownloadItem[];
  page: number;
  page_size: number;
};

// 날짜 포맷 유틸
function toDate(v?: string | Date | null) {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!d || isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// ====== 자료실 목록 섹션 ======
function DownloadListSection() {
  const router = useRouter();
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 홈에서는 최신 5개만 노출
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const qs = new URLSearchParams({
          page: '1',
          page_size: '5',
          order_by: 'createdAt',
          order_dir: 'DESC',
        });

        const res = await fetch(`${baseUrl}/site/download?${qs.toString()}`, {
          method: 'GET',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || '자료실 목록을 불러오지 못했습니다.');
        }

        const data = (await res.json()) as DownloadListResponse;

        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total ?? 0);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) setErrorMsg(err.message ?? '자료실 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(
    () =>
      items.map((it, idx) => ({
        ...it,
        no: total > 0 ? total - idx : items.length - idx, // 번호 표시용 (단순 역순)
      })),
    [items, total]
  );

  const goMore = () => router.push('/customer/download/list');
  const openDetail = (id: number) => router.push(`/customer/download/${id}`);

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">자료실</h2>
        <button
          type="button"
          onClick={goMore}
          className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4"
        >
          더보기
        </button>
      </div>

      {loading && (
        <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
          자료실 목록을 불러오는 중입니다...
        </div>
      )}

      {errorMsg && !loading && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && list.length === 0 && (
        <div className="py-6 text-center text-sm text-gray-500">
          등록된 자료가 없습니다.
        </div>
      )}

      {/* 데스크톱 테이블 */}
      {list.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 px-3 w-20">번호</th>
                  <th className="py-2 px-3">제목</th>
                  <th className="py-2 px-3 w-32 text-center">등록일</th>
                  <th className="py-2 px-3 w-28 text-right">조회수</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((it, idx) => (
                  <tr
                    key={it.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openDetail(it.id)}
                  >
                    <td className="py-3 px-3 text-gray-500">
                      {total > 0 ? total - idx : it.no}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-gray-900 hover:text-blue-600 line-clamp-1">
                        {it.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-500">
                      {toDate(it.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500">
                      {(it.views ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="md:hidden space-y-3">
            {list.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                onClick={() => openDetail(it.id)}
                className="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">
                      No. {total > 0 ? total - idx : it.no}
                    </div>
                    <div className="mt-0.5 font-medium text-gray-900 line-clamp-1">
                      {it.title}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>등록일 {toDate(it.createdAt)}</span>
                  <span>조회수 {(it.views ?? 0).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function NoticeList() {
  const items: TabItem[] = [
    { label: '공지사항', href: '/customer/notice/list' },
    { label: '자주 묻는 질문', href: '/customer/faq' },
    { label: '문의하기', href: '/customer/qna' },
    { label: '자료실', href: '/customer/download/list' },
  ];
  const [tab, setTab] = useState<string>('reserve');

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      {/* 헤더 */}
      <Header />
      {/* 배경 스와이퍼 */}
      <CenterSwiper />
      {/* 히어로 카드 */}
      <HeroCard title="경로당 맞춤형 청소" content="예약부터 사후관리까지 한번에" />

      {/* 탭 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* 자료실 목록 섹션 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-0 pb-12">
          <DownloadListSection />
        </div>
      </section>

      <Footer />
    </div>
  );
}
