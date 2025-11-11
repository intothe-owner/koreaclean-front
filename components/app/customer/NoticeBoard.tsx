// === 공지사항 리스트(UI 전용) ===
'use client'
import { useMemo, useState } from "react";
import Link from "next/link";

export function NoticeBoard() {
  type Notice = {
    id: number;
    title: string;
    category: "긴급" | "중요" | "일반";
    date: string;
    views: number;
    hasFile?: boolean;
  };

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"" | Notice["category"]>("");
  const [sort, setSort] = useState<"latest" | "views">("latest");

  const data: Notice[] = [
    { id: 1012, title: "8월 시스템 점검 안내", category: "긴급", date: "2025-08-10", views: 213 },
    { id: 1011, title: "경로당 클린 서비스 확대 지역 공지", category: "중요", date: "2025-08-07", views: 532, hasFile: true },
    { id: 1010, title: "여름철 위생관리 캠페인 참여 안내", category: "일반", date: "2025-08-05", views: 178 },
    { id: 1009, title: "플랫폼 약관 일부 개정 고지", category: "중요", date: "2025-08-01", views: 614 },
  ];

  const list = useMemo(() => {
    let L = data.filter((n) =>
      (cat ? n.category === cat : true) &&
      (q ? n.title.toLowerCase().includes(q.toLowerCase()) : true)
    );
    if (sort === "latest") {
      L = L.sort((a, b) => (a.date < b.date ? 1 : -1));
    } else {
      L = L.sort((a, b) => b.views - a.views);
    }
    return L;
  }, [q, cat, sort]);

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
      {/* 헤더 영역: 검색/필터/등록하기 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">공지사항</h2>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2">
            <select
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={cat}
              onChange={(e) => setCat(e.target.value as any)}
            >
              <option value="">전체 분류</option>
              {/* 필요 시 데이터와 맞게 '긴급/중요/일반'으로 교체 */}
              <option value="공지">공지</option>
              <option value="점검">점검</option>
              <option value="이벤트">이벤트</option>
            </select>
            <select
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="latest">최신순</option>
              <option value="views">조회순</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="제목 검색"
                className="h-10 w-56 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>

           

            {/* 추가: 등록하기(프라이머리) */}
            <Link
              href="/customer/notice/write"
              className="h-10 inline-flex items-center rounded-lg bg-gray-900 text-white px-4 text-sm hover:bg-black/90"
            >
              등록하기
            </Link>
          </div>
        </div>
      </div>

      {/* 리스트: 데스크톱=테이블, 모바일=카드 */}
      <div className="mt-5 hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 px-3 w-20">번호</th>
              <th className="py-2 px-3">제목</th>
              <th className="py-2 px-3 w-24">분류</th>
              <th className="py-2 px-3 w-28">등록일</th>
              <th className="py-2 px-3 w-20 text-right">조회</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="py-3 px-3 text-gray-500">{n.id}</td>
                <td className="py-3 px-3">
                  <Link href={`/customer/notice/${n.id}`} className="hover:underline">
                    {n.title}
                  </Link>
                  {n.hasFile && (
                    <span className="ml-2 inline-flex items-center text-gray-400" title="첨부파일">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V7a4 4 0 10-8 0v10a3 3 0 11-6 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {n.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500">{n.date}</td>
                <td className="py-3 px-3 text-right">{n.views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드형 */}
      <div className="mt-5 space-y-3 md:hidden">
        {list.map((n) => (
          <Link
            href={`/customer/notice/${n.id}`}
            key={n.id}
            className="block rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">No. {n.id} · {n.category}</div>
                <div className="mt-0.5 font-medium text-gray-900 line-clamp-2">{n.title}</div>
              </div>
              {n.hasFile && (
                <span className="shrink-0 text-gray-400" title="첨부파일">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V7a4 4 0 10-8 0v10a3 3 0 11-6 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{n.date}</span>
              <span>조회 {n.views.toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 페이지네이션(형식만) */}
      <div className="mt-6 flex justify-center gap-1">
        {["이전", "1", "2", "다음"].map((t, i) => (
          <button
            key={i}
            className={`h-9 min-w-9 px-3 rounded-lg border text-sm ${
              t === "1" ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
