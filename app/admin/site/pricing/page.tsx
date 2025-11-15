// app/admin/service/page.tsx
"use client";

import React, { useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";

import { usePricing, RowKey } from "@/hooks/usePricing";
import { LABELS } from "@/lib/variable";



// 콤마 포맷
const fmtComma = (digits: string) =>
  digits ? new Intl.NumberFormat("ko-KR").format(Number(digits)) : "";

// 숫자 → 한글 금액
function numberToKoreanMoney(n: number): string {
  if (!n || n <= 0) return "";
  const smallUnit = ["", "십", "백", "천"];
  const bigUnit = ["", "만", "억", "조", "경"];
  const digitsHangul = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];

  const partsByGroup: string[] = [];
  let num = n;
  let groupIdx = 0;

  while (num > 0 && groupIdx < bigUnit.length) {
    const group = num % 10000;
    if (group > 0) {
      const seg: string[] = [];
      const d0 = group % 10;
      const d1 = Math.floor(group / 10) % 10;
      const d2 = Math.floor(group / 100) % 10;
      const d3 = Math.floor(group / 1000) % 10;

      [d3, d2, d1, d0].forEach((d, i) => {
        if (d === 0) return;
        const unit = smallUnit[smallUnit.length - 1 - i];
        const digitStr = unit ? (d === 1 ? "" : digitsHangul[d]) : digitsHangul[d];
        seg.push(digitStr + unit);
      });

      partsByGroup.unshift(seg.join("") + bigUnit[groupIdx]);
    }
    num = Math.floor(num / 10000);
    groupIdx++;
  }
  if (partsByGroup.length === 0) return "";
  return partsByGroup.join("") + "원";
}

export default function PricingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
      const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // ✅ 훅 사용 (마운트 시 자동으로 /admin/site/pricing 불러옴)
  const { raw, setField, save, loading, saving, error } = usePricing({
    fetchUrl: "/backend/pricing/pricing",
    saveUrl: "/backend/pricing/save",
    autoLoad: true,
  });



  const rows = Object.keys(LABELS) as RowKey[];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await save();
    if (ok) alert("요금표가 저장되었습니다.");
    else if (error) alert(error);
    // 필요하면 여기서 refetch(load) 호출 가능
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">홈페이지 관리 &gt;&gt; 요금표 설정</h1>
          </div>

          {/* 상태 표시 */}
          {(loading || saving || error) && (
            <div className="text-sm">
              {loading && <span className="text-gray-500">불러오는 중…</span>}
              {saving && <span className="text-blue-600">저장 중…</span>}
              {error && <span className="text-red-600">{error}</span>}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* 데스크톱 표 */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-48 md:w-60" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">서비스종류</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold">기본 요금표</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((key) => {
                    const num = raw[key] ? Number(raw[key]) : 0;
                    const korean = numberToKoreanMoney(num);
                    return (
                      <tr key={key} className="align-top">
                        <td className="border-t border-gray-200 px-4 py-3 text-sm font-medium">
                          {LABELS[key]}
                        </td>
                        <td className="border-t border-gray-200 px-4 py-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="예) 2000000"
                            value={fmtComma(raw[key])}
                            onChange={(e) => setField(key, e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          />
                          <div className="mt-1 text-xs text-gray-500 min-h-4 text-right">
                            {korean}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="md:hidden space-y-3">
              {rows.map((key) => {
                const num = raw[key] ? Number(raw[key]) : 0;
                const korean = numberToKoreanMoney(num);
                return (
                  <div key={key} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-2 text-sm font-semibold">{LABELS[key]}</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="예) 2000000"
                      value={fmtComma(raw[key])}
                      onChange={(e) => setField(key, e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    />
                    <div className="mt-1 text-xs text-gray-500 min-h-4">
                      {korean}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
