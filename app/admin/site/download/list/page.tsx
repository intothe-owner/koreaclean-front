// app/admin/service/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";

import { useRouter } from "next/navigation";

import { useDeleteDownloadMutation, useDownloadListQuery,DownloadOrderBy } from "@/hooks/useDownload";

/* ----------------- 상위: 인증 가드 ----------------- */
export default function DownloadListPage() {


    return <DownloadListAuthed />;
}

/* ----------------- 우틸 ----------------- */
function toDateTime(v?: string | Date | null) {
    if (!v) return "-";
    const d = typeof v === "string" ? new Date(v) : v!;
    if (isNaN(d.getTime())) return "-";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}




/* ----------------- 목록 컴포넌트 ----------------- */
function DownloadListAuthed() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((prev) => !prev);
    // 목록 파라미터 상태 (노출/작성자 제거)
    const [q, setQ] = useState("");
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [orderBy, setOrderBy] = useState<DownloadOrderBy>("createdAt");
    const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("DESC");

    const queryParams = useMemo(
  () => ({
    q: q.trim() || undefined,
    page,
    page_size: pageSize,
    order_by: orderBy,   // ✅ 이제 타입이 DownloadOrderBy
    order_dir: orderDir,
  }),
  [q, page, pageSize, orderBy, orderDir]
);

    // ✅ 훅으로 목록 호출 (params가 바뀌면 자동 리패치)
    const { data, isFetching, isError, error, refetch } = useDownloadListQuery(queryParams);

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
    const delMutation = useDeleteDownloadMutation(
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
    const onCreate = () => router.push("/admin/site/download/form");
    const openDetail = (id: number) => router.push(`/admin/site/download/${id}`);

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
                        <h1 className="text-lg font-bold sm:text-xl">홈페이지 관리 &gt;&gt; 자료실 목록</h1>
                        <button
                            onClick={onCreate}
                            className="self-start rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
                        >
                            + 자료실 등록
                        </button>
                    </div>

                    {/* 필터: 검색어/중요도/페이지크기 (노출 제거) */}
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

                            <div className="grid grid-cols-2 gap-3">
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
                        </div>

                        <div className="mt-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                            <div className="text-sm text-gray-500">
                                총 <b>{total}</b>건
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setQ("");
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
                    {/* 목록 */}
                    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                        {/* 상태 메시지 */}
                        {isFetching && (
                            <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                목록을 불러오는 중입니다...
                            </div>
                        )}
                        {isError && (
                            <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                                목록을 불러오지 못했습니다. ( {String((error as any)?.message ?? "알 수 없는 오류")} )
                            </div>
                        )}

                        {/* 정렬 헤더 렌더 함수 */}
                        {(() => {
                            const renderSortLabel = (
                                key: typeof orderBy,
                                label: string,
                                align: "left" | "center" | "right" = "left"
                            ) => {
                                const active = orderBy === key;
                                const dirIcon = orderDir === "ASC" ? "▲" : "▼";

                                return (
                                    <button
                                        type="button"
                                        onClick={() => toggleSort(key)}
                                        className={`inline-flex items-center gap-1 text-xs sm:text-sm ${active ? "font-semibold text-blue-700" : "text-gray-700"
                                            }`}
                                        style={{ justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start", width: "100%" }}
                                    >
                                        <span>{label}</span>
                                        {active && <span className="text-[10px]">{dirIcon}</span>}
                                    </button>
                                );
                            };

                            return (
                                <>
                                    {/* 실제 테이블 */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-fixed text-sm">
                                            <colgroup>
                                                <col className="w-16" />   {/* 번호 */}
                                                <col />                    {/* 제목 */}
                                                <col className="w-36" />   {/* 등록일 */}
                                                <col className="w-20" />   {/* 조회수 */}
                                                <col className="w-24" />   {/* 관리 */}
                                            </colgroup>
                                            <thead>
                                                <tr className="border-b border-gray-200 bg-gray-50">
                                                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">번호</th>

                                                    <th className="px-2 py-2 text-left">
                                                        {renderSortLabel("title", "제목", "left")}
                                                    </th>
                                                    <th className="px-2 py-2 text-center">
                                                        {renderSortLabel("createdAt", "등록일", "center")}
                                                    </th>
                                                    <th className="px-2 py-2 text-center">
                                                        {renderSortLabel("views", "조회수", "center")}
                                                    </th>
                                                    <th className="px-2 py-2 text-center">관리</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* 빈 목록 처리 */}
                                                {(!items || items.length === 0) && !isFetching && (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-3 py-8 text-center text-sm text-gray-500"
                                                        >
                                                            등록된 자료가 없습니다.
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* 데이터 렌더링 */}
                                                {items?.map((item: any, idx: number) => {
                                                    const no = total - (page - 1) * pageSize - idx; // 역순 번호(최신이 1번처럼 보이게)
                                                   

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className="border-b border-gray-100 hover:bg-gray-50"
                                                        >
                                                            {/* 번호 */}
                                                            <td className="px-2 py-2 text-center text-xs text-gray-500">
                                                                {no}
                                                            </td>



                                                            {/* 제목(클릭 시 상세) */}
                                                            <td className="px-2 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDetail(item.id)}
                                                                    className="line-clamp-1 text-left text-sm text-gray-900 hover:text-blue-600"
                                                                >
                                                                    {item.is_pinned && (
                                                                        <span className="mr-1 inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-[1px] text-[11px] font-medium text-amber-800">
                                                                            공지
                                                                        </span>
                                                                    )}
                                                                    {item.title}
                                                                </button>
                                                            </td>

                                                            {/* 등록일 */}
                                                            <td className="px-2 py-2 text-center text-xs text-gray-500">
                                                                {toDateTime(item.createdAt)}
                                                            </td>

                                                            {/* 조회수 */}
                                                            <td className="px-2 py-2 text-center text-xs text-gray-500">
                                                                {item.views ?? 0}
                                                            </td>

                                                            {/* 관리 버튼 */}
                                                            <td className="px-2 py-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onDelete(item.id)}
                                                                    disabled={deletingId === item.id}
                                                                    className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                                >
                                                                    {deletingId === item.id ? "삭제중..." : "삭제"}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="mt-3 flex flex-col items-start justify-between gap-3 border-t border-gray-200 px-3 py-3 text-sm sm:flex-row sm:items-center sm:px-4">
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
