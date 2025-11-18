// app/admin/notice/[id]/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useParams, useRouter } from "next/navigation";
import {
  useEduNoticeDetailQuery,
  useDeleteEduNoticeMutation,
} from "@/hooks/useEduNotice";

/* ===== 유틸 ===== */
function toDateTime(v?: string | Date | null) {
  if (!v) return "-";
  const d = typeof v === "string" ? new Date(v) : v!;
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function toDateOnly(v?: string | null) {
  if (!v) return "";
  return v.slice(0, 10);
}

function toTimeHM(v?: string | null) {
  if (!v) return "";
  return v.slice(0, 5);
}

function looksLikeHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

/* ===== 페이지 ===== */
export default function EduNoticeDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // ✅ 교육공지 상세 조회 훅
  const { data, isFetching, isError, error } = useEduNoticeDetailQuery(id);

  // ✅ 삭제 훅
  const delMutation = useDeleteEduNoticeMutation(
    (r) => {
      // API 응답 형태에 맞춰서 사용 (예: { is_success, message })
      if (!r || r.is_success === false) {
        alert(r?.message || "삭제 실패");
        return;
      }
      alert("삭제되었습니다.");
      router.push("/admin/site/edu/list"); // 👉 목록 경로에 맞게 수정
    },
    (e) => alert(e.message)
  );

  // 응답 형태가 { item } 이라고 가정
  const item = data?.item;
  const contentIsHtml = useMemo(
    () => (item?.content ? looksLikeHtml(item.content) : false),
    [item?.content]
  );

  const eduStart = toDateOnly(item?.edu_start_date);
  const eduEnd = toDateOnly(item?.edu_end_date);
  const classStart = toTimeHM(item?.class_start_time);
  const classEnd = toTimeHM(item?.class_end_time);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          {/* 상단 액션/타이틀 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                홈페이지 관리 &gt;&gt; 교육 공지 상세
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                교육 공지 내용을 확인하고 수정/삭제할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  router.push(`/admin/site/edu/form?id=${id}`)
                }
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                수정
              </button>
              <button
                onClick={() => {
                  if (confirm("정말 삭제하시겠습니까?")) {
                    delMutation.mutate({ id: id! });
                  }
                }}
                disabled={delMutation.isPending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {delMutation.isPending ? "삭제중..." : "삭제"}
              </button>
              <button
                onClick={() => router.push("/admin/site/edu/list")}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                목록으로
              </button>
            </div>
          </div>

          {/* 로딩/에러 */}
          {isFetching && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              불러오는 중...
            </section>
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
                  <h2 className="line-clamp-2 text-lg font-semibold">
                    {item.title}
                  </h2>
                </div>

                <div className="px-5 py-5 space-y-4">
                  {/* 교육 기간 / 수업시간 */}
                  <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-gray-500">
                        교육기간
                      </span>
                      <span>
                        {eduStart && eduEnd
                          ? `${eduStart} ~ ${eduEnd}`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-gray-500">
                        수업시간
                      </span>
                      <span>
                        {classStart && classEnd
                          ? `${classStart} ~ ${classEnd}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* 등록/수정/번호 */}
                  <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3 border-t border-gray-100 pt-4">
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-gray-500">
                        등록일
                      </span>
                      <span>{toDateTime(item.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-gray-500">
                        수정일
                      </span>
                      <span>{toDateTime(item.updatedAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-gray-500">
                        번호
                      </span>
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
                    {item.attachments.map((f: any, i: number) => (
                      <li
                        key={`${f.id || f.name}-${i}`}
                        className="flex items-center justify-between px-5 py-3 text-sm"
                      >
                        <div className="truncate">
                          {f.url ? (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 hover:underline"
                            >
                              {f.name ?? f.url}
                            </a>
                          ) : (
                            <span>{f.name}</span>
                          )}
                          {typeof f.size === "number" && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({Math.round(f.size / 1024)}KB)
                            </span>
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
                  <h3 className="text-sm font-semibold">내용</h3>
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
