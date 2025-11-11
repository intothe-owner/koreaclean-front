// components/admin/ServiceRequestDetailModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SRStatus } from "@/hooks/useServiceRequests";
import { RequestForm } from "@/lib/variable";
import { getSeniorRows } from "@/lib/function";

import { useCompanies } from "@/hooks/useCompanies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AssRegionMultiSelect from "../ui/AssRegionMultiSelect";
import EstimateViewer from "../app/EstimateViewer";
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

export default function ServiceRequestDetailModal({
  open,
  onClose,
  request,
  onEdit,
  onStatusChange,
}: Props) {
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);
  console.log(request);
  // ✅ 서비스요청 상태 컨트롤드
  const [statusValue, setStatusValue] = useState<SRStatus>("WAIT");
  useEffect(() => {
    const cur = String(request?.status || "WAIT").toUpperCase() as SRStatus;
    setStatusValue(cur);
  }, [request?.id, request?.status, open]);

  // 지역 멀티셀렉트 상태 (선택 중)
  const [regions, setRegions] = useState<string[]>([]);
  // '선택 완료'로 적용된 지역
  const [appliedRegions, setAppliedRegions] = useState<string[]>([]);

  // 모달 파일에서 params 만들기 전에
  const stableRegions = useMemo(
    () => (appliedRegions.length ? [...appliedRegions].sort() : []),
    [appliedRegions]
  );

  // 승인 업체 목록 (적용된 지역 기준으로만 조회)
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
  // 서비스 타입/기타 텍스트 파생값
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

  // 백엔드 필드 유연 대응 (service_types_other 가 표준)
  const otherText: string = useMemo(() => {
    return (
      (request as any)?.service_types_other ??
      (request as any)?.service_type_other ??   // 혹시 다른 이름을 썼을 경우 대비
      (request as any)?.other_service ??        // 폼 단계에서 임시로 썼던 이름 대비
      ""
    );
  }, [request]);
  if (!open) return null;

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
                <Field label="희망일" value={request.hope_date || "-"} />

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


                {/* 경로당 목록 (name/address) */}
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
                            <col />
                            <col />
                          </colgroup>
                          <thead className="border-b bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">경로당</th>
                              <th className="px-3 py-2 text-left font-semibold">작업일</th>
                              <th className="px-3 py-2 text-left font-semibold">작업내역</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {rows.map((s: any, i: number) => {
                              const key = s.id ?? i;

                              const workDate = s?.work_date;
                              const workText = s?.work;
                              return (
                                <tr key={key} className="align-top hover:bg-gray-50/60">
                                  <td className="px-3 py-2">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="mt-1 text-xs text-gray-500">{s.address || "-"}</div>
                                  </td>
                                  <td className="px-3 py-2">
                                    {workDate}
                                  </td>
                                  <td className="px-3 py-2">
                                    {workText}
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

                {/* 업체 배정 (지역 선택) - latest_assignment가 ACCEPTED가 아니면 노출 */}
                {request?.latest_assignment?.status !== "ACCEPTED" ? (
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="mb-2 text-xs font-semibold text-gray-700">업체 배정 (지역 기반)</div>

                    {/* 시/도 > 구/군 다중 선택 */}
                    <AssRegionMultiSelect
                      label="검색 지역"
                      value={regions}
                      onChange={setRegions}
                      onApply={(next) => setAppliedRegions([...next])} // ⬅️ 새 배열로 설정
                      className="mb-3"
                    />

                    {/* 적용 전 안내 */}
                    {appliedRegions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                        지역을 선택한 뒤 <b>선택 완료</b>를 눌러주세요. 업체 목록이 표시됩니다.
                      </div>
                    ) : (
                      // 승인 업체 결과 리스트 (적용된 지역 기준)
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
                ) : null}

                {/* 특이사항 */}
                <Field label="특이사항" value={request.etc || "-"} multiline />

                {/* ✅ 첨부파일: 다운로드/미리보기 지원 */}
                {!!request?.files && <FilesList label="첨부파일" files={request.files} />}

                {/* ✅ 견적서 (읽기 전용 + PDF 다운로드 버튼) */}
                <EstimateViewer
                  estimate={(request as any)?.estimate}
                  requestId={(request as any)?.id}
                  downloadEndpoint={`/backend/request/${(request as any)?.id}/estimate/preview`}
                />
              </section>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          {request && onStatusChange && (
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={statusValue} // ✅ 컨트롤드
                onChange={async (e) => {
                  const next = e.target.value as SRStatus;

                  // (선택) 민감 전환 시 확인—원치 않으면 제거 가능
                  const needConfirm =
                    (statusValue !== "CANCELLED" && next === "CANCELLED") ||
                    (statusValue !== "WAIT" && next === "WAIT");
                  if (needConfirm) {
                    const ok = confirm(
                      next === "CANCELLED"
                        ? "이 요청을 '취소' 상태로 변경할까요?"
                        : "이 요청을 '대기' 상태로 변경할까요?"
                    );
                    if (!ok) return;
                  }

                  setStatusValue(next); // UI 즉시 반영
                  onStatusChange((request as any)?.id ?? 0, next); // 서버 반영 콜백
                }}
              >
                <option value="">상태변경</option>
                <option value="WAIT">대기</option>
                {
                  request?.status !== 'IN_PROGRESS' ?
                    <option value="IN_PROGRESS">진행중</option> : null
                }

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
      .filter((x) => (x?.url || x?.path));
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
