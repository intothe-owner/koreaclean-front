// app/admin/service/page.tsx
"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";

import { useEffect, useMemo, useState } from "react";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { baseUrl, RequestForm } from "@/lib/variable";
import ServiceRequestDetailModal from "@/components/admin/ServiceRequestDetailModal";
import { useQueryClient } from "@tanstack/react-query"; // ✅ 추가
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { useSession } from "next-auth/react";

/** YYYY-MM-DD 로 표기 */
function toDateOnly(v?: string | Date | null) {
  if (!v) return "-";
  if (typeof v === "string") {
    if (v.length >= 10) return v.slice(0, 10);
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
  }
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return "-";
}

/** 서비스신청 상태 배지 */
function StatusBadge({ value }: { value?: string }) {
  const v = (value || "WAIT").toUpperCase();
  const map: Record<string, string> = {
    WAIT: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-200 text-gray-700",
  };
  const label: Record<string, string> = {
    WAIT: "대기",
    IN_PROGRESS: "진행중",
    DONE: "완료",
    CANCELLED: "취소",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        map[v] || "bg-gray-100 text-gray-700"
      }`}
    >
      {label[v] || v}
    </span>
  );
}

/** 배정 상태 배지 (PENDING/ACCEPTED/IN_PROGRESS) */
function AssignmentBadge({ value }: { value?: string }) {
  const v = (value || "PENDING").toUpperCase();
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };
  const label: Record<string, string> = {
    PENDING: "대기",
    ACCEPTED: "수락",
    IN_PROGRESS: "진행",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
        map[v] || "bg-gray-50 text-gray-700 ring-gray-200"
      }`}
    >
      {label[v] || v}
    </span>
  );
}

/** latest_assignment / assignment(s) 어떤 형태로 와도 최신 1건 반환 */
function pickLatestAssignment(r: any) {
  if (!r) return null;
  if (Array.isArray(r.latest_assignment)) return r.latest_assignment[0] ?? null;
  if (r.latest_assignment && typeof r.latest_assignment === "object") return r.latest_assignment;
  if (Array.isArray(r.assignment)) return r.assignment[0] ?? null;
  if (r.assignment && typeof r.assignment === "object") return r.assignment;
  if (Array.isArray(r.assignments)) return r.assignments[0] ?? null;
  if (r.assignments && typeof r.assignments === "object") return r.assignments;
  return null;
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <div className="mb-2 text-sm text-gray-500">검색 조건에 해당하는 신청이 없습니다.</div>
      <div className="text-xs text-gray-400">검색어를 변경하거나 초기화해 보세요.</div>
    </div>
  );
}

/** 모바일 카드 */
function RequestRowCard({
  r,
  onDetail,
}: {
  r: RequestForm;
  onDetail: (id: number) => void;
}) {
  const created = toDateOnly((r as any).created_at || (r as any).createdAt);
  const hope = toDateOnly(r.hope_date as any);
  const assignment = pickLatestAssignment(r as any);
  const companyName: string = assignment?.company?.name || "-";
  const assignStatus: string | undefined = assignment?.status;

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.org_name}</div>
        </div>
        <StatusBadge value={r.status} />
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-gray-700">
        <div>
          <dt className="text-gray-500">담당자</dt>
          <dd>{r.contact_name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">사무실</dt>
          <dd>{r.contact_tel || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">담당자연락처</dt>
          <dd>{r.contact_phone || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">희망일</dt>
          <dd>{hope}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">신청일</dt>
          <dd>{created}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">배정 업체</dt>
          <dd className="flex items-center gap-2">
            <span className="truncate">{companyName}</span>
            {assignment && <AssignmentBadge value={assignStatus} />}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => onDetail(r.id ?? 0)}
          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
        >
          상세
        </button>
      </div>
    </div>
  );
}

