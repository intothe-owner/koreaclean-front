// components/admin/ServiceRequestDetailModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SRStatus } from "@/hooks/useServiceRequests";
import { RequestForm } from "@/lib/variable";
import { getSeniorRows } from "@/lib/function";
import { useCompanies } from "@/hooks/useCompanies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AssRegionMultiSelect from "../ui/AssRegionMultiSelect";
import EstimateViewer from "./EstimateViewer";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

type Props = {
  open: boolean;
  onClose: () => void;
  request?: RequestForm | null; // 목록에서 전달
  onEdit?: (req: RequestForm) => void; // 필요시 편집 Action
  onStatusChange?: (id: number, next: SRStatus) => void; // 필요시 상태 변경 Action
};

const statusLabel: Record<string, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
  CANCELLED: "취소",
};

/** 최신 배정 1건 추출 (latest_assignment/assignment/assignments 모두 대응) */
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

/** 배정 상태 배지 (모달 전용 소형) */
function AssignmentBadge({ value }: { value?: string }) {
  const v = (value || "PENDING").toUpperCase();
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    DECLINED: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  const label: Record<string, string> = {
    PENDING: "대기",
    ACCEPTED: "수락",
    IN_PROGRESS: "진행",
    DECLINED: "거절",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map[v] || "bg-gray-50 text-gray-700 ring-gray-200"}`}
    >
      {label[v] || v}
    </span>
  );
}

// 배정 API 뮤테이션
function useAssignCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, companyId }: { requestId: number; companyId: number }) => {
      const res = await fetchWithAuth(`/backend/request/${requestId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ company_id: companyId }),
      });
      if (!res.ok) throw new Error("업체 배정 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
      qc.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

/* ========================= */
/*  견적서 표시용 타입/유틸   */
/* ========================= */

type PartyInfo = {
  name?: string;
  biz_no?: string;
  ceo?: string;
  charge_name?: string;
  contact?: string;
  email?: string;
  address?: string;
};

type EstimateItem = {
  name: string;
  detail?: string;
  qty?: number | null;
  unit?: string;
  unit_price?: number | null;
  amount: number;
  note?: string;
};

type EstimateData = {
  title?: string;
  issue_date?: string | null;
  valid_until?: string | null;
  supplier?: PartyInfo;
  client?: PartyInfo;
  items?: EstimateItem[];
  subtotal?: number;
  vat_rate?: number; // 0 or 0.1
  vat?: number;
  total?: number;
  vat_included?: boolean;
  memo?: string;
};

const fmtWon = (n: number | undefined | null) =>
  (typeof n === "number" ? n : 0).toLocaleString("ko-KR");

const toDateOnly = (v?: string | Date | null) => {
  if (!v) return "-";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return "-";
};

function normalizeEstimate(e: any): EstimateData {
  if (!e || typeof e !== "object") return { items: [], subtotal: 0, vat_rate: 0, vat: 0, total: 0, vat_included: false };
  const num = (x: any) => (typeof x === "number" ? x : Number(x ?? 0)) || 0;
  const items = Array.isArray(e.items)
    ? e.items.map((it: any) => ({
      name: String(it?.name ?? ""),
      detail: it?.detail ? String(it.detail) : "",
      qty: it?.qty != null ? Number(it.qty) : null,
      unit: it?.unit ? String(it.unit) : "",
      unit_price: it?.unit_price != null ? Number(it.unit_price) : null,
      amount: num(it?.amount),
      note: it?.note ? String(it.note) : "",
    }))
    : [];
  return {
    title: e.title ?? "견적서",
    issue_date: e.issue_date ?? null,
    valid_until: e.valid_until ?? null,
    supplier: e.supplier ?? {},
    client: e.client ?? {},
    items,
    subtotal: num(e.subtotal),
    vat_rate: Number(e.vat_rate) === 0.1 ? 0.1 : 0,
    vat: num(e.vat),
    total: num(e.total),
    vat_included: Boolean(e.vat_included),
    memo: e.memo ?? "",
  };
}

export default function ServiceRequestDetailModal({
  open,
  onClose,
  request,
  onEdit,
  onStatusChange,
}: Props) {
  // 모달 상단 (컴포넌트 내부)
  const [statusValue, setStatusValue] = useState<SRStatus>("WAIT");

  // 요청이 바뀔 때마다 초기 상태 동기화
  useEffect(() => {
    const cur = String(request?.status || "WAIT").toUpperCase() as SRStatus;
    setStatusValue(cur);
  }, [request?.id, request?.status, open]);
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);

  // 지역 멀티셀렉트 상태 (선택 중)
  const [regions, setRegions] = useState<string[]>([]);
  // '선택 완료'로 적용된 지역
  const [appliedRegions, setAppliedRegions] = useState<string[]>([]);
  const stableRegions = useMemo(
    () => (appliedRegions.length ? [...appliedRegions].sort() : []),
    [appliedRegions]
  );

  // 승인 업체 목록 (적용된 지역 기준)
  const { data: companyList, isLoading: isCompanyLoading } = useCompanies(
    {
      page: 1,
      page_size: 10,
      status: "APPROVED",
      order_by: "createdAt",
      order_dir: "DESC",
      withCredentials: true,
      regions: stableRegions.length ? stableRegions : undefined,
    },
    { enabled: stableRegions.length > 0 }
  );

  const { mutateAsync: assignCompany, isPending: isAssigning } = useAssignCompany();

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 열린 뒤 첫 버튼 포커스
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => firstBtnRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  // 요청이 바뀌면 지역 초기화
  useEffect(() => {
    setRegions([]);
    setAppliedRegions([]);
  }, [request?.org_name, request?.hope_date, request?.status]);

  const created = useMemo(
    () => (request as any)?.created_at || (request as any)?.createdAt || "-",
    [request]
  );



  // 최신 배정 한 건
  const latestAss = pickLatestAssignment(request as any);
  const assignedCompany = latestAss?.company;
  const assigned = !!latestAss;

  // ✅ 상태가 IN_PROGRESS 또는 DONE일 때만 배정업체 카드 노출
  const canShowAssignedInfo =
    assigned &&
    ["IN_PROGRESS", "DONE"].includes(String(request?.status || "").toUpperCase());

  // ✅ 견적서 데이터 준비
  const est = normalizeEstimate((request as any)?.estimate);

  // 서비스 타입/기타 텍스트 파생값
  // ... 기존 훅들(useState/useEffect/useCompanies 등) 아래에 이어서 추가
  const serviceTypeList = useMemo<any[]>(() => {
    const raw = (request as any)?.service_type;
    return Array.isArray(raw) ? raw : [];
  }, [request]);

  const hasEtcType = useMemo(() => {
    return serviceTypeList.some((t) => {
      const v = typeof t === "string" ? t : (t?.type || t?.name || t?.label || "");
      return String(v).trim() === "기타";
    });
  }, [serviceTypeList]);

  const otherText: string = useMemo(() => {
    return (
      (request as any)?.service_types_other ??
      (request as any)?.service_type_other ??
      (request as any)?.other_service ??
      ""
    );
  }, [request]);
  if (!open) return null;

  const hasAnyEstimate =
    !!est?.supplier?.name ||
    !!est?.client?.name ||
    (Array.isArray(est?.items) && est.items!.length > 0) ||
    (est?.total ?? 0) > 0 ||
    (est?.subtotal ?? 0) > 0;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="relative z-[101] w-full max-w-3xl rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold">서비스 신청 상세</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {!request ? (
            <div className="py-8 text-center text-sm text-gray-500">데이터가 없습니다.</div>
          ) : (
            <div className="space-y-6">
              {/* 상단 요약 */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-gray-500">기관명</div>
                    <div className="text-base font-semibold">{request.org_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">상태</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {statusLabel[(request.status || "WAIT").toString().toUpperCase()] ||
                        request.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">신청일: {created}</div>
              </div>

              {/* 기본 정보 */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="담당자" value={request.contact_name} />
                <Field label="담당자 이메일" value={request.contact_email || "-"} />
                <Field label="사무실 연락처" value={request.contact_tel || "-"} />
                <Field label="담당자 연락처" value={request.contact_phone || "-"} />
                <Field label="희망일" value={toDateOnly(request.hope_date as any)} />
              </section>

              {/* 서비스 타입 / 경로당 / 특이사항 / 파일 */}
              <section className="grid grid-cols-1 gap-4">
                {/* 서비스 타입: 칩 나열 */}
                <div>
                  <div className="mb-1 text-xs text-gray-500">서비스 종류</div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(request?.service_type) && (request!.service_type as any[]).length > 0 ? (
                      (request!.service_type as any[]).map((t: any, i: number) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-50 px-2 py-0.5 text-xs ring-1 ring-gray-200"
                        >
                          {typeof t === "string"
                            ? t
                            : t?.type || t?.name || t?.label || "-"}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </div>

                  {/* ⬇⬇⬇ 추가: 기타 상세 표시 ⬇⬇⬇ */}
                  {(hasEtcType || otherText?.trim()) && (
                    <div className="mt-2 text-xs">

                      <span className="align-middle text-gray-800">
                        {otherText?.trim() || "-"}
                      </span>
                    </div>
                  )}
                </div>

                {/* 경로당 목록 */}
                <div>
                  <div className="mb-1 text-xs text-gray-500">경로당 목록</div>
                  {(() => {
                    const rows = getSeniorRows((request as any)?.seniors ?? (request as any)?.seniorInfo);
                    if (!rows.length)
                      return <div className="text-sm text-gray-500">-</div>;
                    return (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full table-fixed text-sm">
                          <colgroup>
                            <col className="w-[180px]" />
                            <col className="w-[120px]" /> {/* 작업일 */}
                            <col />                        {/* 작업내역 */}
                            <col className="w-[110px]" />  {/* 상태 */}
                          </colgroup>
                          <thead className="border-b bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">경로당</th>
                              <th className="px-3 py-2 text-left font-semibold">작업일</th>
                              <th className="px-3 py-2 text-left font-semibold">작업내역</th>
                              <th className="px-3 py-2 text-left font-semibold">상태</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {rows.map((s: any, i: number) => {
                              const key = s.id ?? i;
                              const workDate = s?.work_date;
                              const workText = s?.work;

                              // seniors JSON에 status 또는 work_status 로 들어있다고 가정
                              const statusRaw =
                                (s?.status ?? s?.work_status ?? "WAIT").toString().toUpperCase();

                              return (
                                <tr key={key} className="align-top hover:bg-gray-50/60">
                                  <td className="px-3 py-2">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="mt-1 text-xs text-gray-500">{s.address || "-"}</div>
                                  </td>
                                  <td className="px-3 py-2">{workDate || "-"}</td>
                                  <td className="px-3 py-2 whitespace-pre-wrap">{workText || "-"}</td>
                                  <td className="px-3 py-2">
                                    <SeniorStatusBadge value={statusRaw} />
                                  </td>
                                </tr>
                              );
                            })}

                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* ✅ 배정 정보/배정 UI 분기 (요청 상태 기준) */}
                {canShowAssignedInfo ? (
                  /* 배정된 업체 정보 표시 */
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-700">배정된 업체</div>
                      <AssignmentBadge value={latestAss?.status} />
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">업체명</span>
                        <span className="font-medium">{assignedCompany?.name || "-"}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        대표: {assignedCompany?.ceo || "-"} · 연락처: {assignedCompany?.tel || "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        지역: {Array.isArray(assignedCompany?.regions) && assignedCompany?.regions.length
                          ? assignedCompany?.regions.join(", ")
                          : "서비스 가능 지역 정보 없음"}
                      </div>

                      {/* (선택) 거절 사유/메모 표시 */}
                      {latestAss?.status?.toUpperCase() === "DECLINED" && !!latestAss?.cancel_memo && (
                        <div className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                          거절 사유: {latestAss.cancel_memo}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 지역 기반 배정 UI (상태가 IN_PROGRESS/DONE이 아니거나, 아직 배정이 없을 때) */
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="mb-2 text-xs font-semibold text-gray-700">업체 배정 (지역 기반)</div>

                    {/* 시/도 > 구/군 다중 선택 */}
                    <AssRegionMultiSelect
                      label="검색 지역"
                      value={regions}
                      onChange={setRegions}
                      onApply={(next) => setAppliedRegions([...next])}
                      className="mb-3"
                    />

                    {/* 적용 전 안내 / 결과 목록 */}
                    {appliedRegions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                        지역을 선택한 뒤 <b>선택 완료</b>를 눌러주세요. 업체 목록이 표시됩니다.
                      </div>
                    ) : (
                      <div className="divide-y rounded-lg border border-gray-200">
                        {isCompanyLoading ? (
                          <div className="p-3 text-sm text-gray-500">불러오는 중…</div>
                        ) : (companyList?.items ?? []).length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            선택한 지역에 해당하는 승인 업체가 없습니다.
                          </div>
                        ) : (
                          (companyList!.items as any[]).map((c) => (
                            <div
                              key={c.id}
                              className="flex items-start justify-between gap-3 p-3 hover:bg-gray-50"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-gray-900">
                                  {c.name}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  대표: {c.ceo || "-"} · 연락처: {c.tel || "-"}
                                </div>
                                <div className="mt-0.5 truncate text-xs text-gray-500">
                                  {Array.isArray(c.regions) && c.regions.length
                                    ? c.regions.join(", ")
                                    : "서비스 가능 지역 정보 없음"}
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!(request as any)?.id || !c.id) return;
                                  await assignCompany({
                                    requestId: (request as any).id,
                                    companyId: c.id,
                                  });
                                  onStatusChange?.((request as any).id, "IN_PROGRESS");
                                  alert("업체 배정 완료");
                                }}
                                disabled={isAssigning}
                                className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {isAssigning ? "배정 중…" : "배정"}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 특이사항 */}
                <Field label="특이사항" value={request.etc || "-"} multiline />

                {/* 첨부파일: 다운로드/미리보기 지원 */}
                {!!request?.files && <FilesList label="첨부파일" files={request.files} />}

                {/* ======================= */}
                {/* ✅ 견적서 (읽기 전용 표시) */}
                {/* ======================= */}
                <EstimateViewer
                  estimate={(request as any)?.estimate}
                  requestId={(request as any)?.id}
                  downloadEndpoint={`/backend/request/${(request as any)?.id}/estimate/preview`}
                />

                {/* === /견적서 === */}
              </section>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          {request && onStatusChange && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">상태 변경</label>
              <select
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={statusValue}
                onChange={(e) => {
                  const next = e.target.value as SRStatus;
                  setStatusValue(next);                           // UI 즉시 반영
                  onStatusChange((request as any)?.id ?? 0, next); // 서버 반영
                }}
              >
                <option value="WAIT">대기</option>
                <option value="IN_PROGRESS">진행</option>
                <option value="DONE">완료</option>
                <option value="CANCELLED">취소</option>
              </select>
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 ${multiline ? "whitespace-pre-wrap" : "truncate"} text-sm text-gray-900`}>
        {value || "-"}
      </div>
    </div>
  );
}

/* ------------------------------ */
/* 첨부파일 리스트 + 다운로드 지원 */
/* ------------------------------ */

type FileLike = {
  id?: string | number;
  url?: string;
  path?: string;
  name?: string;
  originalName?: string;
  filename?: string;
  fileName?: string;
  type?: string;
  mime?: string;
  size?: number;
};

function FilesList({ label, files }: { label: string; files: any }) {
  const items = parseFiles(files);

  if (!items.length) {
    return <Field label={label} value="-" />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500">{label}</div>
      <ul className="divide-y rounded-lg border border-gray-200">
        {items.map((f, i) => {
          const fileName = inferName(f);
          const href = toAbsoluteUrl(f.url || f.path || "");
          const sizeText = typeof f.size === "number" ? ` · ${formatBytes(f.size)}` : "";
          const isPreviewable = isPreviewMime(f.type || f.mime || "");

          return (
            <li key={(f.id as any) ?? `${fileName}-${i}`} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">{fileName}</div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {(f.type || f.mime || "파일")}{sizeText}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {/* 미리보기(가능한 포맷만) */}
                {href && isPreviewable && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
                    title="새 창에서 미리보기"
                  >
                    미리보기
                  </a>
                )}

                {/* 다운로드(인증 쿠키 포함) */}
                <button
                  onClick={() => downloadFile(f)}
                  className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs text-white hover:bg-blue-700"
                  title="파일 다운로드"
                >
                  다운로드
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function parseFiles(v: any): FileLike[] {
  try {
    const arr = Array.isArray(v) ? v : typeof v === "string" ? JSON.parse(v) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => (typeof x === "string" ? { url: x } : x))
      .filter((x) => x?.url || x?.path);
  } catch {
    return [];
  }
}

function inferName(f: FileLike): string {
  return (
    f.originalName ||
    f.name ||
    f.filename ||
    f.fileName ||
    (f.url ? decodeURIComponent(f.url.split("/").pop() || "") : "") ||
    (f.path ? decodeURIComponent(f.path.split("/").pop() || "") : "") ||
    "파일"
  );
}

function toAbsoluteUrl(url: string): string {
  if (!url) return "";
  try {
    // 절대경로면 그대로, 상대경로면 현재 origin 기준으로 변환
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

function isPreviewMime(mime: string): boolean {
  const m = mime.toLowerCase();
  return (
    m.startsWith("image/") ||
    m === "application/pdf" ||
    m.startsWith("text/")
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 인증이 필요한 파일도 안전하게 받기 위해 fetch + Blob으로 다운로드
 * (서버가 쿠키 인증을 쓸 경우 credentials: 'include' 필요)
 */
async function downloadFile(f: FileLike) {
  const href = toAbsoluteUrl(f.url || f.path || "");
  if (!href) return;

  const res = await fetchWithAuth(href, { credentials: "include" });
  if (!res.ok) {
    alert("파일 다운로드에 실패했습니다.");
    return;
  }
  const blob = await res.blob();

  // 파일명: Content-Disposition > 메타필드 > URL 추론
  let filename = inferName(f);
  const cd = res.headers.get("Content-Disposition") || res.headers.get("content-disposition");
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
    if (m?.[1]) filename = decodeURIComponent(m[1]);
  }

  const dlUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = dlUrl;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(dlUrl);
}

/* ====================== */
/*  견적서 표시용 미니 카드 */
/* ====================== */
function PartyReadOnlyCard({ title, p }: { title: string; p?: PartyInfo }) {
  const v = p || {};
  const Row = ({ k, v }: { k: string; v?: string }) => (
    <div className="flex items-start gap-2 text-sm">
      <div className="w-20 shrink-0 text-gray-500">{k}</div>
      <div className="min-w-0 break-words">{v || "-"}</div>
    </div>
  );
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="space-y-1">
        <Row k="상호" v={v.name} />
        <Row k="대표자" v={v.ceo} />
        <Row k="사업자번호" v={v.biz_no} />
        <Row k="담당자" v={v.charge_name} />
        <Row k="연락처" v={v.contact} />
        <Row k="이메일" v={v.email} />
        <Row k="주소" v={v.address} />
      </div>
    </div>
  );
}

function SeniorStatusBadge({ value }: { value?: string }) {
  const v = (value || "WAIT").toString().toUpperCase();

  const labelMap: Record<string, string> = {
    WAIT: "대기",
    IN_PROGRESS: "진행중",
    DONE: "완료",
  };
  const styleMap: Record<string, string> = {
    WAIT: "bg-gray-50 text-gray-700 ring-gray-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
    DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  const label = labelMap[v] || v;
  const cls = styleMap[v] || "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cls}`}
    >
      {label}
    </span>
  );
}
