// app/admin/service/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useRouter } from "next/navigation";
import {
  useEduNoticeListQuery,
  useDeleteEduNoticeMutation,
} from "@/hooks/useEduNotice";

/* ----------------- 상위 ----------------- */
export default function EduNoticeListPage() {
  return <EduNoticeListAuthed />;
}

/* ----------------- 유틸 ----------------- */
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

/* ----------------- 목록 컴포넌트 ----------------- */
function EduNoticeListAuthed() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // 목록 파라미터 상태
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] =
    useState<"createdAt" | "title" | "edu_start_date">("createdAt");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

  const queryParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      page,
      page_size: pageSize,
      order_by: orderBy,
      order_dir: orderDir,
    }),
    [q, page, pageSize, orderBy, orderDir]
  );

  // 목록 호출
  const { data, isFetching, isError, error, refetch } =
    useEduNoticeListQuery(queryParams);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSort = (key: typeof orderBy) => {
    if (orderBy === key) setOrderDir(orderDir === "ASC" ? "DESC" : "ASC");
    else {
      setOrderBy(key);
      setOrderDir("DESC");
    }
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const delMutation = useDeleteEduNoticeMutation(
    () => {
      alert("삭제되었습니다.");
      setDeletingId(null);
      refetch();
    },
    (e) => {
      alert(e.message);
      setDeletingId(null);
    }
  );

  const onDelete = (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(id);
    delMutation.mutate({ id });
  };

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  // 👉 라우트는 프로젝트에 맞게 조정
  const onCreate = () => router.push("/admin/site/edu/form");
  const openDetail = (id: number) =>
    router.push(`/admin/site/edu/${id}`);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-bold sm:text-xl">
              홈페이지 관리 &gt;&gt; 교육 공지 목록
            </h1>
            <button
              onClick={onCreate}
              className="self-start rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
            >
              + 새 교육 공지 등록
            </button>
          </div>

          {/* 필터: 검색어/페이지크기 */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">검색어</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setPage(1);
                  }}
                  placeholder="제목/내용 검색"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">페이지 크기</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}개
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div className="text-sm text-gray-500">
                총 <b>{total}</b>건
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setQ("");
                    setPage(1);
                    setPageSize(10);
                    setOrderBy("createdAt");
                    setOrderDir("DESC");
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  초기화
                </button>
                <button
                  onClick={() => setPage(1)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  검색
                </button>
              </div>
            </div>
          </section>

          {/* 목록 */}
          <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                  <tr>
                    <th className="w-16 px-3 py-3 sm:w-20 sm:px-4">번호</th>
                    <th className="px-3 py-3 sm:px-4">
                      <button
                        className="flex items-center gap-1 hover:opacity-80"
                        onClick={() => toggleSort("title")}
                        title="정렬"
                      >
                        제목
                        {orderBy === "title" && (
                          <span className="text-[10px]">
                            {orderDir === "ASC" ? "▲" : "▼"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="w-40 px-3 py-3 sm:w-48 sm:px-4">
                      <button
                        className="flex items-center gap-1 hover:opacity-80"
                        onClick={() => toggleSort("edu_start_date")}
                        title="정렬"
                      >
                        교육기간
                        {orderBy === "edu_start_date" && (
                          <span className="text-[10px]">
                            {orderDir === "ASC" ? "▲" : "▼"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="w-32 px-3 py-3 sm:w-40 sm:px-4">수업시간</th>
                    <th className="w-36 px-3 py-3 sm:w-44 sm:px-4">
                      <button
                        className="flex items-center gap-1 hover:opacity-80"
                        onClick={() => toggleSort("createdAt")}
                        title="정렬"
                      >
                        작성일
                        {orderBy === "createdAt" && (
                          <span className="text-[10px]">
                            {orderDir === "ASC" ? "▲" : "▼"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="hidden w-36 px-4 py-3 md:table-cell">작성자</th>
                    <th className="w-24 px-3 py-3 sm:w-28 sm:px-4">관리</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {isFetching && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        불러오는 중...
                      </td>
                    </tr>
                  )}
                  {!isFetching && isError && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-red-500"
                      >
                        {(error as Error)?.message ||
                          "목록을 불러오지 못했습니다."}
                      </td>
                    </tr>
                  )}
                  {!isFetching && !isError && items.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}

                  {!isFetching &&
                    !isError &&
                    items.map((n: any, idx: number) => {
                      const rowNo = total - (page - 1) * pageSize - idx;
                      const rowDeleting =
                        deletingId === n.id && delMutation.isPending;

                      const eduStart = toDateOnly(n.edu_start_date);
                      const eduEnd = toDateOnly(n.edu_end_date);
                      const classStart = toTimeHM(n.class_start_time);
                      const classEnd = toTimeHM(n.class_end_time);

                      return (
                        <tr key={n.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-center text-gray-500 sm:px-4">
                            {rowNo}
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            <button
                              onClick={() => openDetail(n.id)}
                              className="line-clamp-2 text-left text-blue-700 hover:underline md:line-clamp-1"
                              title={n.title}
                            >
                              {n.title}
                            </button>
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            {eduStart && eduEnd
                              ? `${eduStart} ~ ${eduEnd}`
                              : "-"}
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            {classStart && classEnd
                              ? `${classStart} ~ ${classEnd}`
                              : "-"}
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            {toDateTime(n.createdAt)}
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            관리자
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            <button
                              onClick={() => openDetail(n.id)}
                              className="mr-1 rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => onDelete(n.id)}
                              disabled={rowDeleting}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {rowDeleting ? "삭제중..." : "삭제"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex flex-col items-start justify-between gap-3 border-t border-gray-200 px-3 py-3 text-sm sm:flex-row sm:items-center sm:px-4">
                <div className="text-gray-500">
                  페이지 {page} / {totalPages}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => goPage(1)}
                    disabled={page === 1}
                    className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
                  >
                    « 처음
                  </button>
                  <button
                    onClick={() => goPage(page - 1)}
                    disabled={page === 1}
                    className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
                  >
                    ‹ 이전
                  </button>
                  <button
                    onClick={() => goPage(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
                  >
                    다음 ›
                  </button>
                  <button
                    onClick={() => goPage(totalPages)}
                    disabled={page === totalPages}
                    className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
                  >
                    마지막 »
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
