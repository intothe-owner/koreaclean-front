// components/app/SidebarLink.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import IconDot from "../ui/IconDot";

type SidebarLinkProps = {
  label: string;
  href: string;
  showIcon?: boolean; // ⬅️ 추가: 아이콘 표시 여부 (기본 true)
};

const SidebarLink = ({ label, href, showIcon = true }: SidebarLinkProps) => {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm border border-transparent ${
        active
          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
          : "hover:bg-gray-50 text-gray-700"
      }`}
    >
      {showIcon && (
        <div className="h-5 w-5 text-current">
          <IconDot />
        </div>
      )}
      <span>{label}</span>
    </Link>
  );
};

export default SidebarLink;
