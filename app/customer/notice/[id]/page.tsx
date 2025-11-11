// app/customer/notice/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import MainBannerSwiper from "@/components/app/MainBannerSwiper";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

/* ===== 타입 ===== */
type PriorityCode = "EMERGENCY" | "IMPORTANT" | "NORMAL";
type Attachment = { id?: string | number; name: string; url?: string; size?: number };
type NoticeDetail = {
  id: number;
  title: string;
  content: string;
  priority: PriorityCode;
  is_pinned?: boolean;
  views?: number;
  attachments?: Attachment[] | string; // 서버가 string으로 줄 수도 있어 대비
  createdAt?: string;
  updatedAt?: string;
};
type DetailResponse = { is_success: boolean; item?: NoticeDetail; message?: string };

/* ===== 유틸 ===== */
const PRIORITY_LABEL: Record<PriorityCode, string> = {
  EMERGENCY: "긴급",
  IMPORTANT: "중요",
  NORMAL: "일반",
};
const PRIORITY_BADGE: Record<PriorityCode, string> = {
  EMERGENCY: "bg-red-50 text-red-700 ring-1 ring-red-200",
  IMPORTANT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  NORMAL: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
};
function toDateTime(v?: string | Date | null) {
  if (!v) return "-";
  const d = typeof v === "string" ? new Date(v) : (v as Date);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function looksLikeHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}
function normalizeAttachments(a?: Attachment[] | string) {
  if (!a) return [] as Attachment[];
  if (Array.isArray(a)) return a;
  try {
    const parsed = JSON.parse(a || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ===== 페이지 ===== */
export default function PublicNoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/backend/notice/detail?id=${id}&inc_view=1`, { credentials: "include" });
        if (!res.ok) throw new Error("상세를 불러오지 못했습니다.");
        const json = (await res.json()) as DetailResponse;
        if (!alive) return;
        setData(json);
        setErr(json.is_success ? null : json.message || "상세를 불러오지 못했습니다.");
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "서버 오류");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const item = data?.item;
  const attachments = useMemo(() => normalizeAttachments(item?.attachments), [item?.attachments]);
  const contentIsHtml = useMemo(() => (item?.content ? looksLikeHtml(item.content) : false), [item?.content]);

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />
      <MainBannerSwiper
        src="/backend/banners/main-banners"
        height={360}
        rounded="rounded-3xl"
        autoplayDelayMs={5000}
        loop
        showDots
        showNav
      />

      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          {/* 상단 네비 */}
          <div className="mb-4 flex items-center justify-between">
            <nav className="text-sm text-gray-500">
              <Link href="/" className="hover:underline">홈</Link>
              <span className="mx-2">/</span>
              <Link href="/customer/notice/list" className="hover:underline">공지사항</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">상세</span>
            </nav>
            <button
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              뒤로가기
            </button>
          </div>

          {/* 카드 */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* 로딩/에러 */}
            {loading && (
              <div className="p-8 text-center text-sm text-gray-500">불러오는 중...</div>
            )}
            {!loading && err && (
              <div className="p-8 text-center text-sm text-red-600">{err}</div>
            )}

            {!loading && !err && item && (
              <>
                {/* 제목 영역 */}
                <div className="border-b border-gray-200 px-5 py-5">
                  <h1 className="text-lg font-semibold sm:text-xl">{item.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${PRIORITY_BADGE[item.priority]}`}>
                      {PRIORITY_LABEL[item.priority]}
                    </span>
                    {item.is_pinned && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 ring-1 ring-indigo-200">
                        상단 고정
                      </span>
                    )}
                    <span>작성일 {toDateTime(item.createdAt)}</span>
                    {typeof item.views === "number" && <span>조회 {item.views.toLocaleString()}</span>}
                    <span className="hidden sm:inline">|</span>
                    <span className="hidden sm:inline">작성자 관리자</span>
                  </div>
                </div>

                {/* 본문 */}
                <div className="prose max-w-none px-5 py-6">
                  {contentIsHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: item.content }} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-800">
                      {item.content || "(내용 없음)"}
                    </div>
                  )}
                </div>

                {/* 첨부 */}
                {attachments.length > 0 && (
                  <div className="px-5 pb-6">
                    <div className="mb-2 text-sm font-semibold">첨부파일</div>
                    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                      {attachments.map((f, i) => (
                        <li key={`${f.id || f.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="truncate">
                            {f.url ? (
                              <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                                {f.name}
                              </a>
                            ) : (
                              <span>{f.name}</span>
                            )}
                            {typeof f.size === "number" && (
                              <span className="ml-2 text-xs text-gray-500">({Math.round(f.size / 1024)}KB)</span>
                            )}
                          </div>
                          {f.url && (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                            >
                              열기
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 하단 액션 */}
                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                  <Link
                    href="/customer/notice/list"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    목록으로
                  </Link>
                  <Link
                    href="/"
                    className="text-sm text-blue-700 hover:underline"
                  >
                    홈으로 이동 →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
