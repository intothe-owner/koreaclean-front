// components/common/RegionMultiSelect.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ===== 샘플 데이터 (서울/인천만 예시). 나머지 시도는 동일 패턴으로 추가하세요. =====
// 전국 시/군/구 데이터
export const REGION_DATA: Record<string, string[]> = {
  서울: [
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
    "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
  ],
  인천: [
    "계양구", "미추홀구", "부평구", "남동구", "동구", "연수구", "서구", "중구", "강화군", "옹진군",
  ],
  경기: [
    "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시", "고양시",
    "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시", "용인시",
    "파주시", "이천시", "안성시", "김포시", "화성시", "광주시", "양주시", "포천시", "여주시",
    "연천군", "가평군", "양평군",
  ],
  강원: [
    "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시",
    "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군",
  ],
  충북: [
    "청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "진천군", "괴산군", "음성군", "단양군", "증평군",
  ],
  충남: [
    "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시",
    "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군",
  ],
  대전: [
    "동구", "중구", "서구", "유성구", "대덕구",
  ],
  세종: [
    "세종시",
  ],
  전북: [
    "전주시", "군산시", "익산시", "정읍시", "남원시", "김제시",
    "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군",
  ],
  전남: [
    "목포시", "여수시", "순천시", "나주시", "광양시",
    "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군",
    "함평군", "영광군", "장성군", "완도군", "진도군", "신안군",
  ],
  광주: [
    "동구", "서구", "남구", "북구", "광산구",
  ],
  경북: [
    "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시",
    "군위군", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군",
    "예천군", "봉화군", "울진군", "울릉군",
  ],
  대구: [
    "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군",
  ],
  경남: [
    "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시",
    "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군",
  ],
  부산: [
    "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구", "해운대구", "사하구",
    "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
  ],
  울산: [
    "중구", "남구", "동구", "북구", "울주군",
  ],
  제주: [
    "제주시", "서귀포시",
  ],
};


// 유틸: "서울>강남구" 포맷 생성/분해
const joinKey = (sido: string, sigungu: string) => `${sido}>${sigungu}`;
const splitKey = (key: string) => {
  const i = key.indexOf(">");
  if (i < 0) return { sido: key, sigungu: "" };
  return { sido: key.slice(0, i), sigungu: key.slice(i + 1) };
};

type Props = {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  onApply?: (next: string[]) => void; // ⬅️ 추가
};

export default function AssRegionMultiSelect({
  label = "서비스 가능 지역",
  value,
  onChange,
  placeholder = "지역을 선택하세요",
  className = "",
  onApply
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeSido, setActiveSido] = useState<string>("서울");
  const [query, setQuery] = useState("");

  // 현재 시/도의 구/군 목록 (검색 반영)
  const sigunguList = useMemo(() => {
    const base = REGION_DATA[activeSido] ?? [];
    const q = query.trim();
    if (!q) return base;
    return base.filter((n) => n.includes(q));
  }, [activeSido, query]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // 선택 토글
  const toggle = (sido: string, sigungu: string) => {
    const key = joinKey(sido, sigungu);
    if (value.includes(key)) onChange(value.filter((v) => v !== key));
    else onChange([...value, key]);
  };

  // 시/도 전체 선택 / 해제
  const toggleAllInSido = (sido: string) => {
    const allKeys = (REGION_DATA[sido] ?? []).map((g) => joinKey(sido, g));
    const hasAll = allKeys.every((k) => value.includes(k));
    if (hasAll) {
      onChange(value.filter((k) => !allKeys.includes(k)));
    } else {
      const set = new Set(value);
      allKeys.forEach((k) => set.add(k));
      onChange(Array.from(set));
    }
  };

  // 선택 칩 삭제
  const removeOne = (key: string) => onChange(value.filter((v) => v !== key));

  // 초기화
  const reset = () => onChange([]);

  // 표시 문구
  const buttonText =
    value.length === 0 ? placeholder : `${value.length}개 지역 선택됨`;

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-left hover:bg-neutral-50"
      >
        {buttonText}
      </button>

      {open && (
        <div className="relative z-50">
          <div
            className="absolute mt-2 w-full rounded-2xl border border-neutral-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            {/* 상단 검색 */}
            <div className="border-b p-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="구/군 검색"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            {/* 본문 2단 */}
            <div className="grid grid-cols-12 gap-0">
              {/* 시/도 목록 */}
              <div className="col-span-4 max-h-72 overflow-auto border-r">
                <ul className="p-2">
                  {Object.keys(REGION_DATA).map((sido) => {
                    const total = REGION_DATA[sido]?.length ?? 0;
                    const selectedCount = value.filter((k) => splitKey(k).sido === sido).length;
                    const isActive = activeSido === sido;
                    return (
                      <li key={sido}>
                        <button
                          type="button"
                          onClick={() => setActiveSido(sido)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-neutral-50"
                            }`}
                        >
                          <span>{sido}</span>
                          <span className="text-xs text-neutral-500">
                            {selectedCount}/{total}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 구/군 목록 */}
              <div className="col-span-8 max-h-72 overflow-auto">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <div className="text-sm font-medium">
                    {activeSido} ({REGION_DATA[activeSido]?.length ?? 0})
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAllInSido(activeSido)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
                  >
                    {REGION_DATA[activeSido]?.every((g) =>
                      value.includes(joinKey(activeSido, g))
                    )
                      ? "전체 해제"
                      : "전체 선택"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-3">
                  {sigunguList.map((g) => {
                    const key = joinKey(activeSido, g);
                    const active = value.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggle(activeSido, g)}
                        className={`truncate rounded-md border px-3 py-2 text-sm text-left ${active
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-neutral-300 bg-white hover:bg-neutral-50"
                          }`}
                        aria-pressed={active}
                        title={key}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 하단 선택 요약 / 액션 */}
            <div className="border-t p-3">
              {/* 선택된 칩 */}
              {value.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {value.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => removeOne(k)}
                        className="rounded-full px-1 hover:bg-neutral-100"
                        aria-label={`${k} 삭제`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-neutral-500 underline"
                  onClick={reset}
                >
                  초기화
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => setOpen(false)}
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white"
                    onClick={() => {
                      onApply?.([...value]); // ⬅️ 새 배열로 전달
                      setOpen(false);
                    }}
                  >
                    선택 완료
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 바깥 반투명 오버레이 (필요하면 켜기) */}
          {/* <div className="fixed inset-0 bg-black/30" /> */}
        </div>
      )}
    </div>
  );
}
