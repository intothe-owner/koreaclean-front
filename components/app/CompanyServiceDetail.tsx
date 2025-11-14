"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { baseUrl, RequestForm, seniorStatusLabel, SeniorWorkRow } from "@/lib/variable";
import { type SRStatus } from "@/hooks/useServiceRequests";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import EstimateViewer from "./EstimateViewer";
import { getSeniorRows } from "@/lib/function";
/* ============================================================
 * 저장 / 미리보기 훅
 * ============================================================ */
function useSaveEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { requestId: number; estimate: EstimatePayload }) => {
      const { requestId, estimate } = params;
      const res = await fetchWithAuth(`${baseUrl}/request/${requestId}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(estimate),
      });
      if (!res.ok) throw new Error("견적 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

function usePreviewEstimate() {
  return useMutation({
    mutationFn: async (params: {
      requestId: number;
      estimate: EstimatePayload;
      endpoint?: string;
    }) => {
      const { requestId, estimate, endpoint } = params;

      const res = await fetchWithAuth(endpoint ?? `${baseUrl}/request/${requestId}/estimate/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(estimate),
      });

      if (!res.ok) {
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = await res.json();
            throw new Error(j?.message || j?.error || "PDF 생성 실패");
          }
          const t = await res.text();
          throw new Error(t || `PDF 생성 실패 (HTTP ${res.status})`);
        } catch (e: any) {
          throw new Error(e?.message || "PDF 생성 실패");
        }
      }

      return await res.blob(); // 성공 시 PDF blob
    },
  });
}
//경로당 날짜 상태 저장하기
function useSaveSeniorWorks() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      requestId: number;
      seniors: SeniorWorkRow[];
    }) => {
      const { requestId, seniors } = params;

      // 👉 백엔드에 맞게 엔드포인트만 조정하세요.
      const res = await fetchWithAuth(
        `${baseUrl}/request/${requestId}/seniors-json`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ seniors }),
        }
      );
      if (!res.ok) throw new Error("경로당 작업 정보 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      // 서비스 신청 목록/상세 다시 불러오기
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

/* ============================================================
 * 타입
 * ============================================================ */
type Props = {
  open: boolean;
  onClose: () => void;
  request?: RequestForm | null;
  onStatusChange?: (id: number, next: SRStatus) => void;
};

const statusLabel: Record<string, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
  CANCELLED: "취소",
};

type EstimateItem = {
  name: string; // 품명
  detail?: string; // 세부 공사내역
  qty?: number | null; // 수량(선택)
  unit?: string; // 단위(선택)
  unit_price?: number | null; // 단가(선택)
  amount: number; // 금액(항목 총액)
  note?: string; // 비고
};

type PartyInfo = {
  name?: string; // 상호/기관명
  biz_no?: string; // 사업자등록번호
  ceo?: string; // 대표자
  charge_name?: string; // 담당자
  contact?: string; // 연락처
  email?: string; // 이메일
  address?: string; // 주소
};

type EstimatePayload = {
  issue_date: string; // 견적일자
  valid_until?: string; // 유효기간
  title?: string; // 문서 제목
  supplier: PartyInfo; // 공급자
  client: PartyInfo; // 공급받는자
  items: EstimateItem[]; // 품목표
  subtotal: number; // 소계
  vat_rate: number; // 부가세율 (0 또는 0.1)
  vat: number; // 부가세
  total: number; // 합계
  vat_included?: boolean; // 부가세 포함가 여부
  memo?: string; // 비고/특약
};

/* ============================================================
 * 유틸
 * ============================================================ */
const onlyDigits = (s: string) => (s || "").replace(/[^\d]/g, "");
const toNumber = (s: string | number | null | undefined) =>
  typeof s === "number" ? s : Number(onlyDigits(String(s ?? "")) || "0");
const fmtWon = (n: number) => n.toLocaleString("ko-KR");

// 합계 계산: sum=항목 금액 합, rate=부가세율, included=부가세 포함가 여부
function calcTotals(sum: number, rate: number, included: boolean) {
  if (rate <= 0) return { subtotal: sum, vat: 0, total: sum };
  if (!included) {
    const vat = Math.floor(sum * rate);
    return { subtotal: sum, vat, total: sum + vat };
  }
  // 포함가: sum이 총액 → 소계/부가세 역산
  const total = sum;
  const subtotal = Math.round(total / (1 + rate));
  const vat = total - subtotal;
  return { subtotal, vat, total };
}

