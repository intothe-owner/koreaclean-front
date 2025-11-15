"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QnaStatus = "NEW" | "ANSWERED" | "REOPENED" | "CLOSED";
type QnaCategory = "서비스 신청" | "변경" | "취소" | "불만사항" | "제안";

type AdminQnaRow = {
  id: number;
  title: string;
  category: QnaCategory;
  status: QnaStatus;
  comment_count?: number;
  createdAt: string;
  last_commented_at?: string | null;
  author_name?: string | null;
  author_org?: string | null;
};

const STATUS_LABEL: Record<QnaStatus, string> = {
  NEW: "신규",
  ANSWERED: "답변됨",
  REOPENED: "재오픈",
  CLOSED: "종결",
};

function StatusBadge({ value }: { value: QnaStatus }) {
  const map: Record<QnaStatus, string> = {
    NEW: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
    ANSWERED: "bg-blue-100 text-blue-800 ring-blue-600/20",
    REOPENED: "bg-orange-100 text-orange-800 ring-orange-600/20",
    CLOSED: "bg-gray-100 text-gray-700 ring-gray-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${map[value]}`}>
      {STATUS_LABEL[value]}
    </span>
  );
}

function fmt(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

export default function QnaListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((prev) => !prev);



  // 필터 상태
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | QnaStatus>("");
  const [category, setCategory] = useState<"" | QnaCategory>("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // 데이터 상태
  const [rows, setRows] = useState<AdminQnaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");



  async function load() {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("page_size", String(pageSize));
      if (q.trim()) qs.set("q", q.trim());
      if (status) qs.set("status", status);
      if (category) qs.set("category", category);

      const res = await fetchWithAuth(`/backend/qna/admin/list?${qs.toString()}`, {
        method: "GET",

        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `load failed (${res.status})`);
      }
      const json = await res.json();
      setRows(Array.isArray(json?.items) ? json.items : []);
      setTotal(Number(json?.total ?? 0));
    } catch (e: any) {
      setErr(e?.message || "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  // 최초 및 필터/페이지 변경 시 로드
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [  page, pageSize]);

  // 필터 적용 버튼
  const applyFilters = () => {
    setPage(1);
    load();
  };

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(total / pageSize));



  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold">문의관리</h1>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={load}
                className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
              >
                새로고침
              </button>
            </div>
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl border bg-white p-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">상태(전체)</option>
              <option value="NEW">신규</option>
              <option value="ANSWERED">답변됨</option>
              <option value="REOPENED">재오픈</option>
              <option value="CLOSED">종결</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">분류(전체)</option>
              <option value="서비스 신청">서비스 신청</option>
              <option value="변경">변경</option>
              <option value="취소">취소</option>
              <option value="불만사항">불만사항</option>
              <option value="제안">제안</option>
            </select>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="제목/작성자/기관 검색"
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={applyFilters}
                className="h-10 rounded-lg bg-black text-white text-sm"
              >
                적용
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setStatus("");
                  setCategory("");
                  setPage(1);
                  load();
                }}
                className="h-10 rounded-lg border border-gray-300 bg-white text-sm"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 목록 */}
          <div className="rounded-2xl bg-white border shadow-sm">
            <div className="flex items-center justify-between border-b p-3 text-sm">
              <div className="font-medium">
                총 {total}건 {loading && <span className="text-gray-400 ml-1">불러오는 중…</span>}
              </div>
              <div className="sm:hidden">
                <button
                  onClick={load}
                  className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                >
                  새로고침
                </button>
              </div>
            </div>

            {err ? (
              <div className="p-4 text-sm text-rose-600">{err}</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-neutral-500">데이터가 없습니다.</div>
            ) : (
              <>
                {/* 모바일 카드 */}
                <ul className="block md:hidden divide-y divide-gray-200">
                  {rows.map((it) => (
                    <li key={it.id} className="bg-gray-50 hover:bg-gray-100">
                      <Link href={`/admin/site/qna/${it.id}`} className="block p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-medium text-gray-900 line-clamp-2">{it.title}</h3>
                          <StatusBadge value={it.status} />
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {it.category} · 댓글 {it.comment_count ?? 0}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {it.author_org || "-"} {it.author_name ? `· ${it.author_name}` : ""}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>등록 {fmt(it.createdAt)}</span>
                          <span>최근활동 {fmt(it.last_commented_at)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* 데스크탑 테이블 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="px-3 py-2 w-[90px]">상태</th>
                        <th className="px-3 py-2">제목</th>
                        <th className="px-3 py-2 w-[120px]">분류</th>
                        <th className="px-3 py-2 w-[160px]">작성자</th>
                        <th className="px-3 py-2 w-[90px]">댓글</th>
                        <th className="px-3 py-2 w-[170px]">등록일</th>
                        <th className="px-3 py-2 w-[170px]">최근 활동</th>
                        <th className="px-3 py-2 w-[90px]">보기</th>
                      </tr>
                    </thead>
                    <tbody className="text-neutral-800">
                      {rows.map((it) => (
                        <tr key={it.id} className="border-t border-gray-200 bg-gray-50 hover:bg-gray-100">
                          <td className="px-3 py-2 align-middle">
                            <StatusBadge value={it.status} />
                          </td>
                          <td className="px-3 py-2 align-middle">
                            <div className="line-clamp-2">{it.title}</div>
                          </td>
                          <td className="px-3 py-2 align-middle">{it.category}</td>
                          <td className="px-3 py-2 align-middle">
                            <div className="truncate" title={`${it.author_org || "-"} ${it.author_name || ""}`}>
                              {it.author_org || "-"} {it.author_name ? `· ${it.author_name}` : ""}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-middle">{it.comment_count ?? 0}</td>
                          <td className="px-3 py-2 align-middle">{fmt(it.createdAt)}</td>
                          <td className="px-3 py-2 align-middle">{fmt(it.last_commented_at)}</td>
                          <td className="px-3 py-2 align-middle">
                            <Link
                              href={`/admin/site/qna/${it.id}`}
                              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2 text-xs hover:bg-gray-50"
                            >
                              상세
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-between border-t p-3 text-sm">
                  <div>
                    페이지 {page} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-9 rounded-lg border border-gray-300 bg-white px-3 disabled:opacity-50"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="h-9 rounded-lg border border-gray-300 bg-white px-3 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
