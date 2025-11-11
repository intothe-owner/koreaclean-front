// components/admin/EstimateViewer.tsx
"use client";

import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import React from "react";

/* ---------- 타입 ---------- */
export type PartyInfo = {
  name?: string;
  biz_no?: string;
  ceo?: string;
  charge_name?: string;
  contact?: string;
  email?: string;
  address?: string;
};

export type EstimateItem = {
  name: string;
  detail?: string;
  qty?: number | null;
  unit?: string;
  unit_price?: number | null;
  amount: number;
  note?: string;
};

export type EstimateData = {
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

/* ---------- 유틸 ---------- */
const fmtWon = (n: number | undefined | null) =>
  (typeof n === "number" ? n : 0).toLocaleString("ko-KR");

const toDateOnly = (v?: string | Date | null) => {
  if (!v) return "-";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return "-";
};

function normalizeEstimate(e: any): EstimateData {
  if (!e || typeof e !== "object")
    return { items: [], subtotal: 0, vat_rate: 0, vat: 0, total: 0, vat_included: false };
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

/* ---------- 내부 소컴포넌트 ---------- */
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

/* ---------- 외부 인터페이스 ---------- */
export type EstimateViewerProps = {
  /** 서버에서 받은 원본 estimate(JSON or object) */
  estimate?: any;
  /** request id (PDF 다운로드 엔드포인트 자동 구성에 사용) */
  requestId?: number;
  /** 커스텀 다운로드 엔드포인트 (기본: /backend/request/:id/estimate/preview) */
  downloadEndpoint?: string;
  /** 다운로드 버튼 표시 여부 (기본: true) */
  showDownload?: boolean;
  /** 타이틀 영역 숨김 여부 (기본: false) */
  hideHeader?: boolean;
};

export default function EstimateViewer({
  estimate,
  requestId,
  downloadEndpoint,
  showDownload = true,
  hideHeader = false,
}: EstimateViewerProps) {
  const est = normalizeEstimate(estimate);

  const hasAnyEstimate =
    !!est?.supplier?.name ||
    !!est?.client?.name ||
    (Array.isArray(est?.items) && est.items!.length > 0) ||
    (est?.total ?? 0) > 0 ||
    (est?.subtotal ?? 0) > 0;

  const endpoint =
    downloadEndpoint ||
    (typeof requestId === "number"
      ? `/backend/request/${requestId}/estimate/preview`
      : undefined);

  async function downloadEstimatePdf() {
    if (!endpoint) return;
    try {
      const res = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(est),
      });
      if (!res.ok) throw new Error("PDF 생성 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = (est.title || "estimate").replace(/[^\w가-힣_-]/g, "");
      const date = toDateOnly(est.issue_date || new Date().toISOString());
      a.href = url;
      a.download = `${base}_${requestId ?? "preview"}_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "PDF 다운로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      {!hideHeader && (
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">{est.title || "견적서"}</div>
            <div className="mt-0.5 text-xs text-gray-500">
              견적일자: {toDateOnly(est.issue_date)}
              {est.valid_until ? ` · 유효기간: ${toDateOnly(est.valid_until)}` : ""}
            </div>
          </div>
          {showDownload && endpoint && (
            <button
              onClick={downloadEstimatePdf}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              title="PDF 다운로드"
            >
              PDF 다운로드
            </button>
          )}
        </div>
      )}

      {!hasAnyEstimate ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          등록된 견적이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {/* 공급자/공급받는자 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PartyReadOnlyCard title="공급자" p={est.supplier} />
            <PartyReadOnlyCard title="공급받는자" p={est.client} />
          </div>

          {/* 품목표 */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[720px] table-fixed text-sm">
              <colgroup>
                <col className="w-[160px]" />
                <col className="w-[80px]" />
                <col className="w-[80px]" />
                <col className="w-[120px]" />
                <col className="w-[140px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead className="bg-gray-50 text-[13px] text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">품명</th>
                  <th className="px-2 py-2 text-right">수량</th>
                  <th className="px-2 py-2 text-center">단위</th>
                  <th className="px-2 py-2 text-right">단가</th>
                  <th className="px-3 py-2 text-right">금액</th>
                  <th className="px-3 py-2 text-left">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(est.items ?? []).map((it, i) => (
                  <tr key={i} className="align-top hover:bg-gray-50/60">
                    <td className="px-3 py-2">{it.name || "-"}</td>
                    <td className="px-2 py-2 text-right">{it.qty ?? ""}</td>
                    <td className="px-2 py-2 text-center">{it.unit || ""}</td>
                    <td className="px-2 py-2 text-right">
                      {it.unit_price != null ? fmtWon(it.unit_price) : ""}
                    </td>
                    <td className="px-3 py-2 text-right">{fmtWon(it.amount)}</td>
                    <td className="px-3 py-2">{it.note || ""}</td>
                  </tr>
                ))}
                {(est.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      품목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 합계/부가세 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="text-gray-500">부가세</div>
                <div className="font-medium">
                  {est.vat_rate === 0.1 ? "10%" : "면세(0%)"}
                  {est.vat_rate === 0.1 && (
                    <span className="ml-2 text-xs text-gray-500">
                      {est.vat_included ? "· 포함가" : "· 별도"}
                    </span>
                  )}
                </div>
                <div className="ml-auto font-medium">{fmtWon(est.vat)} 원</div>
              </div>
            </div>
            <div className="rounded-lg border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">소 계</span>
                <span className="font-medium">{fmtWon(est.subtotal)} 원</span>
              </div>
            </div>
            <div className="sm:col-span-2 rounded-lg border px-3 py-2 text-white bg-gray-900">
              <div className="flex items-center justify-between text-sm">
                <span>합 계</span>
                <span className="font-semibold">{fmtWon(est.total)} 원</span>
              </div>
            </div>
          </div>

          {/* 메모/특약 */}
          {est.memo && est.memo.trim() && (
            <div className="rounded-lg border px-3 py-2 text-sm">
              <div className="mb-1 text-xs text-gray-500">비고 / 특약</div>
              <div className="whitespace-pre-wrap">{est.memo}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