/** ✅ 서버에서 온 estimate 객체를 에디터 상태로 안전 변환 */
function normalizeFromServerEstimate(est: any) {
  if (!est || typeof est !== "object") return null;
  const asNum = (v: any) =>
    typeof v === "number" ? v : Number(String(v ?? "").replace(/[^\d.-]/g, "")) || 0;

  const items: EstimateItem[] = Array.isArray(est.items)
    ? est.items.map((it: any) => ({
        name: String(it?.name ?? ""),
        detail: it?.detail ? String(it.detail) : "",
        qty: it?.qty != null ? Number(it.qty) : null,
        unit: it?.unit ? String(it.unit) : "",
        unit_price: it?.unit_price != null ? asNum(it.unit_price) : null,
        amount: asNum(it?.amount),
        note: it?.note ? String(it.note) : "",
      }))
    : [];

  return {
    issue_date: est.issue_date || new Date().toISOString().slice(0, 10),
    valid_until: est.valid_until || "",
    title: est.title || "견적서",
    supplier: (est.supplier ?? {}) as PartyInfo,
    client: (est.client ?? {}) as PartyInfo,
    items,
    subtotal: asNum(est.subtotal),
    vat_rate: Number(est.vat_rate) === 0.1 ? 0.1 : 0,
    vat: asNum(est.vat),
    total: asNum(est.total),
    vat_included: !!est.vat_included,
    memo: est.memo ? String(est.memo) : "",
  };
}

/* ============================================================
 * 메인 모달
 * ============================================================ */
