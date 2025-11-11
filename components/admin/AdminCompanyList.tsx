"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useCompanies, useDeleteCompany } from "@/hooks/useCompanies";
import { CompanyItem, CompanyStatus, companyStatus } from "@/lib/variable";
import CompanyDetailModal from "../app/CompanyDetailModal";

// ---- 유틸: 주소에서 지역(시/도)만 추출 ----
function extractRegion(address?: string): string {
    if (!address) return "-";
    const parts = address.split(" ").filter(Boolean);
    if (parts.length === 0) return "-";
    return parts[0];
}

// ---- 상태 배지 ----
function StatusBadge({ value }: { value?: string }) {
    const map: Record<string, string> = {
        대기: "bg-amber-50 text-amber-700 ring-amber-200",
        승인: "bg-green-50 text-green-700 ring-green-200",
        반려: "bg-rose-50 text-rose-700 ring-rose-200",
    };
    const cls = map[value || "대기"] || "bg-gray-50 text-gray-600 ring-gray-200";
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>
            {value || "대기"}
        </span>
    );
}

// ---- 모바일 카드 행 ----
// ---- 모바일 카드 행 ----
function CompanyRowCard({
  c,
  onDetail,
  onDelete,
  deleting,
}: {
  c: CompanyItem;
  onDetail: () => void;
  onDelete: (id: number) => void;
  deleting?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{c.name}</div>
          <div className="mt-0.5 truncate text-xs text-gray-500">{c.homepage || c.email || "-"}</div>
        </div>
        <StatusBadge value={c.status} />
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-gray-700">
        <div>
          <dt className="text-gray-500">대표명</dt>
          <dd>{c.ceo || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">연락처</dt>
          <dd>{c.tel || "-"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">사업자번호</dt>
          <dd className="truncate">{c.biz_no || "-"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">기본주소(지역)</dt>
          <dd>{extractRegion(c.address)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={onDetail}
          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
        >
          상세
        </button>
        <button
          onClick={() => onDelete(c.id!)}
          disabled={deleting}
          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-50"
        >
          {deleting ? "삭제중…" : "삭제"}
        </button>
      </div>
    </div>
  );
}

// ---- 메인 컴포넌트 ----
export default function AdminCompanyListUI() {
    // UI 상태
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [query, setQuery] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | "">("");
    // 컴포넌트 내부 상태
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<CompanyItem | null>(null);
    // 검색 디바운스
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    // 서버 호출
    const { data, isLoading, isError } = useCompanies({
        page,
        page_size: pageSize,
        q: debouncedQ || undefined,
        status: statusFilter || undefined, // 한글/영문/키 모두 허용 (백엔드 매핑)
        order_by: "createdAt",
        order_dir: "DESC",
        withCredentials: true, // 쿠키 인증 사용 시 true
        // accessToken: token, // Authorization 헤더를 쓸 경우
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.total_pages ?? 1;

    // ---- 1~10 단위 숫자 페이징 ----
    const blockStart = Math.floor((page - 1) / 10) * 10 + 1; // 1,11,21...
    const blockEnd = Math.min(blockStart + 9, totalPages); // 10,20,30...
    const pageNumbers = Array.from({ length: Math.max(0, blockEnd - blockStart + 1) }, (_, i) => blockStart + i);

    const goFirst = () => setPage(1);
    const goLast = () => setPage(totalPages);
    const goPrevBlock = () => setPage(Math.max(1, blockStart - 10));
    const goNextBlock = () => setPage(Math.min(totalPages, blockStart + 10));

    // 검색/필터 변화 시 1페이지로 이동
    useEffect(() => {
        setPage(1);
    }, [debouncedQ, statusFilter]);
    const { mutateAsync: deleteCompany, isPending: isDeleting } = useDeleteCompany();
    async function handleDelete(id: number) {
        if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
        await deleteCompany(id);
        // 모달에서 삭제했을 수도 있으니 닫기
        if (selected?.id === id) setDetailOpen(false);
    }
    return (
        <div className="min-h-screen w-full bg-gray-50 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <header className="mb-5">
                    <h1 className="text-xl font-bold">업체 관리</h1>
                    <p className="text-sm text-gray-600">업체 관리 내역을 조회/필터링하고, 상태를 변경할 수 있습니다.</p>
                </header>

                {/* 검색/필터 바 */}
                <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
                        <div className="flex items-center gap-2">
                            <div className="relative w-full">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="기업명/대표명/사업자번호/법인번호 검색"
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            >
                                <option value="">상태 전체</option>
                                <option value="PENDING">대기</option>
                                <option value="APPROVED">승인</option>
                                <option value="REJECTED">반려</option>
                            </select>
                            <button
                                onClick={() => {
                                    setQuery("");
                                    setStatusFilter("");
                                }}
                                className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                초기화
                            </button>
                        </div>
                    </div>
                </section>

                {/* 데스크톱 테이블 (md 이상) */}
                <section className="hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed divide-y divide-gray-200">
                            <colgroup>
                                <col className="w-[220px]" />
                                <col className="w-[120px]" />
                                <col className="w-[160px]" />
                                <col className="w-[150px]" />
                                <col className="w-[160px]" />
                                <col className="w-[100px]" />
                                <col className="w-[140px]" />
                            </colgroup>
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">기업명</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">대표명</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">사업자번호</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">연락처</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">기본주소(지역)</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">상태</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">설정</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {isLoading && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">불러오는 중…</td>
                                    </tr>
                                )}
                                {isError && !isLoading && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-rose-600">목록 조회 실패</td>
                                    </tr>
                                )}
                                {!isLoading && !isError && items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">조회된 업체가 없습니다.</td>
                                    </tr>
                                )}
                                {items.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/60">
                                        <td className="truncate px-4 py-3">
                                            <div className="font-medium">{c.name}</div>
                                            <div className="mt-0.5 text-xs text-gray-500">{c.homepage || c.email || "-"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{c.ceo || "-"}</td>
                                        <td className="px-4 py-3 text-sm">{c.biz_no || "-"}</td>
                                        <td className="px-4 py-3 text-sm">{c.tel || "-"}</td>
                                        <td className="px-4 py-3 text-sm">{extractRegion(c.address)}</td>
                                        <td className="px-4 py-3 text-sm">

                                            <StatusBadge value={companyStatus[(c.status ?? "PENDING") as CompanyStatus]} />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setSelected(c); setDetailOpen(true); }}
                                                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
                                                >
                                                    상세
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id!)}
                                                    disabled={isDeleting}
                                                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                                >
                                                    {isDeleting ? "삭제중…" : "삭제"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 숫자 페이징 (블록 이동 + 처음/마지막) */}
                    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                        <div className="text-xs text-gray-500">
                            총 <b>{total}</b>건 / 페이지 {page} / {totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={goFirst} disabled={page === 1} className="rounded-l-xl border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">처음</button>
                            <button onClick={goPrevBlock} disabled={page <= 10} className="border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">이전</button>
                            {pageNumbers.map((n) => (
                                <button key={n} onClick={() => setPage(n)} className={`border px-3 py-1.5 text-sm ${n === page ? "bg-gray-600 text-white" : "bg-white hover:bg-gray-50"}`}>
                                    {n}
                                </button>
                            ))}
                            <button onClick={goNextBlock} disabled={blockEnd === totalPages} className="border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">다음</button>
                            <button onClick={goLast} disabled={page === totalPages} className="rounded-r-xl border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">마지막</button>
                        </div>
                    </div>
                </section>

                {/* 모바일 카드 리스트 (md 미만) */}
                <section className="md:hidden">
                    <div className="space-y-3">
                        {isLoading && <div className="rounded-xl border p-6 text-center text-sm text-gray-500">불러오는 중…</div>}
                        {isError && !isLoading && <div className="rounded-xl border p-6 text-center text-sm text-rose-600">목록 조회 실패</div>}
                        {!isLoading && !isError && items.length === 0 && (
                            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">조회된 업체가 없습니다.</div>
                        )}
                        {items.map((c) => (
                            <CompanyRowCard
        key={c.id}
        c={c}
        onDetail={() => { setSelected(c); setDetailOpen(true); }}
        onDelete={(id) => handleDelete(id)}
        deleting={isDeleting}
      />
                        ))}
                    </div>

                    {/* 숫자 페이징 (모바일) */}
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-500">
                            총 <b>{total}</b>건 / 페이지 {page} / {totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={goFirst} disabled={page === 1} className="rounded-l-xl border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">처음</button>
                            <button onClick={goPrevBlock} disabled={page <= 10} className="border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">이전</button>
                            {/* 화면이 좁을 때는 숫자 숨김 가능: xs 이상에서 노출 */}
                            {pageNumbers.map((n) => (
                                <button key={n} onClick={() => setPage(n)} className={`hidden xs:inline-flex border px-2.5 py-1.5 text-sm ${n === page ? "bg-gray-600 text-white" : "bg-white hover:bg-gray-50"}`}>
                                    {n}
                                </button>
                            ))}
                            <button onClick={goNextBlock} disabled={blockEnd === totalPages} className="border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">다음</button>
                            <button onClick={goLast} disabled={page === totalPages} className="rounded-r-xl border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">마지막</button>
                        </div>
                    </div>
                </section>

                <CompanyDetailModal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    company={selected}
                    
                    onDelete={(c) => handleDelete(c.id!)}  // ← 여기!
                />
            </div>
        </div>
    );
}
