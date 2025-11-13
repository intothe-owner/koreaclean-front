// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useCallback, useMemo, useState } from 'react';
import ReviewForm from '@/components/app/ReviewForm';
import Modal from '@/components/ui/Modal';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';
import { useReviews } from '@/hooks/useReviews';
import { useSession, signOut } from "next-auth/react";
import { baseUrl } from '@/lib/variable';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';

type ReviewViewItem = {
  id: number | string;
  name: string;   // 화면에서는 title을 name으로 표시
  date: string;   // createdAt의 YYYY-MM-DD
  rating: number;
  content: string;
  photo?: string | null;
};

function mapToViewItem(d: any): ReviewViewItem {
  return {
    id: d.id,
    name: d.title,
    date: (d.createdAt ?? '').slice(0, 10),
    rating: d.rating,
    content: d.content,
    photo: d.photo_url ?? '',
  };
}

/** 줄바꿈을 <br/>로 치환 */
function nl2br(text?: string) {
  if (!text) return '';
  return String(text).replace(/\n/g, '<br />');
}

export default function Review() {
  const { data: session } = useSession();
  const items: TabItem[] = [
        { label: '서비스 개요 소개', href: '/home/intro' },
        { label: '주요 서비스 지역', href: '/home/area' },
        { label: '연락처 및 위치', href: '/home/contact' },
        { label: '성과 현황', href: '/home/achieve' },
        { label: '고객후기', href: '/home/review' },
    ];
  const [tab, setTab] = useState<string>('reserve');
  const [open, setOpen] = useState(false);

  // 상세 모달 상태
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 목록 불러오기
  const {
    items: serverItems,
    isLoading,
    isError,
    refetch,
  } = useReviews({
    page: 1,
    page_size: 20,
    order_by: 'createdAt',
    order_dir: 'DESC',
    status: 'PUBLISHED',
  });

  // 등록 성공 시 목록 갱신
  const handleCreated = () => {
    setOpen(false);
    refetch();
  };

  const views: ReviewViewItem[] = (serverItems ?? []).map(mapToViewItem);

  // 상세 불러오기
  const openDetail = useCallback(async (id: number | string) => {
    try {
      setDetailOpen(true);
      setDetailId(id);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);

      const res = await fetchWithAuth(`/backend/reviews/${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`상세 조회 실패 (${res.status}) ${t}`);
      }
      const data = await res.json();
      setDetail(data?.item ?? null);
    } catch (err: any) {
      setDetailError(err?.message || '상세 조회 중 오류가 발생했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 공통 버튼
  const WriteButton = () => (
    <div className="flex justify-end">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        후기 쓰기
      </button>
    </div>
  );

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

      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* 상단: 후기 쓰기 (로그인 시에만) */}
      {session?.user?.name  ? (
        <section className="relative z-10 bg-[#f9f5f2]">
          <div className="max-w-7xl mx-auto px-6 pb-12">
            <WriteButton />
          </div>
        </section>
      ) : null}

      {/* 후기 목록 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">고객 후기</h2>

          {isLoading && <div className="text-sm text-gray-500">불러오는 중…</div>}
          {isError && <div className="text-sm text-red-600">후기 목록을 불러오지 못했습니다.</div>}
          {!isLoading && !isError && views.length === 0 && (
            <div className="text-sm text-gray-500">등록된 후기가 없습니다.</div>
          )}

          <div className="space-y-5">
            {views.map((review) => (
              <button
                key={review.id}
                onClick={() => openDetail(review.id)}
                className="w-full text-left rounded-xl bg-white p-5 shadow-sm border border-black/10 flex gap-4 hover:shadow-md transition"
              >
                <div className="flex-shrink-0">
                  {review.photo ? (
                    <img
                      src={`${baseUrl}${review.photo}`}
                      alt={`${review.name}님의 사진`}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-[100px] h-[100px] rounded-lg bg-gray-200 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-12 h-12 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{review.name}</div>
                    <div className="text-sm text-gray-500">{review.date}</div>
                  </div>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* 목록에서는 nl2br + 3줄 클램프(선택) */}
                  <p
                    className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: nl2br(review.content) }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 하단: 후기 쓰기 (로그인 시에만) */}
      {session?.user?.name  ? (
        <section className="relative z-10 bg-[#f9f5f2]">
          <div className="max-w-7xl mx-auto px-6 pb-12">
            <WriteButton />
          </div>
        </section>
      ) : null}

      <Footer />

      {/* 후기 등록 모달 */}
      <Modal open={open} onClose={() => setOpen(false)} title="후기 등록" widthClass="max-w-2xl">
        <ReviewForm
          saveEndpoint="/backend/reviews"
          onCreated={handleCreated}
        />
      </Modal>

      {/* 상세보기 모달 */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail?.title ? `후기: ${detail.title}` : '후기 상세'}
        widthClass="max-w-3xl"
      >
        {detailLoading ? (
          <div className="text-sm text-gray-500">불러오는 중…</div>
        ) : detailError ? (
          <div className="text-sm text-red-600">{detailError}</div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">{detail.title}</div>
              <div className="text-sm text-gray-500">{(detail.createdAt ?? '').slice(0, 10)}</div>
            </div>

            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < (detail.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {detail.photo_url ? (
              <img
                src={`${baseUrl}${detail.photo_url}`}
                alt="후기 사진"
                className="w-full max-h-[420px] object-contain rounded-lg border border-gray-200"
              />
            ) : null}

            {/* 상세에서는 nl2br 전체 적용 */}
            <div
              className="text-sm text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: nl2br(detail.content) }}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500">데이터가 없습니다.</div>
        )}
      </Modal>
    </div>
  );
}
