"use client";

import React, { useEffect, useRef, useState } from "react";
import { getCompanyStatusLabel, STATUS_BY_DB, getNextStatusOptions, DbStatus } from "@/lib/status";
import { useUpdateCompanyStatus } from "@/hooks/useCompanies";
import { CompanyItem } from "@/lib/variable";

function StatusBadge({ value }: { value?: string }) {
  const label = getCompanyStatusLabel(value);
  const badge = (STATUS_BY_DB as any)[
    (Object.keys(STATUS_BY_DB) as DbStatus[]).find((k) => getCompanyStatusLabel(k) === label) || "PENDING"
  ]?.badge;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${badge}`}>{label}</span>;
}

export default function CompanyDetailModal({
  open,
  onClose,
  company,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  company?: CompanyItem | null;
  onEdit?: (c: CompanyItem) => void;
  onDelete?: (c: CompanyItem) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ✅ 훅은 항상 컴포넌트 최상단에서 호출
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // ✅ company가 없어도 안전한 기본값으로 계산 (훅 위에서 company 의존 X)
  const curr = ((company?.status as DbStatus) ?? "PENDING") as DbStatus;
  const options = getNextStatusOptions(curr);

  const [nextStatus, setNextStatus] = useState<DbStatus | "">("");
  useEffect(() => setNextStatus(""), [curr, open]);

  const { mutateAsync, isPending } = useUpdateCompanyStatus();

  // ⛳ 모든 훅 호출이 끝난 뒤에 조건부 리턴
  if (!open || !company) return null;

  const extractRegion = (address?: string) => {
    if (!address) return "-";
    const p = address.split(" ").filter(Boolean);
    return p[0] || "-";
    };

  const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 break-words">{value || "-"}</div>
    </div>
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-detail-title"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 id="company-detail-title" className="truncate text-lg font-semibold">
              {company.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <StatusBadge value={company.status} />
              {company.company_type && <span className="rounded bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">{company.company_type}</span>}
              {company.start_date && <span>설립일 {company.start_date}</span>}
              <span>지역 {extractRegion(company.address)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={() => onEdit(company)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(company)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
              >
                삭제
              </button>
            )}
            <button ref={closeBtnRef} onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              닫기
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="grid grid-cols-1 gap-6 px-5 py-5 md:grid-cols-2">
          <Field label="대표자명" value={company.ceo} />
          <Field label="대표번호" value={company.tel} />
          <Field label="사업자번호" value={company.biz_no} />
          <Field label="법인번호" value={company.corp_no} />
          <Field label="이메일" value={company.email} />
          <Field
            label="홈페이지"
            value={
              company.homepage ? (
                <a href={company.homepage} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  {company.homepage}
                </a>
              ) : (
                "-"
              )
            }
          />
          <Field label="우편번호" value={company.post_code} />
          <Field label="좌표(위도/경도)" value={company.lat && company.lng ? `${company.lat}, ${company.lng}` : "-"} />

          <div className="md:col-span-2">
            <Field
              label="주소"
              value={
                <>
                  <div>{company.address || "-"}</div>
                  {company.address_detail && <div className="text-gray-600">{company.address_detail}</div>}
                </>
              }
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-gray-500">주력 지역</div>
            <div className="flex flex-wrap gap-1">
              {(company.regions || []).length
                ? company.regions!.map((r, i) => (
                    <span key={i} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs ring-1 ring-gray-200">
                      {r}
                    </span>
                  ))
                : "-" }
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-gray-500">자격증/경력</div>
            <div className="flex flex-wrap gap-1">
              {(company.certs || []).length
                ? company.certs!.map((c, i) => (
                    <span key={i} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs ring-1 ring-gray-200">
                      {c}
                    </span>
                  ))
                : "-" }
            </div>
          </div>

          {/* 상태 변경 */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs text-gray-500">상태 변경</div>
            {options.length === 0 ? (
              <div className="flex items-center gap-2">
                <StatusBadge value={company.status} />
                <span className="text-sm text-gray-600">승인 상태는 변경할 수 없습니다.</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as DbStatus | "")}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">선택하세요</option>
                  {options.map((opt) => (
                    <option key={opt.db} value={opt.db}>
                      {opt.ko}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!nextStatus || isPending}
                  onClick={async () => {
                    if (!nextStatus) return;
                    await mutateAsync({ id: Number(company.id), status: nextStatus as DbStatus });
                    setNextStatus("");
                    onClose();
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {isPending ? "변경 중…" : "상태 변경"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
