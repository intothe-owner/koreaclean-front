"use client";
import React, { useMemo, useState } from "react";
import ChatPanel, { ChatMessage } from "./ChatPanel";

type ChatDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  meId: number;
  /** 초기 메시지 (UI 데모용) */
  initialMessages?: ChatMessage[];
};

export default function ChatDrawer({
  open,
  onClose,
  title = "채팅",
  meId,
  initialMessages = [],
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  async function onSend(text: string) {
    // ⬇️ UI 데모용 낙관적 전송
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, senderId: meId, content: text, createdAt: new Date(), status: "sending" },
    ]);
    // TODO: socket.emit('send_message', ...) or fetch('/chat/threads/:id/messages')
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: Date.now(), status: "sent" } : m
        )
      );
    }, 250);
  }

  const unreadTotal = useMemo(
    () => messages.filter((m) => m.senderId !== meId && (m.status === "sent" || m.status === "delivered")).length,
    [messages, meId]
  );

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      {/* drawer */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-xl transition-transform
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
            {unreadTotal > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">
                {unreadTotal}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-gray-50"
          >
            닫기
          </button>
        </div>

        <div className="h-[calc(100%-49px)] p-3">
          <div className="h-full">
            <ChatPanel
              meId={meId}
              partnerName="상대방"
              isPartnerOnline
              messages={messages}
              onSend={onSend}
              placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
