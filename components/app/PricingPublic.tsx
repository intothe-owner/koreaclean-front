"use client";

import { useEffect, useState } from "react";

type RowKey = "totalCare" | "generalCleaning" | "disinfection" | "acDeepClean" | "etc";

const LABELS: Record<RowKey, string> = {
  totalCare: "토탈케어서비스",
  generalCleaning: "대행청소",
  disinfection: "소독방역",
  acDeepClean: "에어컨종합세척",
  etc: "기타",
};

const KEYS: RowKey[] = ["totalCare", "generalCleaning", "disinfection", "acDeepClean", "etc"];

// 3자리 콤마 + '원'
const fmtKRW = (v?: number) =>
  typeof v === "number" && Number.isFinite(v) ? `${new Intl.NumberFormat("ko-KR").format(v)}원` : "-";

// 숫자 → 한글 금액(간단표기: “백십만오천원” 등)
function numberToKoreanMoney(n?: number): string {
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

export default function PricingPublic({
  fetchUrl = "/admin/site/pricing", // 서버 라우트에 맞춰 필요 시 변경
}: {
  fetchUrl?: string;
}) {
  const [data, setData] = useState<Record<RowKey, number>>({
    totalCare: 0,
    generalCleaning: 0,
    disinfection: 0,
    acDeepClean: 0,
    etc: 0,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(fetchUrl, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json?.is_success) throw new Error(json?.message || "요금표 조회 실패");
        const pricing = json?.pricing || {};
        const normalized: Record<RowKey, number> = { ...data };
        KEYS.forEach((k) => (normalized[k] = Number.isFinite(pricing[k]) ? pricing[k] : 0));
        setData(normalized);
      } catch (e: any) {
        setErr(e?.message || "서버 오류");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">요금표</h2>
        <p className="mt-1 text-sm text-neutral-500">기본 요금은 부가세 별도입니다.</p>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">불러오는 중…</div>
      ) : err ? (
        <div className="text-sm text-red-600">{err}</div>
      ) : (
        <>
          {/* 데스크톱: 표 */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-56" />
                <col />
              </colgroup>
              <thead>
                <tr className="bg-neutral-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold">서비스</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-right">기본 요금</th>
                </tr>
              </thead>
              <tbody>
                {KEYS.map((k) => (
                  <tr key={k} className="align-top">
                    <td className="border-t border-neutral-200 px-4 py-3 text-sm font-medium">
                      {LABELS[k]}
                    </td>
                    <td className="border-t border-neutral-200 px-4 py-3 text-right">
                      <div className="text-base font-semibold">{fmtKRW(data[k])}</div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {numberToKoreanMoney(data[k])}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드 */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {KEYS.map((k) => (
              <div key={k} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="text-sm font-semibold">{LABELS[k]}</div>
                <div className="mt-1 text-lg font-bold">{fmtKRW(data[k])}</div>
                <div className="text-xs text-neutral-500">{numberToKoreanMoney(data[k])}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
