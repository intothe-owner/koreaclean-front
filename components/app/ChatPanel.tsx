// components/app/ChatPanel.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** ========== 타입 ========== */
export type ChatMessage = {
  id: number | string;
  senderId: number;
  content: string;
  createdAt: string | Date;
  /** 'sending' | 'sent' | 'delivered' | 'read' */
  status?: "sending" | "sent" | "delivered" | "read";
  /** 같은 보낸 사람의 연속여부 표시용(옵션) */
  sameAsPrev?: boolean;
};

type ChatPanelProps = {
  meId: number;
  partnerName?: string;
  isPartnerOnline?: boolean;
  messages: ChatMessage[];
  /** 엔터로 보낼 때 호출: 성공 시 Promise resolve하면 자동 스크롤 */
  onSend: (text: string) => Promise<void> | void;
  /** 위로 스크롤했을 때 더 불러오기(옵션, 무한스크롤) */
  onLoadMore?: () => Promise<void> | void;
  /** 로딩 상태(옵션) */
  loadingMore?: boolean;
  /** 입력창 placeholder(옵션) */
  placeholder?: string;

  /** ⬇️ 추가: 외부에서 스크롤 컨테이너에 접근하고 싶을 때 전달 (옵션) */
  scrollContainerRef?: React.MutableRefObject<HTMLDivElement | null>;
  /** ⬇️ 추가: 외부에서 스크롤 이벤트를 받고 싶을 때 (옵션) */
  onScroll?: (e: Event) => void;
};