/** 페이지 컴포넌트 */
export default function ServiceRequestListPage() {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<RequestForm | null>(null);

  // 검색 상태 (기관명/담당자명)
  const [qOrg, setQOrg] = useState("");
  const [qContact, setQContact] = useState("");
  const [debOrg, setDebOrg] = useState("");
  const [debContact, setDebContact] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebOrg(qOrg.trim()), 300);
    return () => clearTimeout(t);
  }, [qOrg]);

  useEffect(() => {
    const t = setTimeout(() => setDebContact(qContact.trim()), 300);
    return () => clearTimeout(t);
  }, [qContact]);

  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<string | "">("");

  // 정렬
  const [sortKey, setSortKey] = useState<"createdAt" | "hope_date">("createdAt");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  // 페이징
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 검색/필터/정렬 바뀌면 1페이지로
  useEffect(() => {
    setPage(1);
  }, [debOrg, debContact, statusFilter, sortKey, sortDir]);

  // 서버 호출
  const { data, isLoading, isError, error } = useServiceRequests({
    page,
    page_size: pageSize,
    org_name: debOrg || undefined,
    contact_name: debContact || undefined,
    status: statusFilter || undefined, // WAIT/IN_PROGRESS/DONE/CANCELLED (서버에서 매핑)
    order_by: sortKey,
    order_dir: sortDir,
    withCredentials: true,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  // 블록 페이징
  const blockStart = Math.floor((page - 1) / 10) * 10 + 1;
  const blockEnd = Math.min(blockStart + 9, totalPages);
  const pageNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.max(0, blockEnd - blockStart + 1) },
        (_, i) => blockStart + i
      ),
    [blockStart, blockEnd]
  );
  const goFirst = () => setPage(1);
  const goLast = () => setPage(totalPages);
  const goPrevBlock = () => setPage(Math.max(1, blockStart - 10));
  const goNextBlock = () => setPage(Math.min(totalPages, blockStart + 10));

  function handleDetail(id: number) {
    const found = items.find((x) => x.id === id) || null;
    setSelected(found as any);
    setDetailOpen(true);
  }
  function resetSearch() {
    setQOrg("");
    setQContact("");
    setStatusFilter("");
  }

  // ===========================
  // ✅ onStatusChange 구현
  // ===========================
  const qc = useQueryClient();

  async function onStatusChange(id: number, next: "WAIT" | "IN_PROGRESS" | "DONE" | "CANCELLED") {
    try {
      // (선택) 취소 사유 입력
      let cancel_memo: string | undefined;
      if (next === "CANCELLED") {
        cancel_memo = window.prompt("취소 사유를 입력하세요 (선택)") || undefined;
      }

      // 서버 호출 (엔드포인트는 관례적으로 PATCH 사용)
      const res = await fetchWithAuth(`${baseUrl}/request/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next, cancel_memo }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "상태 변경 실패");
      }

      // 목록 무효화
      qc.invalidateQueries({ queryKey: ["service-requests"] });

      // 모달에 표시 중인 선택 항목도 즉시 동기화
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } as any : prev));

      // 안내
      alert("상태가 변경되었습니다.");
      setDetailOpen(false);
    } catch (e: any) {
      alert(e?.message || "상태 변경 중 오류가 발생했습니다.");
    }
  }



  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />
      <div className="lg:pl-72">
        <Header />

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-xl font-bold">서비스 신청 관리</h1>
          <p className="mb-4 text-sm text-gray-600">
            서비스 신청을 조회/필터링하고, 상태 변경 및 업체 배정을 수행합니다.
          </p>

          {/* 검색/필터 바 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_220px]">
              <div>
                <label className="mb-1 block text-xs text-gray-500">기관명</label>
                <input
                  value={qOrg}
                  onChange={(e) => setQOrg(e.target.value)}
                  placeholder="예: 해운대 경로당"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">담당자명</label>
                <input
                  value={qContact}
                  onChange={(e) => setQContact(e.target.value)}
                  placeholder="예: 김민수"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex items-end gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">상태 전체</option>
                  <option value="WAIT">대기</option>
                  <option value="IN_PROGRESS">진행중</option>
                  <option value="DONE">완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
              </div>
            </div>

            {/* 정렬/초기화 */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">정렬</label>
                <select
                  value={sortKey}
                  onChange={(e) =>
                    setSortKey(e.target.value as "createdAt" | "hope_date")
                  }
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="createdAt">신청일</option>
                  <option value="hope_date">희망일</option>
                </select>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as "ASC" | "DESC")}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="DESC">내림차순</option>
                  <option value="ASC">오름차순</option>
                </select>
              </div>

              <button
                onClick={resetSearch}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                초기화
              </button>
            </div>

            {/* 결과 요약 */}
            <div className="mt-3 text-xs text-gray-500">
              {isLoading && <>불러오는 중…</>}
              {isError && (
                <span className="text-rose-600">
                  조회 실패: {(error as Error)?.message || ""}
                </span>
              )}
              {!isLoading && !isError && (
                <>
                  총 <span className="font-semibold text-gray-700">{total}</span>건 · 페이지 {page} / {totalPages}
                </>
              )}
            </div>
          </section>

          {/* 데스크톱 테이블 */}
          <section className="hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[64px]" />
                  <col className="w-[220px]" />
                  <col className="w-[120px]" />
                  <col className="w-[110px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                  <col className="w-[110px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      기관
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      담당자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      연락처
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      희망일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      신청일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      배정 업체
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isLoading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                        불러오는 중…
                      </td>
                    </tr>
                  )}
                  {isError && !isLoading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-rose-600">
                        목록 조회 실패
                      </td>
                    </tr>
                  )}
                  {!isLoading && !isError && items.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10">
                        <EmptyState />
                      </td>
                    </tr>
                  )}

                  {items.map((r) => {
                    const created = toDateOnly((r as any).created_at || (r as any).createdAt);
                    const hope = toDateOnly(r.hope_date as any);
                    const assignment = pickLatestAssignment(r as any);
                    const companyName: string = assignment?.company?.name || "-";
                    const assignStatus: string | undefined = assignment?.status;

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-sm text-gray-500">{r.id}</td>
                        <td className="truncate px-4 py-3">
                          <div className="font-medium">{r.org_name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{r.contact_name}</div>
                          <div className="text-xs text-gray-500">{r.contact_email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-xs text-gray-500">
                            {r.contact_tel || "-"}
                            <br />
                            {r.contact_phone || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{hope}</td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge value={r.status} />

                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{created}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="truncate">{companyName}</span>
                          {assignment && <div className="mt-0.5"><AssignmentBadge value={assignStatus} /></div>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDetail(r.id ?? 0)}
                            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 숫자 페이징 (데스크톱) */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
              <div className="text-xs text-gray-500">
                {total > 0
                  ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(
                      page * pageSize,
                      total
                    )} / ${total}`
                  : `0 / 0`}
                &nbsp;· 페이지 {page} / {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={goFirst}
                  disabled={page === 1}
                  className="rounded-l-xl border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  처음
                </button>
                <button
                  onClick={goPrevBlock}
                  disabled={page <= 10}
                  className="border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  이전
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`border px-3 py-1.5 text-sm ${
                      n === page ? "bg-gray-600 text-white" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={goNextBlock}
                  disabled={blockEnd === totalPages}
                  className="border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  다음
                </button>
                <button
                  onClick={goLast}
                  disabled={page === totalPages}
                  className="rounded-r-xl border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  마지막
                </button>
              </div>
            </div>
          </section>

          {/* 모바일 카드 리스트 */}
          <section className="md:hidden">
            <div className="space-y-3">
              {isLoading && (
                <div className="rounded-xl border p-6 text-center text-sm text-gray-500">
                  불러오는 중…
                </div>
              )}
              {isError && !isLoading && (
                <div className="rounded-xl border p-6 text-center text-sm text-rose-600">
                  목록 조회 실패
                </div>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                  조회된 신청이 없습니다.
                </div>
              )}

              {items.map((r) => (
                <RequestRowCard key={r.id} r={r as any} onDetail={handleDetail} />
              ))}
            </div>

            {/* 숫자 페이징 (모바일) */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                {total > 0
                  ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(
                      page * pageSize,
                      total
                    )} / ${total}`
                  : `0 / 0`}
                &nbsp;· 페이지 {page} / {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={goFirst}
                  disabled={page === 1}
                  className="rounded-l-xl border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  처음
                </button>
                <button
                  onClick={goPrevBlock}
                  disabled={page <= 10}
                  className="border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  이전
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`hidden xs:inline-flex border px-2.5 py-1.5 text-sm ${
                      n === page ? "bg-gray-600 text-white" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={goNextBlock}
                  disabled={blockEnd === totalPages}
                  className="border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  다음
                </button>
                <button
                  onClick={goLast}
                  disabled={page === totalPages}
                  className="rounded-r-xl border px-2.5 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
                >
                  마지막
                </button>
              </div>
            </div>
          </section>

          <ServiceRequestDetailModal
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            request={selected}
            onEdit={(req) => {
              console.log("edit", req.id);
            }}
            // ✅ 여기 연결
            onStatusChange={onStatusChange}
          />
        </main>
      </div>
    </div>
  );
}
