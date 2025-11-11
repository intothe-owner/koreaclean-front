"use client";

import { useMemo } from "react";
import type { Role } from "@/hooks/useUserList"; // 훅을 안 쓰면 페이지의 Role 타입 경로로 변경

export type UserDetail = {
  id: number;
  email: string;
  name: string;
  inst: string;
  contact?: string | null;
  phone?: string | null;
  role: Role;
  provider: "local" | "naver" | "kakao" | "google";
  createdAt?: string;
  updatedAt?: string;
};

export default function UserDetailModal({
  open,
  user,
  onClose,
  onEdit,
  onGoService, // 기관회원 전용(선택)
}: {
  open: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onEdit?: (u: UserDetail) => void;
  onGoService?: (u: UserDetail) => void;
}) {
  const created = useMemo(() => (user?.createdAt ? formatDate(user.createdAt) : "-"), [user]);
  const updated = useMemo(() => (user?.updatedAt ? formatDate(user.updatedAt) : "-"), [user]);
  if (!open || !user) return null;

  const ROLE_LABEL: Record<Role, string> = {
    SUPER: "슈퍼",
    ADMIN: "관리자",
    CLIENT: "기관",
    COMPANY: "업체",
  };
  const ROLE_BADGE: Record<Role, string> = {
    SUPER: "bg-purple-100 text-purple-700 ring-purple-200",
    ADMIN: "bg-blue-100 text-blue-700 ring-blue-200",
    CLIENT: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    COMPANY: "bg-amber-100 text-amber-700 ring-amber-200",
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[min(680px,94vw)] rounded-2xl bg-white p-5 ring-1 ring-gray-200 shadow-xl">
        {/* 헤더 */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">회원 상세</h2>
            <p className="mt-1 truncate text-sm text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="space-y-4">
          {/* 상단 요약 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${ROLE_BADGE[user.role]}`}>
              {ROLE_LABEL[user.role]}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs ring-1 ring-gray-200">
              로그인: {user.provider}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs ring-1 ring-gray-200">
              ID: {user.id}
            </span>
          </div>

          {/* 상세 필드 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="이름" value={user.name} />
            <Field label="기관명" value={user.inst} />
            <Field label="휴대폰" value={user.phone || "-"} copyable />
            <Field label="연락처" value={user.contact || "-"} copyable />
            <Field
              label="이메일"
              value={user.email}
              copyable
              extra={
                <a
                  href={`mailto:${user.email}`}
                  className="text-xs text-blue-600 underline-offset-2 hover:underline"
                >
                  이메일 작성
                </a>
              }
            />
            <Field label="생성일" value={created} />
            <Field label="수정일" value={updated} />
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {user.role === "CLIENT" && onGoService && (
            <button
              onClick={() => onGoService(user)}
              className="rounded-lg px-3 py-2 text-sm ring-1 ring-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              서비스 이용 조회
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className="rounded-lg px-3 py-2 text-sm ring-1 ring-blue-300 text-blue-700 hover:bg-blue-50"
            >
              수정
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50"
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
  copyable,
  extra,
}: {
  label: string;
  value: string | number;
  copyable?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {extra}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-sm text-gray-900">{String(value)}</div>
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(String(value))}
            className="shrink-0 rounded-md px-2 py-1 text-xs ring-1 ring-gray-300 hover:bg-gray-50"
            title="복사"
          >
            복사
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(iso?: string) {
  // 간단 포맷터 (YYYY-MM-DD HH:mm)
  try {
    const d = new Date(iso ?? "");
    if (Number.isNaN(+d)) return "-";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  } catch {
    return "-";
  }
}
