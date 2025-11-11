"use client";

import * as React from "react";
// app/page.tsx (상단 import에 추가)
import { useUnreadBadges, useUnreadSocket } from "@/hooks/useUnreadBadges";
import { getChatSocket } from "@/lib/chat-socket";

type Size = "sm" | "md" | "lg";
type Variant = "default" | "ghost";

export interface ChatIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 미읽음 카운트 뱃지 */
  count?: number;
  /** 접근성 라벨 (화면리더) */
  label?: string;
  /** 버튼 크기 */
  size?: Size;
  /** 버튼 스타일 */
  variant?: Variant;
  /** 라운딩 형태 */
  rounded?: "full" | "lg" | "md";
  /** 아이콘만 보여줄지 여부 (텍스트 숨김) */
  iconOnly?: boolean;
  /** 텍스트(아이콘 오른쪽) */
  text?: string;
}

const sizeClass: Record<Size, string> = {
  sm: "h-8 min-w-8 text-[13px] px-2",
  md: "h-9 min-w-9 text-sm px-2.5",
  lg: "h-10 min-w-10 text-sm px-3",
};

const variantClass: Record<Variant, string> = {
  default:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:opacity-90",
  ghost:
    "border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 active:opacity-90",
};

const roundedClass = {
  full: "rounded-full",
  lg: "rounded-lg",
  md: "rounded-md",
};

const iconSizeByButton: Record<Size, number> = { sm: 18, md: 18, lg: 20 };

/** 재사용 가능한 채팅 아이콘 버튼 + 미읽음 뱃지 */
const ChatIconButton = React.forwardRef<HTMLButtonElement, ChatIconButtonProps>(
  (
    {
      count = 0,
      label = "채팅",
      size = "md",
      variant = "default",
      rounded = "full",
      iconOnly = true,
      text,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const iconSize = iconSizeByButton[size];

    return (
      <button
        type="button"
        ref={ref}
        aria-label={`${label}${count ? ` (${count} 미읽음)` : ""}`}
        title={label}
        disabled={disabled}
        className={[
          "relative inline-flex items-center justify-center select-none",
          sizeClass[size],
          variantClass[variant],
          roundedClass[rounded],
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
        {...props}
      >
        {/* 아이콘 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={iconSize}
          height={iconSize}
          fill="currentColor"
          aria-hidden="true"
          className={iconOnly ? "" : "mr-2"}
        >
          <path d="M21 6.5a4.5 4.5 0 0 0-4.5-4.5h-9A4.5 4.5 0 0 0 3 6.5v5A4.5 4.5 0 0 0 7.5 16H8v3.586a1 1 0 0 0 1.707.707L13 16h3.5A4.5 4.5 0 0 0 21 11.5v-5Z" />
        </svg>

        {/* 텍스트 (옵션) */}
        {!iconOnly && text && <span className="truncate">{text}</span>}

        {/* 미읽음 뱃지 */}
        {count > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold leading-4 text-white shadow">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  }
);

ChatIconButton.displayName = "ChatIconButton";
export default ChatIconButton;
