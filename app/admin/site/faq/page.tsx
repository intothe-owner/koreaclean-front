// app/admin/service/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";


/* ---------- 고정 카테고리 ---------- */
type Category = "홈페이지관련" | "회원관련" | "서비스신청관련" | "업체관련";
const CATEGORY_OPTIONS: Category[] = ["홈페이지관련", "회원관련", "서비스신청관련", "업체관련"];
function isValidCategory(v: any): v is Category {
  return CATEGORY_OPTIONS.includes(v);
}

/* ---------- 타입 ---------- */
type FaqItem = {
  id: number;
  category: Category;
  question: string;
  answer: string;
  is_active: boolean;
  order_no?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type FaqForm = {
  id?: number;
  category: Category;
  question: string;
  answer: string;
  is_active: boolean;
  order_no?: number | null;
};

/** API 경로  */
const API_BASE = "/api/faq";

export default function FaqPage() {


  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [q, setQ] = useState<string>("");
  const [cat, setCat] = useState<"" | Category>("");

  const [open, setOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let out = items;

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (it) =>
          it.question.toLowerCase().includes(s) ||
          it.answer.toLowerCase().includes(s) ||
          (it.category || "").toLowerCase().includes(s)
      );
    }
    if (cat) {
      out = out.filter((it) => it.category === cat);
    }
    out = [...out].sort((a, b) => {
      const ao = a.order_no ?? 99999;
      const bo = b.order_no ?? 99999;
      if (ao !== bo) return ao - bo;
      return (b.id || 0) - (a.id || 0);
    });
    return out;
  }, [items, q, cat]);

  useEffect(() => {

    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadList() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (cat) params.set("category", cat);

      const res = await fetchWithAuth(`${API_BASE}/faqs?${params.toString()}`, { method: "GET" });
      const json = await res.json();
      if (json?.is_success) {
        setItems(json.items || []);
      } else if (Array.isArray(json)) {
        setItems(json as FaqItem[]);
      } else {
        console.error(json?.message || "FAQ 목록을 불러오지 못했습니다.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /** 삭제 */
  async function removeItem(item: FaqItem, opts?: { hard?: boolean }) {
    if (!confirm(`정말 삭제하시겠습니까?\n\n[${item.question}]`)) return;
    setDeletingId(item.id);
    try {
      const url = `${API_BASE}/faqs/${item.id}${opts?.hard ? "?force=1" : ""}`;
      const res = await fetchWithAuth(url, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json?.is_success !== false)) {
        // 낙관적 업데이트
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      } else {
        alert(json?.message || "삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold">홈페이지 관리 &gt;&gt; FAQ 설정</h1>
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
            >
              FAQ 등록
            </button>
          </div>

          {/* 검색/필터: 모바일 1열, 태블릿 2열, 데스크탑 3열 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              placeholder="질문/답변/카테고리 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as "" | Category)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 카테고리</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between gap-2 lg:justify-start">
              <button
                onClick={loadList}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
              >
                새로고침
              </button>
              <span className="text-sm text-gray-500">{filtered.length}건</span>
            </div>
          </div>

          {/* ===== 모바일 카드 리스트 (md 미만) ===== */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                불러오는 중…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                등록된 FAQ가 없습니다.
              </div>
            ) : (
              filtered.map((it) => (
                <FaqCard
                  key={it.id}
                  item={it}
                  onEdit={() => {
                    setEditing(it);
                    setOpen(true);
                  }}
                  onDelete={() => removeItem(it)}
                  deleting={deletingId === it.id}
                />
              ))
            )}
          </div>

          {/* ===== 데스크탑 테이블 (md 이상) ===== */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <Th>노출</Th>
                  <Th className="w-24">정렬</Th>
                  <Th>카테고리</Th>
                  <Th>질문</Th>
                  <Th>답변</Th>
                  <Th className="w-40">생성일</Th>
                  <Th className="w-40">액션</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      불러오는 중…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      등록된 FAQ가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50">
                      <Td>
                        <Badge active={it.is_active} />
                      </Td>
                      <Td className="text-center">{it.order_no ?? "-"}</Td>
                      <Td>{it.category}</Td>
                      <Td className="font-medium">{it.question}</Td>
                      <Td className="text-gray-600">
                        <div className="line-clamp-2">{it.answer}</div>
                      </Td>
                      <Td className="text-gray-500">
                        {it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(it);
                              setOpen(true);
                            }}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => removeItem(it)}
                            disabled={deletingId === it.id}
                            className={`rounded-md border px-2 py-1 text-sm ${
                              deletingId === it.id
                                ? "cursor-wait border-gray-300 text-gray-400"
                                : "border-red-300 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {deletingId === it.id ? "삭제중…" : "삭제"}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* 등록/수정 모달 */}
      {open && (
        <FaqModal
          open={open}
          onClose={() => setOpen(false)}
          initial={editing ?? undefined}
          onSaved={(saved) => {
            setOpen(false);
            if (editing) {
              setItems((prev) => prev.map((x) => (x.id === saved.id ? (saved as FaqItem) : x)));
            } else {
              setItems((prev) => [saved as FaqItem, ...prev]);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- 작은 UI 유틸 ---------- */
function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-3 align-top text-sm ${className}`}>{children}</td>;
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
        active
          ? "bg-green-50 text-green-700 ring-green-600/20"
          : "bg-gray-50 text-gray-600 ring-gray-500/10"
      }`}
    >
      {active ? "노출" : "숨김"}
    </span>
  );
}

/* ---------- 모바일 카드 ---------- */
function FaqCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: FaqItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <div className="mb-1 flex items-center gap-2">
            <Badge active={item.is_active} />
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {item.category}
            </span>
            {item.order_no != null && (
              <span className="text-xs text-gray-500">순서: {item.order_no}</span>
            )}
          </div>
          <div className="truncate font-semibold">{item.question}</div>
        </div>
        <div className="shrink-0 space-x-2">
          <button
            onClick={onEdit}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            수정
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className={`rounded-md border px-2 py-1 text-xs ${
              deleting
                ? "cursor-wait border-gray-300 text-gray-400"
                : "border-red-300 text-red-600 hover:bg-red-50"
            }`}
          >
            {deleting ? "삭제중…" : "삭제"}
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-700">
        <div className={`${open ? "" : "line-clamp-3"}`}>{item.answer}</div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-xs text-blue-600 underline"
        >
          {open ? "접기" : "더보기"}
        </button>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
      </div>
    </div>
  );
}

/* ---------- 모달 컴포넌트 ---------- */
function FaqModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: FaqItem;
  onSaved: (item: FaqItem) => void;
}) {
  const isEdit = !!initial?.id;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FaqForm>({
    id: initial?.id,
    category: isValidCategory(initial?.category) ? (initial!.category as Category) : CATEGORY_OPTIONS[0],
    question: initial?.question || "",
    answer: initial?.answer || "",
    order_no: initial?.order_no ?? undefined,
    is_active: initial?.is_active ?? true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: initial?.id,
        category: isValidCategory(initial?.category) ? (initial!.category as Category) : CATEGORY_OPTIONS[0],
        question: initial?.question || "",
        answer: initial?.answer || "",
        order_no: initial?.order_no ?? undefined,
        is_active: initial?.is_active ?? true,
      });
    }
  }, [open, initial]);

  const canSubmit =
    form.question.trim().length > 0 &&
    form.answer.trim().length > 0 &&
    isValidCategory(form.category) &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        id: form.id, // ← 있으면 수정, 없으면 신규
        category: isValidCategory(form.category) ? form.category : CATEGORY_OPTIONS[0],
        question: form.question.trim(),
        answer: form.answer.trim(),
        is_active: !!form.is_active,
        order_no:
          form.order_no === null || form.order_no === undefined || Number.isNaN(Number(form.order_no))
            ? null
            : Number(form.order_no),
      };

      const res = await fetchWithAuth(`/api/faq/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.is_success === false) {
        alert(json?.message || "저장에 실패했습니다.");
        return;
      }
      const saved = json?.item || json;
      onSaved(saved as FaqItem);
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => (!submitting ? onClose() : null)}
      />
      {/* 모바일: 거의 풀스크린, 데스크탑: 2xl 카드 */}
      <div className="relative z-10 w-[92vw] max-w-2xl rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{isEdit ? "FAQ 수정" : "FAQ 등록"}</h2>
          <button
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            onClick={() => (!submitting ? onClose() : null)}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 모바일 1열, sm 이상 2열 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">카테고리 *</label>
              <select
                value={form.category}
                onChange={(e) => {
                  const v = e.target.value as Category;
                  setForm((p) => ({ ...p, category: isValidCategory(v) ? v : CATEGORY_OPTIONS[0] }));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">정렬번호 (작을수록 상단)</label>
              <input
                type="number"
                value={form.order_no ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    order_no: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
                placeholder="예: 1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">질문 *</label>
            <input
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              required
              placeholder="자주 묻는 질문을 입력하세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">답변 *</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
              required
              rows={6}
              placeholder="질문에 대한 상세 답변을 입력하세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              노출(활성화)
            </label>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 sm:flex-none"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!form.question.trim() || !form.answer.trim() || submitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 sm:flex-none"
              >
                {isEdit ? "수정 저장" : "등록"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
