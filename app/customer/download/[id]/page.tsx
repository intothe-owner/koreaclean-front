// app/customer/download/[id]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import { baseUrl } from '@/lib/variable';

type DownloadFile = {
  id?: string | number;
  name: string;           // 저장명
  name_original?: string; // 원본 파일명
  url?: string;
  size?: number;
  type?: string;
  key?: string;
};

type DownloadItem = {
  id: number;
  title: string;
  description?: string;
  files?: DownloadFile[];
  views?: number;
  createdAt?: string;
  updatedAt?: string;
};

function toDateTime(v?: string | Date | null) {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!d || isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

function prettySize(bytes?: number) {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = useMemo(() => {
    const raw = (params as any)?.id;
    if (!raw) return null;
    if (Array.isArray(raw)) return raw[0];
    return String(raw);
  }, [params]);

  const [item, setItem] = useState<DownloadItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch(`${baseUrl}/site/download/${id}`, {
          method: 'GET',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || '자료를 불러오지 못했습니다.');
        }

        const data = (await res.json()) as DownloadItem;
        if (!cancelled) {
          setItem(data);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setErrorMsg(err.message ?? '자료를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const files = useMemo(() => item?.files ?? [], [item]);

  const goList = () => router.push('/customer/download/list');

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <main className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
          {/* Breadcrumb & 제목 영역 */}
          <div className="mb-6">
            <div className="text-xs text-neutral-500 mb-1">
              고객센터 &gt; 자료실
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {item?.title || (loading ? '불러오는 중...' : '자료실')}
            </h1>
          </div>

          {/* 상태 메시지 */}
          {loading && (
            <div className="mb-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
              자료를 불러오는 중입니다...
            </div>
          )}

          {errorMsg && !loading && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {!loading && !errorMsg && !item && (
            <div className="mb-4 rounded-md bg-white px-4 py-6 text-sm text-neutral-600 shadow-sm">
              해당 자료를 찾을 수 없습니다.
            </div>
          )}

          {item && (
            <div className="rounded-2xl bg-white shadow-sm border border-neutral-200">
              {/* 헤더 (메타 정보) */}
              <div className="border-b border-neutral-200 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                  <div>등록일 {toDateTime(item.createdAt)}</div>
                  <div>조회수 {(item.views ?? 0).toLocaleString()}</div>
                </div>
              </div>

              {/* 내용 */}
              <div className="px-5 py-6 md:px-6 md:py-8">
                {/* description이 HTML 일 수 있으니, 그걸 고려 */}
                {item.description ? (
                  item.description.trim().startsWith('<') ? (
                    <div
                      className="prose prose-sm max-w-none break-words"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                      {item.description}
                    </div>
                  )
                ) : (
                  <div className="text-sm text-neutral-500">
                    등록된 설명이 없습니다.
                  </div>
                )}
              </div>

              {/* 첨부파일 목록 */}
              <div className="border-t border-neutral-200 px-5 py-4 md:px-6 md:py-5">
                <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                  첨부파일
                </h2>

                {files.length === 0 && (
                  <div className="text-sm text-neutral-500">
                    첨부된 파일이 없습니다.
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, idx) => {
                      const label = f.name;
                      return (
                        <div
                          key={f.id ?? `${f.name}-${idx}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium text-neutral-900">
                              {label}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {f.type || '파일'}{' '}
                              {typeof f.size === 'number'
                                ? `· ${prettySize(f.size)}`
                                : ''}
                            </div>
                          </div>
                          {f.url ? (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center rounded-md border border-neutral-300 bg-white px-3 text-xs text-neutral-700 hover:bg-neutral-100"
                            >
                              다운로드
                            </a>
                          ) : (
                            <span className="text-xs text-neutral-400">
                              경로 없음
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={goList}
              className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              목록
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
