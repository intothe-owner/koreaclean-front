// components/app/customer/FAQ.tsx
"use client";

import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { baseUrl } from "@/lib/variable";
import { useEffect, useId, useMemo, useState } from "react";

/* ---------- 고정 카테고리 ---------- */
type Category = "홈페이지관련" | "회원관련" | "서비스신청관련" | "업체관련";
const CATEGORY_OPTIONS: Category[] = ["홈페이지관련", "회원관련", "서비스신청관련", "업체관련"];
const ALL = "전체" as const;
type CatFilter = typeof ALL | Category;

/* ---------- 서버 FAQ 타입 ---------- */
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

const API_BASE = "/backend/faq";

export default function FAQ() {
  const baseId = useId();

  // UI 상태
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [cat, setCat] = useState<CatFilter>(ALL);
  const [loading, setLoading] = useState(false);
  const [serverItems, setServerItems] = useState<FaqItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 서버에서 활성 FAQ 가져오기(카테고리 따라 재호출)
  useEffect(() => {
    let alive = true;
    async function fetchFaq() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ is_active: "1" });
        if (cat !== ALL) params.set("category", cat);
        const res = await fetchWithAuth(`${baseUrl}/faq/faqs?${params.toString()}`, { method: "GET" });
        const json = await res.json();
        if (!alive) return;

        if (res.ok && (json?.is_success ?? false)) {
          const items: FaqItem[] = json.items || [];
          setServerItems(items);
          // 목록이 바뀌면 첫 항목 열림 상태로 초기화
          setOpenIndex(items.length > 0 ? 0 : null);
        } else if (Array.isArray(json)) {
          const items = json as FaqItem[];
          setServerItems(items);
          setOpenIndex(items.length > 0 ? 0 : null);
        } else {
          setError(json?.message || "FAQ를 불러오는 중 문제가 발생했습니다.");
          setServerItems([]);
          setOpenIndex(null);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "FAQ를 불러오는 중 오류가 발생했습니다.");
        setServerItems([]);
        setOpenIndex(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchFaq();
    return () => {
      alive = false;
    };
  }, [cat]);

  // 표시용 데이터 (서버 데이터만)
  const items = useMemo<FaqItem[]>(() => {
    // 정렬: order_no ASC -> id DESC
    return [...serverItems].sort((a, b) => {
      const ao = a.order_no ?? 99999;
      const bo = b.order_no ?? 99999;
      if (ao !== bo) return ao - bo;
      return (b.id || 0) - (a.id || 0);
    });
  }, [serverItems]);

  // 아코디언 토글
  const toggle = (i: number) => setOpenIndex((cur) => (cur === i ? null : i));

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">자주 묻는 질문</h2>

        {/* 카테고리 선택: 칩 탭 + 모바일 드롭다운 */}
        <div className="w-full sm:w-auto">
          {/* 모바일 드롭다운 */}
          <div className="sm:hidden">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as CatFilter)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ALL}>{ALL}</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 데스크탑 칩 탭 */}
          <div className="hidden sm:flex sm:flex-wrap sm:gap-2">
            {[ALL, ...CATEGORY_OPTIONS].map((c) => {
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-current={active ? "true" : undefined}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 상태 메시지 */}
      {loading && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          불러오는 중…
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FAQ 리스트 */}
      <ul className="divide-y divide-gray-200">
        {!loading && items.length === 0 ? (
          <li className="py-6 text-center text-sm text-gray-500">
            표시할 FAQ가 없습니다.
          </li>
        ) : (
          items.map((item, i) => {
            const isOpen = openIndex === i;
            const btnId = `${baseId}-faq-btn-${i}`;
            const panelId = `${baseId}-faq-panel-${i}`;
            return (
              <li key={item.id} className="py-3">
                <button
                  id={btnId}
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  onClick={() => toggle(i)}
                  className="w-full text-left flex items-start justify-between gap-4"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-xs text-gray-500">{item.category}</span>
                    <span className="text-base md:text-lg font-medium text-gray-900">
                      {item.question}
                    </span>
                  </div>

                  {/* ▶ 아이콘: 닫힘(>) → 열림(v) 회전 */}
                  <span
                    className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                    aria-hidden
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* 패널 */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
