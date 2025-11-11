// components/common/ChatButton.tsx
"use client";

import React from "react";

type ChatButtonProps = {
  /** 안 읽은 메시지 수 (0이면 배지 숨김) */
  count?: number;
  /** 플로팅 버튼인지 여부 (true면 화면 우하단 고정) */
  floating?: boolean;
  /** 클릭 핸들러 (옵션) */
  onClick?: () => void;
  /** 버튼 라벨 (접근성/툴팁용) */
  label?: string;
  /** 크기: sm | md */
  size?: "sm" | "md";
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
};

export default function ChatButton({
  count = 0,
  floating = false,
  onClick,
  label = "채팅",
  size = "md",
  disabled,
  className = "",
}: ChatButtonProps) {
  const base =
    "relative inline-flex items-center justify-center rounded-full border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const sz =
    size === "sm"
      ? "h-10 w-10 text-[13px]"
      : "h-12 w-12 text-sm";
  const bg =
    "bg-white/95 hover:bg-white border-gray-300 backdrop-blur";
  const floatingPos = floating
    ? "fixed right-5 bottom-5 md:right-8 md:bottom-8 z-40"
    : "";

  return (
    <button
      type="button"
      aria-label={count > 0 ? `${label} (새 메시지 ${count}개)` : label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${bg} ${floatingPos} ${className}`}
    >
      {/* 채팅 아이콘 (SVG) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={size === "sm" ? "h-5 w-5" : "h-6 w-6"}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h8M8 14h5M4 6h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6l-4.8 3.6a1 1 0 0 1-1.6-.8V17H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        />
      </svg>

      {/* 배지 */}
      {count > 0 && (
        <span
          aria-label={`새 메시지 ${count}개`}
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] leading-5 font-semibold ring-2 ring-white text-center"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