export default function ChatPanel({
  meId,
  partnerName = "상대방",
  isPartnerOnline,
  messages,
  onSend,
  onLoadMore,
  loadingMore,
  placeholder = "메시지를 입력하세요",

  // ⬇️ 추가된 prop들
  scrollContainerRef,
  onScroll,
}: ChatPanelProps) {
  /** 입력창 */
  const [text, setText] = useState("");
  /** 새 메시지 토스트(안 읽은/스크롤 위일 때) */
  const [newToastCount, setNewToastCount] = useState(0);

  /** 스크롤 참조 (내부) */
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);

  /** 외부 ref와 내부 ref merge */
  const setListNode = useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (scrollContainerRef) {
        // 외부에서도 같은 DOM을 바라보게
        scrollContainerRef.current = node;
      }
    },
    [scrollContainerRef]
  );

  /** 현재 맨 아래인지 판별 */
  const isAtBottom = useRef(true);
  const BOTTOM_THRESHOLD = 24; // px

  const updateAtBottomFlag = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottom.current = diff <= BOTTOM_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
      // 즉시 플래그 갱신
      requestAnimationFrame(updateAtBottomFlag);
    },
    [updateAtBottomFlag]
  );

  /** 무한스크롤(옵션) – 상단 센티널 교차 */
  useEffect(() => {
    if (!onLoadMore || !topSentinelRef.current) return;
    const el = topSentinelRef.current;
    const observer = new IntersectionObserver(
      async (entries) => {
        const [e] = entries;
        if (e.isIntersecting) {
          await onLoadMore?.();
        }
      },
      { root: listRef.current, threshold: 1.0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore]);

  /** 스크롤 리스너: 맨 아래 여부 추적 (+ 외부 onScroll 전달) */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = (e: Event) => {
      const prev = isAtBottom.current;
      updateAtBottomFlag();
      if (isAtBottom.current && !prev) {
        // 아래로 도달하면 토스트 제거
        setNewToastCount(0);
      }
      // 외부 리스너 전달
      onScroll?.(e);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [updateAtBottomFlag, onScroll]);

  /** 메시지가 바뀔 때: 1) 내가 보낸 경우/아래에 있을 경우 자동 스크롤  2) 위에 있을 때는 토스트 증가 */
  const lastMsg = messages[messages.length - 1];
  const lastSenderIsMe = lastMsg?.senderId === meId;

  useEffect(() => {
    if (!lastMsg) return;
    if (isAtBottom.current || lastSenderIsMe) {
      // 자동 하단 이동
      scrollToBottom(!lastSenderIsMe); // 내가 보낸 건 즉시(auto)도 OK, 상대방이면 부드럽게
      setNewToastCount(0);
    } else {
      // 아래가 아니면 토스트 카운트 증가
      setNewToastCount((c) => Math.min(c + 1, 99));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  /** 전송 */
  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    // 낙관적 스크롤
    scrollToBottom(false);
    try {
      await onSend(value);
      // 성공 후에도 하단으로
      scrollToBottom(true);
    } catch (e) {
      // 실패 시 입력 복구(선택)
      setText(value + "\n(전송 실패)");
    }
  }, [text, onSend, scrollToBottom]);

  /** 엔터: 전송 / 쉬프트+엔터: 줄바꿈 */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** 시간 포맷(간단) */
  const fmtTime = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  /** 말풍선 */
  const Bubble: React.FC<{ m: ChatMessage; isMine: boolean; showAvatar?: boolean }> = ({ m, isMine }) => {
    const status = m.status ?? "sent";
    const base =
      "max-w-[78%] rounded-2xl px-3 py-2 text-[15px] leading-6 whitespace-pre-wrap break-words shadow-sm";
    const mine = isMine ? "bg-blue-600 text-white" : "bg-white text-gray-900 ring-1 ring-gray-200";
    // 상태 아이콘(읽음/안읽음)
    const StatusIcon = () => {
      if (!isMine) return null;
      if (status === "sending") return <span className="ml-1 text-xs opacity-80">…전송중</span>;
      if (status === "sent") return <span className="ml-1 text-xs opacity-80">보냄</span>;
      if (status === "delivered") return <span className="ml-1 text-xs opacity-80">전달됨 ✓</span>;
      if (status === "read") return <span className="ml-1 text-xs text-emerald-300">읽음 ✓✓</span>;
      return null;
    };
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-3`}>
        <div className={`relative ${base} ${mine}`}>
          {m.content}
          <div className={`mt-1 flex items-center ${isMine ? "justify-end" : "justify-start"} text-[11px] opacity-70`}>
            <span>{fmtTime(m.createdAt)}</span>
            <StatusIcon />
          </div>
        </div>
      </div>
    );
  };

  /** 헤더 (상대 온라인 표시) */
  const HeaderBar = (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white/80 backdrop-blur">
      <div>
        <div className="text-[15px] font-semibold text-gray-900">{partnerName}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isPartnerOnline ? "bg-emerald-500" : "bg-gray-300"}`}
          />
          {isPartnerOnline ? "온라인" : "오프라인"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-[#f6f7f9] rounded-xl border">
      {HeaderBar}

      {/* 메시지 리스트 */}
      <div ref={setListNode} className="flex-1 overflow-y-auto py-3">
        {/* 상단 센티널 (무한 스크롤용) */}
        <div ref={topSentinelRef} />
        {loadingMore && <div className="py-2 text-center text-xs text-gray-500">이전 메시지 불러오는 중…</div>}

        <div className="space-y-2">
          {messages.map((m) => {
            const isMine = m.senderId === meId;
            return <Bubble key={String(m.id)} m={m} isMine={isMine} />;
          })}
        </div>

        {/* 하단 센티널 */}
        <div ref={bottomRef} />
      </div>

      {/* 하단 입력 */}
      <div className="relative border-t bg-white p-3">
        {/* 스크롤 아래 토스트 */}
        {newToastCount > 0 && !isAtBottom.current && (
          <button
            onClick={() => {
              scrollToBottom(true);
              setNewToastCount(0);
            }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-gray-900 text-white text-xs px-3 py-1 shadow"
          >
            새 메시지 {newToastCount}개 • 맨 아래로
          </button>
        )}

        <div className="flex items-end gap-2">
          <textarea
            value={text}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            className="flex-1 max-h-40 min-h-[44px] resize-none rounded-xl border border-gray-300 px-3 py-2 text-[15px] leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="h-[42px] shrink-0 rounded-xl bg-blue-600 px-4 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[.99]"
          >
            보내기
          </button>
        </div>

        <div className="mt-1 text-[11px] text-gray-500">Enter: 전송 • Shift+Enter: 줄바꿈</div>
      </div>
    </div>
  );
}
