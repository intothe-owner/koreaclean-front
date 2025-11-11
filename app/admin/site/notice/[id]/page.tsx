// app/admin/notice/[id]/page.tsx
"use client";

import React, { useMemo } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useParams, useRouter } from "next/navigation";
import { useNoticeDetailQuery, useDeleteNoticeMutation, PriorityCode } from "@/hooks/useNotice";

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
  const d = typeof v === "string" ? new Date(v) : v!;
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function looksLikeHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

/* ===== 페이지 ===== */
export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // ✅ 상세 조회 훅
  const { data, isFetching, isError, error } = useNoticeDetailQuery(id);

  // ✅ 삭제 훅
  const delMutation = useDeleteNoticeMutation(
    (r) => {
      if (r?.is_success) {
        alert("삭제되었습니다.");
        router.push("/admin/service");
      } else {
        alert(r?.message || "삭제 실패");
      }
    },
    (e) => alert(e.message)
  );

  const item = data?.item;
  const contentIsHtml = useMemo(() => (item?.content ? looksLikeHtml(item.content) : false), [item?.content]);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />

        <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          {/* 상단 액션/타이틀 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold sm:text-xl">홈페이지 관리 &gt;&gt; 공지사항 상세</h1>
              <p className="mt-1 text-sm text-gray-500">공지 내용을 확인하고 수정/삭제할 수 있습니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push(`/admin/site/notice/form?id=${id}`)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                수정
              </button>
              <button
                onClick={() => {
                  if (confirm("정말 삭제하시겠습니까?")) delMutation.mutate({ id: id! });
                }}
                disabled={delMutation.isPending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {delMutation.isPending ? "삭제중..." : "삭제"}
              </button>
              <button
                onClick={() => router.push("/admin/site/notice/list")}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                목록으로
              </button>
            </div>
          </div>

          {/* 로딩/에러 */}
          {isFetching && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">불러오는 중...</section>
          )}
          {isError && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-red-600">
              {(error as Error)?.message || "상세를 불러오지 못했습니다."}
            </section>
          )}

          {/* 상세 카드 */}
          {item && !isFetching && !isError && (
            <>
              {/* 제목/메타 */}
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h2 className="line-clamp-2 text-lg font-semibold">{item.title}</h2>
                </div>

                <div className="px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_BADGE[item.priority]}`}
                    >
                      {PRIORITY_LABEL[item.priority]}
                    </span>
                    {item.is_pinned && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                        상단 고정
                      </span>
                    )}
                  
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0 text-gray-500">등록일</span>
                      <span>{toDateTime(item.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0 text-gray-500">수정일</span>
                      <span>{toDateTime(item.updatedAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0 text-gray-500">번호</span>
                      <span>{item.id}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 첨부파일 */}
              {item.attachments && item.attachments.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                    <h3 className="text-sm font-semibold">첨부파일</h3>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {item.attachments.map((f, i) => (
                      <li key={`${f.id || f.name}-${i}`} className="flex items-center justify-between px-5 py-3 text-sm">
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
                </section>
              )}

              {/* 본문 */}
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                  <h3 className="text-sm font-semibold">본문</h3>
                </div>
                <div className="prose max-w-none px-5 py-5">
                  {contentIsHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: item.content }} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-800">
                      {item.content || "(내용 없음)"}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