export default function CompanyServiceDetail({
  open,
  onClose,
  request,
  onStatusChange,
}: Props) {
  const created = useMemo(
    () => (request as any)?.created_at || (request as any)?.createdAt || "-",
    [request]
  );
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

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-[101] w-full max-w-4xl rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">서비스 신청 상세</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              견적서 작성 · 저장 · PDF 미리보기
            </p>
          </div>
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
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
          {!request ? (
            <div className="py-8 text-center text-sm text-gray-500">
              데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-8">
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
                      {statusLabel[
                        (request.status || "WAIT").toString().toUpperCase()
                      ] || request.status}
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
                <Field label="특이사항" value={request.etc || "-"} multiline />
              </section>
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
                              <SeniorTableEditor request={request} />
              
                              
              
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
              <hr className="border-gray-200" />

              {/* ✅ 견적 쓰기 섹션 */}
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-semibold">견적 쓰기</div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      품목별 금액은 ‘부가세 포함 여부’ 설정에 따라 합계가 자동 계산됩니다.
                    </p>
                  </div>
                </div>

                {/* 데스크탑 폼 */}
                <div className="hidden md:block">
                  <EstimateEditorDesktop open={open} request={request} />
                </div>

                {/* 모바일 폼 */}
                <div className="md:hidden">
                  <EstimateEditorMobile open={open} request={request} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          {request && onStatusChange && (
            <div className="mr-auto flex items-center gap-2">
              <label className="text-xs text-gray-600">상태 변경</label>
              <select
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={(request.status || "WAIT").toString().toUpperCase()}
                onChange={(e) =>
                  onStatusChange(
                    (request as any)?.id ?? 0,
                    e.target.value as SRStatus
                  )
                }
              >
                <option value="WAIT">대기</option>
                <option value="IN_PROGRESS">진행중</option>
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

/* ============================================================
 * 공통 Field
 * ============================================================ */
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
      <div
        className={`mt-1 ${multiline ? "whitespace-pre-wrap" : "truncate"} text-sm text-gray-900`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

/* ============================================================
 * 견적 쓰기: 데스크탑
 * ============================================================ */
function EstimateEditorDesktop({ request, open }: { request: RequestForm; open: boolean }) {
  const { mutateAsync: saveEstimate, isPending } = useSaveEstimate();
  const { mutateAsync: previewEstimate, isPending: isPreviewing } = usePreviewEstimate();

  const [supplier, setSupplier] = useState<PartyInfo>({
    name: "",
    biz_no: "",
    ceo: "",
    charge_name: "",
    contact: "",
    email: "",
    address: "",
  });
  const [client, setClient] = useState<PartyInfo>({
    name: request.org_name || "",
    charge_name: request.contact_name || "",
    contact: request.contact_phone || request.contact_tel || "",
    email: request.contact_email || "",
    address: "",
    biz_no: "",
    ceo: "",
  });

  const today = new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState<string>(today);
  const [validUntil, setValidUntil] = useState<string>("");

  const [items, setItems] = useState<EstimateItem[]>([
    { name: "", detail: "", qty: null, unit: "", unit_price: null, amount: 0, note: "" },
  ]);

  const [vatRate, setVatRate] = useState<number>(0.1);
  const [vatIncluded, setVatIncluded] = useState<boolean>(false); // 포함가 여부
  const [memo, setMemo] = useState<string>("");

  // 0% 선택 시 포함 체크 비활성/해제
  useEffect(() => {
    if (vatRate === 0 && vatIncluded) setVatIncluded(false);
  }, [vatRate, vatIncluded]);

  /** ✅ 서버 견적 로드 */
  const loadFromRequest = () => {
    const est = (request as any)?.estimate;
    console.log('request',request);
    const norm = normalizeFromServerEstimate(est);
    if (!norm) return;

    // 요청 기본값 + 서버값 merge (서버가 우선)
    const baseClient: PartyInfo = {
      name: request.org_name || "",
      charge_name: request.contact_name || "",
      contact: request.contact_phone || request.contact_tel || "",
      email: request.contact_email || "",
    };

    setSupplier(norm.supplier || {});
    setClient({ ...baseClient, ...(norm.client || {}) });
    setItems(
      norm.items && norm.items.length
        ? norm.items
        : [{ name: "", detail: "", qty: null, unit: "", unit_price: null, amount: 0, note: "" }]
    );
    setIssueDate(norm.issue_date);
    setValidUntil(norm.valid_until || "");
    setVatRate(norm.vat_rate);
    setVatIncluded(!!norm.vat_included);
    setMemo(norm.memo || "");
  };

  // 🔑 estimate 내용 변화 & 모달 열림에 반응해서 항상 주입
  const estimateKey = useMemo(
    () => JSON.stringify((request as any)?.estimate ?? {}),
    [request]
  );
  useEffect(() => {
    loadFromRequest();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.id, estimateKey]);

  const updateItem = (idx: number, patch: Partial<EstimateItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      { name: "", detail: "", qty: null, unit: "", unit_price: null, amount: 0, note: "" },
    ]);

  const removeRow = (idx: number) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  // 합계 계산(포함/별도 모두 지원)
  const sumAmount = items.reduce((sum, it) => sum + toNumber(it.amount), 0);
  const { subtotal, vat, total } = calcTotals(sumAmount, vatRate, vatIncluded);

  const payload: EstimatePayload = {
    issue_date: issueDate,
    valid_until: validUntil || undefined,
    title: "견적서",
    supplier,
    client,
    items: items.map((x) => ({
      ...x,
      qty: x.qty ?? undefined,
      unit_price: x.unit_price ?? undefined,
      detail: x.detail?.trim() ? x.detail : undefined,
      note: x.note?.trim() ? x.note : undefined,
    })),
    subtotal,
    vat_rate: vatRate,
    vat,
    total,
    vat_included: vatIncluded,
    memo: memo?.trim() ? memo : undefined,
  };

  const handleSave = async () => {
    try {
      await saveEstimate({ requestId: Number(request.id), estimate: payload });
      alert("견적이 저장되었습니다.");
    } catch (e: any) {
      alert(e?.message || "저장 중 오류가 발생했습니다.");
    }
  };

  const handlePreview = async () => {
    const previewTab = window.open("about:blank", "_blank");
    try {
      const blob = await previewEstimate({
        requestId: Number(request.id),
        estimate: payload,
      });

      const pdfUrl = URL.createObjectURL(blob);
      if (previewTab) {
        previewTab.location.href = pdfUrl;
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      } else {
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "estimate.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      }
    } catch (e: any) {
      if (previewTab && !previewTab.closed) previewTab.close();
      alert(e?.message || "PDF 미리보기 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-4 shadow-sm">
      {/* 상단 헤더 */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-bold tracking-wide">견 적 서</div>
          <div className="mt-1 text-xs text-gray-500">Estimate</div>
        </div>
        
      </div>

      {/* 공급자/공급받는자 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PartyCard title="공급자" value={supplier} onChange={setSupplier} />
        <PartyCard title="공급받는자" value={client} onChange={setClient} />
      </div>

      {/* 품목 테이블 */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-300">
        <table className="min-w-[920px] table-fixed text-sm border-gray-300">
          <colgroup>
            <col className="w-[160px]" />
            <col />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[120px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
            <col className="w-[64px]" />
          </colgroup>
          <thead className="bg-gray-50 text-[13px] text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">품명</th>
              <th className="px-3 py-2 text-left">세부 공사내역</th>
              <th className="px-2 py-2 text-right">수량</th>
              <th className="px-2 py-2 text-center">단위</th>
              <th className="px-2 py-2 text-right">단가</th>
              <th className="px-3 py-2 text-right">금액</th>
              <th className="px-3 py-2 text-left">비고</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((it, i) => (
              <tr key={i} className="align-top hover:bg-gray-50/60 border-gray-300">
                <td className="px-3 py-2">
                  <input
                    className="w-full rounded border border-gray-200 px-2 py-1"
                    value={it.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                    placeholder="예) 에어컨 실내기 분해세척"
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    className="w-full resize-y rounded border border-gray-200 px-2 py-1"
                    rows={2}
                    value={it.detail || ""}
                    onChange={(e) => updateItem(i, { detail: e.target.value })}
                    placeholder="세부 공사 내용"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    inputMode="numeric"
                    className="w-full rounded border border-gray-200 px-2 py-1 text-right"
                    value={it.qty ?? ""}
                    onChange={(e) =>
                      updateItem(i, {
                        qty: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className="w-full rounded border border-gray-200 px-2 py-1 text-center"
                    value={it.unit || ""}
                    onChange={(e) => updateItem(i, { unit: e.target.value })}
                    placeholder="대/EA"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    inputMode="numeric"
                    className="w-full rounded border border-gray-200 px-2 py-1 text-right"
                    value={it.unit_price ?? ""}
                    onChange={(e) =>
                      updateItem(i, {
                        unit_price: e.target.value
                          ? Number(onlyDigits(e.target.value))
                          : null,
                      })
                    }
                    placeholder="단가"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    inputMode="numeric"
                    className="w-full rounded border border-gray-200 px-2 py-1 text-right"
                    value={it.amount ? fmtWon(toNumber(it.amount)) : ""}
                    onChange={(e) => updateItem(i, { amount: toNumber(e.target.value) })}
                    placeholder="금액"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full rounded border border-gray-200 px-2 py-1"
                    value={it.note || ""}
                    onChange={(e) => updateItem(i, { note: e.target.value })}
                    placeholder="비고"
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => removeRow(i)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 합계/부가세/포함 체크 + 2행 레이아웃 */}
      <div className="mt-4 space-y-3">
        {/* 1행: 행추가 + 부가세 카드 */}
        <div className="grid gap-3 sm:grid-cols-[auto_minmax(320px,1fr)] items-stretch">
          <div className="flex items-center">
            <button
              onClick={addRow}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              + 행 추가
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">부가세</span>
              <select
                className="rounded border border-gray-200 px-2 py-1 text-sm"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
              >
                <option value={0}>면세(0%)</option>
                <option value={0.1}>10%</option>
              </select>
            </div>

            <label className="ml-2 inline-flex select-none items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={vatIncluded}
                onChange={(e) => setVatIncluded(e.target.checked)}
                disabled={vatRate === 0}
              />
              <span className={vatRate === 0 ? "text-gray-400" : ""}>
                부가세 포함(포함가 입력)
              </span>
            </label>

            <span className="ml-auto font-medium">{fmtWon(vat)} 원</span>
          </div>
        </div>

        {/* 2행: 소계 + 합계 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-[220px]">
            <AmountRow label="소 계" value={subtotal} />
          </div>
          <div className="min-w-[220px]">
            <AmountRow label="합 계" value={total} strong />
          </div>
        </div>
      </div>

      {/* 메모/특약 */}
      <div className="mt-4">
        <label className="mb-1 block text-xs text-gray-500">비고 / 특약</label>
        <textarea
          className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="납기, 결제조건, 기타 특약 등을 기재하세요."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {/* 액션 버튼 그룹 */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={handlePreview}
          disabled={isPreviewing}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          title="PDF 미리보기"
        >
          {isPreviewing ? "생성 중…" : "PDF 미리보기"}
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "저장 중…" : "견적 저장"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * 견적 쓰기: 모바일
 * ============================================================ */
function EstimateEditorMobile({ request, open }: { request: RequestForm; open: boolean }) {
  const { mutateAsync: saveEstimate, isPending } = useSaveEstimate();
  const { mutateAsync: previewEstimate, isPending: isPreviewing } = usePreviewEstimate();

  const [supplier, setSupplier] = useState<PartyInfo>({
    name: "",
    biz_no: "",
    ceo: "",
    charge_name: "",
    contact: "",
    email: "",
    address: "",
  });
  const [client, setClient] = useState<PartyInfo>({
    name: request.org_name || "",
    charge_name: request.contact_name || "",
    contact: request.contact_phone || request.contact_tel || "",
    email: request.contact_email || "",
  });

  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState<string>("");

  const emptyItem: EstimateItem = {
    name: "",
    detail: "",
    qty: null,
    unit: "",
    unit_price: null,
    amount: 0,
    note: "",
  };
  const [items, setItems] = useState<EstimateItem[]>([{ ...emptyItem }]);

  const [vatRate, setVatRate] = useState<number>(0.1);
  const [vatIncluded, setVatIncluded] = useState<boolean>(false);
  const [memo, setMemo] = useState<string>("");

  useEffect(() => {
    if (vatRate === 0 && vatIncluded) setVatIncluded(false);
  }, [vatRate, vatIncluded]);

  /** ✅ 서버 견적 로드 */
  const loadFromRequest = () => {
    const est = (request as any)?.estimate;
    const norm = normalizeFromServerEstimate(est);
    if (!norm) return;

    const baseClient: PartyInfo = {
      name: request.org_name || "",
      charge_name: request.contact_name || "",
      contact: request.contact_phone || request.contact_tel || "",
      email: request.contact_email || "",
    };

    setSupplier(norm.supplier || {});
    setClient({ ...baseClient, ...(norm.client || {}) });
    setItems(norm.items && norm.items.length ? norm.items : [{ ...emptyItem }]);
    setIssueDate(norm.issue_date);
    setValidUntil(norm.valid_until || "");
    setVatRate(norm.vat_rate);
    setVatIncluded(!!norm.vat_included);
    setMemo(norm.memo || "");
  };

  const estimateKey = useMemo(
    () => JSON.stringify((request as any)?.estimate ?? {}),
    [request]
  );
  useEffect(() => {
    loadFromRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.id, estimateKey]);

  const changeItem = (idx: number, patch: Partial<EstimateItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addRow = () => setItems((p) => [...p, { ...emptyItem }]);
  const delRow = (idx: number) => setItems((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)));

  const sumAmount = items.reduce((s, it) => s + toNumber(it.amount), 0);
  const { subtotal, vat, total } = calcTotals(sumAmount, vatRate, vatIncluded);

  const payload: EstimatePayload = {
    issue_date: issueDate,
    valid_until: validUntil || undefined,
    title: "견적서",
    supplier,
    client,
    items,
    subtotal,
    vat_rate: vatRate,
    vat,
    total,
    vat_included: vatIncluded,
    memo: memo?.trim() ? memo : undefined,
  };

  const handleSave = async () => {
    try {
      await saveEstimate({ requestId: Number(request.id), estimate: payload });
      alert("견적이 저장되었습니다.");
    } catch (e: any) {
      alert(e?.message || "저장 중 오류가 발생했습니다.");
    }
  };

  const handlePreview = async () => {
    const previewTab = window.open("about:blank", "_blank");
    try {
      const blob = await previewEstimate({
        requestId: Number(request.id),
        estimate: payload,
      });

      const pdfUrl = URL.createObjectURL(blob);
      if (previewTab) {
        previewTab.location.href = pdfUrl;
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      } else {
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "estimate.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      }
    } catch (e: any) {
      if (previewTab && !previewTab.closed) previewTab.close();
      alert(e?.message || "PDF 미리보기 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-3 shadow-sm">
      <div className="mb-3">
        <div className="text-xl font-bold">견 적 서</div>
        <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
          <LabeledInput label="견적일자" type="date" value={issueDate} onChange={setIssueDate} />
          <LabeledInput label="유효기간" type="date" value={validUntil} onChange={setValidUntil} />
          <button
            type="button"
            onClick={loadFromRequest}
            className="col-span-2 mt-1 rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
          >
            서버에 저장된 견적 불러오기
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <PartyCard title="공급자" value={supplier} onChange={setSupplier} compact />
        <PartyCard title="공급받는자" value={client} onChange={setClient} compact />
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border p-3">
            <LabeledInput label="품명" value={it.name} onChange={(v) => changeItem(i, { name: v })} />
            <LabeledTextarea label="세부 공사내역" rows={3} value={it.detail || ""} onChange={(v) => changeItem(i, { detail: v })} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <LabeledInput label="수량" inputMode="numeric" value={it.qty ?? ""} onChange={(v) => changeItem(i, { qty: v ? Number(v) : null })} />
              <LabeledInput label="단위" value={it.unit || ""} onChange={(v) => changeItem(i, { unit: v })} />
              <LabeledInput label="단가" inputMode="numeric" value={it.unit_price ?? ""} onChange={(v) => changeItem(i, { unit_price: v ? Number(onlyDigits(v)) : null })} />
            </div>
            <div className="mt-2">
              <LabeledInput label="금액" inputMode="numeric" value={it.amount ? fmtWon(toNumber(it.amount)) : ""} onChange={(v) => changeItem(i, { amount: toNumber(v) })} />
            </div>
            <div className="mt-2">
              <LabeledInput label="비고" value={it.note || ""} onChange={(v) => changeItem(i, { note: v })} />
            </div>

            <div className="mt-2 text-right">
              <button onClick={() => delRow(i)} className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50">
                행 삭제
              </button>
            </div>
          </div>
        ))}

        <button onClick={addRow} className="w-full rounded-xl border px-3 py-3 text-sm hover:bg-gray-50">
          + 행 추가
        </button>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border p-3 text-sm">
        <AmountRow label="소 계" value={subtotal} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500">부가세</span>
          <select className="rounded border px-2 py-1 text-sm" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))}>
            <option value={0}>면세(0%)</option>
            <option value={0.1}>10%</option>
          </select>

          <label className="ml-1 inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={vatIncluded}
              onChange={(e) => setVatIncluded(e.target.checked)}
              disabled={vatRate === 0}
            />
            <span className={`text-sm ${vatRate === 0 ? "text-gray-400" : ""}`}>부가세 포함(포함가 입력)</span>
          </label>

          <span className="ml-auto font-medium">{fmtWon(vat)} 원</span>
        </div>
        <AmountRow label="합 계" value={total} strong />
      </div>

      <div className="mt-3">
        <LabeledTextarea label="비고 / 특약" rows={3} value={memo} onChange={setMemo} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-8">
        <button
          onClick={handlePreview}
          disabled={isPreviewing}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          title="PDF 미리보기"
        >
          {isPreviewing ? "생성 중…" : "PDF 미리보기"}
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "저장 중…" : "견적 저장"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * 소형 구성요소
 * ============================================================ */
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function AmountRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
        strong ? "bg-gray-900 text-white" : ""
      }`}
    >
      <span className={`text-gray-500 ${strong ? "text-gray-200" : ""}`}>{label}</span>
      <span className="font-medium">{fmtWon(value)} 원</span>
    </div>
  );
}

function PartyCard({
  title,
  value,
  onChange,
  compact,
}: {
  title: string;
  value: PartyInfo;
  onChange: (v: PartyInfo) => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <LabeledInput
          label="상호/기관명"
          value={value.name || ""}
          onChange={(v) => onChange({ ...value, name: v })}
        />
        <LabeledInput
          label="사업자등록번호"
          value={value.biz_no || ""}
          onChange={(v) => onChange({ ...value, biz_no: v })}
        />
        <LabeledInput
          label="대표자"
          value={value.ceo || ""}
          onChange={(v) => onChange({ ...value, ceo: v })}
        />
        <LabeledInput
          label="담당자"
          value={value.charge_name || ""}
          onChange={(v) => onChange({ ...value, charge_name: v })}
        />
        <LabeledInput
          label="연락처"
          value={value.contact || ""}
          onChange={(v) => onChange({ ...value, contact: v })}
        />
        <LabeledInput
          label="이메일"
          value={value.email || ""}
          onChange={(v) => onChange({ ...value, email: v })}
        />
        <div className={compact ? "" : "col-span-2"}>
          <LabeledInput
            label="주소"
            value={value.address || ""}
            onChange={(v) => onChange({ ...value, address: v })}
          />
        </div>
      </div>
    </div>
  );
}
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




/* ============================================================
 * 경로당 작업일·작업내역·상태 편집 테이블
 * ============================================================ */
function SeniorTableEditor({ request }: { request: RequestForm }) {
  const requestId = (request as any)?.id;
  const [rows, setRows] = useState<SeniorWorkRow[]>([]);
  const { mutateAsync: saveSeniorWorks, isPending } = useSaveSeniorWorks();

  // 최초 로딩 + request 변경 시 경로당 행 세팅
  useEffect(() => {
    const baseRows =
      getSeniorRows(
        (request as any)?.seniors ?? (request as any)?.seniorInfo
      ) || [];

    const normalized = baseRows.map((s: any, idx: number) => ({
      id: s.id ?? idx,
      name: String(s.name ?? ""),
      address: s.address ?? "",
      // 날짜는 YYYY-MM-DD까지만 사용
      work_date: s.work_date ? String(s.work_date).slice(0, 10) : "",
      work: s.work ?? "",
      status: s.status || s.work_status || "WAIT", // 기본값 대기
    }));

    setRows(normalized);
  }, [request]);

  const handleChangeRow = (
    index: number,
    patch: Partial<SeniorWorkRow>
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const handleSave = async () => {
    if (!requestId) {
      alert("요청 ID가 없습니다.");
      return;
    }
    try {
      await saveSeniorWorks({
        requestId: Number(requestId),
        seniors: rows,
      });
      alert("경로당 작업 정보가 저장되었습니다.");
    } catch (e: any) {
      alert(e?.message || "경로당 작업 정보 저장 중 오류가 발생했습니다.");
    }
  };

  if (!rows.length) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>경로당 목록</span>
        </div>
        <div className="text-sm text-gray-500">-</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>경로당 목록</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "저장 중…" : "작업 정보 저장"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[180px]" />
            <col className="w-[120px]" />
            <col />
            <col className="w-[120px]" />
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
            {rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                className="align-top hover:bg-gray-50/60"
              >
                {/* 경로당 이름/주소 (읽기 전용) */}
                <td className="px-3 py-2">
                  <div className="font-medium">{row.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {row.address || "-"}
                  </div>
                </td>

                {/* 작업일 입력 */}
                <td className="px-3 py-2 align-middle">
                  <input
                    type="date"
                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                    value={row.work_date || ""}
                    onChange={(e) =>
                      handleChangeRow(i, { work_date: e.target.value })
                    }
                  />
                </td>

                {/* 작업내역 입력 */}
                <td className="px-3 py-2">
                  <textarea
                    className="w-full resize-y rounded border border-gray-200 px-2 py-1 text-xs"
                    rows={2}
                    value={row.work || ""}
                    placeholder="예) 에어컨 실내기 분해세척, 실외기 고압세척 등"
                    onChange={(e) =>
                      handleChangeRow(i, { work: e.target.value })
                    }
                  />
                </td>

                {/* 상태 변경 셀렉트 */}
                <td className="px-3 py-2 align-middle">
                  <select
                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                    value={row.status || "WAIT"}
                    onChange={(e) =>
                      handleChangeRow(i, { status: e.target.value })
                    }
                  >
                    {Object.entries(seniorStatusLabel).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
