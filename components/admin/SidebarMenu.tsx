// components/app/SidebarMenu.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SidebarLink from "./SidebarLink";

type Section = {
  id: string;
  label: string;
  // 섹션의 대표 prefix 경로(활성 탐지용). 없으면 children href의 공통 prefix를 사용
  baseHref?: string;
  children: { label: string; href: string }[];
};

const sections: Section[] = [
  {
    id: "site",
    label: "홈페이지 관리",
    baseHref: "/admin/site",
    children: [
      { label: "사이트 기본정보", href: "/admin/site/basic" },
      { label: "메인 배너", href: "/admin/site/screen" },
      { label: "요금표정보", href: "/admin/site/pricing" },
      { label: "공지사항", href: "/admin/site/notice/list" },
      { label: "교육공지", href: "/admin/site/edu/list" },
      { label: "문의관리", href: "/admin/site/qna/list" },
      { label: "FAQ", href: "/admin/site/faq" },
    ],
  },
  {
    id: "svc-quality",
    label: "서비스 신청 품질관리",
    baseHref: "/admin/service",
    children: [
      { label: "서비스 목록", href: "/admin/service" },
      { label: "리뷰후기", href: "/admin/service/reviews" },
      { label: "AS접수", href: "/admin/service/as" },
    ],
  },
  {
    id: "company",
    label: "업체관리",
    baseHref: "/admin/company",
    children: [
      { label: "업체목록", href: "/admin/company" },
      { label: "실적보기", href: "/admin/company/count" },
    ],
  },
];

const singles = [
  { label: "회원관리", href: "/admin/user" },
  { label: "정산관리", href: "/admin/settlement" },
  { label: "통계", href: "/admin/stats" },
];

export default function SidebarMenu() {
  const pathname = usePathname();

  // 기본 펼침 상태: 현재 경로가 섹션 baseHref(또는 자식 href)와 매치되면 펼침
  const defaultOpen = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const s of sections) {
      const base = s.baseHref || commonPrefix(s.children.map((c) => c.href));
      map[s.id] =
        pathname === base ||
        pathname.startsWith(base + "/") ||
        s.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
    }
    return map;
  }, [pathname]);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);

  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  return (
    <nav className="px-3 py-3 space-y-2 overflow-y-auto h-[calc(100%-56px)]">
      {/* 섹션(아코디언) */}
      {sections.map((sec) => {
        const isOpen = !!open[sec.id];
        const anyChildActive = sec.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
        return (
          <div key={sec.id} className="rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => toggle(sec.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition
                ${anyChildActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-800"}`}
            >
              <span className="font-medium">{sec.label}</span>
              <svg
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* 아코디언 패널 */}
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-1 px-2 pb-2">
                  {sec.children.map((item) => (
                    <SidebarLink key={item.href} label={item.label} href={item.href} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 단일 링크 */}
      <div className="space-y-1 pt-1">
        {singles.map((s) => (
          <SidebarLink key={s.href} label={s.label} href={s.href} showIcon={false} />
        ))}
      </div>
    </nav>
  );
}

/** 여러 경로의 공통 prefix를 대략적으로 계산 (섹션 baseHref 미지정 시 사용) */
function commonPrefix(paths: string[]): string {
  if (paths.length === 0) return "/";
  const parts = paths.map((p) => p.split("/").filter(Boolean));
  const first = parts[0];
  let i = 0;
  while (i < first.length && parts.every((arr) => arr[i] === first[i])) i++;
  return "/" + first.slice(0, i).join("/");
}
