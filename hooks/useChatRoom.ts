// hooks/useChatRoom.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { ChatMessageDTO, getMessages, markReadAPI, sendMessageAPI } from "@/lib/chatApi";

/** ===== UI용 메시지 타입 ===== */
export type UIMessage = {
  id: string | number;
  senderId: number;
  content: string; // ← string으로 고정 (null 방지)
  createdAt: Date;
  status?: "sending" | "sent" | "read";
};

/** ===== 서버 → UI 정규화 (단일 출처) ===== */
// hooks/useChatRoom.ts
function normalizeDbMessage(m: any, meId: number): UIMessage {
  // ✅ sender 후보를 모두 커버
  const senderRaw =
    m.senderId ??
    m.sender_id ??
    m.author_user_id ??
    m.authorUserId ??
    m.user_id ??
    m.userId ??
    0;

  // ✅ createdAt 후보를 모두 커버
  const created =
    m.createdAt ? new Date(m.createdAt) :
    m.created_at ? new Date(m.created_at) :
    new Date();

  // ✅ status 기본값: 내가 보낸 거면 최소 'sent'
  let st: UIMessage["status"] | undefined =
    (m.status as any) ??
    (m.is_read ? "read" : undefined);

  if (!st && Number(senderRaw) === Number(meId)) st = "sent";

  return {
    id: m.id,
    senderId: Number(senderRaw),
    content: (m.content ?? "").toString(),
    createdAt: created,
    status: st,
  };
}


export function useChatRoom({
  threadId,
  meId,
  authToken,          // 선택(쿠키 인증이면 생략 가능)
  pageSize = 30,
}: {
  threadId: number;
  meId: number;
  authToken?: string;
  pageSize?: number;
}) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [hasMorePrev, setHasMorePrev] = useState(true);
  const [loading, setLoading] = useState(false);

  // 스크롤 & 토스트 제어
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showNewToast, setShowNewToast] = useState(false);
  const atBottomRef = useRef(true);

  // 초기 로드 (최신부터 pageSize)
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getMessages(threadId, { page: 1, page_size: pageSize, order_dir: "DESC" });
      // 서버는 DESC → UI는 시간 오름차순으로
      const arr = [...(r.items ?? [])].reverse().map((m: any) => normalizeDbMessage(m, meId));
      setMessages(arr);
      setHasMorePrev((r.total_pages ?? 1) > 1);

      // 맨 아래로 스크롤
      requestAnimationFrame(() => scrollToBottom(true));
    } finally {
      setLoading(false);
    }
  }, [threadId, pageSize, meId]);

  // 이전 메시지 더 불러오기 (무한스크롤 상단)
  const loadPrev = useCallback(async () => {
    if (!messages.length || !hasMorePrev || loading) return;
    setLoading(true);
    try {
      const firstId = Number(messages[0].id);
      const r = await getMessages(threadId, { page_size: pageSize, before_id: firstId, order_dir: "DESC" });
      const arr = [...(r.items ?? [])].reverse().map((m: any) => normalizeDbMessage(m, meId));

      if (arr.length === 0) {
        setHasMorePrev(false);
        return;
      }

      // 현재 스크롤 위치 보존
      const el = containerRef.current;
      const prevHeight = el?.scrollHeight ?? 0;

      setMessages((prev) => [...arr, ...prev]);

      // 새로 렌더 후, 이전 높이 차이만큼 올려서 같은 위치 유지
      requestAnimationFrame(() => {
        if (!el) return;
        const newHeight = el.scrollHeight;
        el.scrollTop = newHeight - prevHeight + el.scrollTop;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, hasMorePrev, loading, threadId, pageSize, meId]);

  // 읽음 처리 API
  const markRead = useCallback(
    async (messageId: number) => {
      try {
        await markReadAPI(threadId, messageId, false);
      } catch {
        // no-op
      }
    },
    [threadId]
  );

  // hooks/useChatRoom.ts (소켓 부분)
useEffect(() => {
  const socket = getSocket();
  socket.emit("join_room", { roomId: threadId });

  const onNew = (payload: any) => {
    const dto = payload?.message;
    const dtoThreadId = dto?.thread_id ?? dto?.threadId;  // ✅ 둘 다 허용
    if (!dto || Number(dtoThreadId) !== Number(threadId)) return;

    const ui = normalizeDbMessage(dto, meId);
    setMessages(prev => [...prev, ui]);

    if (!atBottomRef.current) setShowNewToast(true);
    if (ui.senderId !== meId && atBottomRef.current && typeof ui.id === "number") {
      markRead(ui.id as number);
    }
  };

  const onRead = (payload: any) => {
    const last = Number(payload?.last_read_message_id);
    const readerId = Number(payload?.userId);
    if (!last || !readerId) return;
    if (readerId !== meId) {
      setMessages(prev =>
        prev.map(m =>
          m.senderId === meId && typeof m.id === "number" && m.id <= last
            ? { ...m, status: "read" }
            : m
        )
      );
    }
  };

  socket.on("new_message", onNew);
  socket.on("read", onRead);
  return () => {
    socket.emit("leave_room", { roomId: threadId });
    socket.off("new_message", onNew);
    socket.off("read", onRead);
  };
}, [threadId, authToken, meId, markRead]);


  // 초기 로드
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // 스크롤 하단 판단 & 도달 시 읽음 처리
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 8;
    atBottomRef.current = nearBottom;

    if (nearBottom && messages.length) {
      setShowNewToast(false);
      const last = messages[messages.length - 1];
      // 마지막 메시지가 상대 메시지면 읽음 처리
      if (last && last.senderId !== meId && typeof last.id === "number") {
        markRead(last.id as number);
      }
    }
  }, [messages, meId, markRead]);

  // 전송
  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const tempId = `tmp-${Date.now()}`;
      const now = new Date();

      // 낙관적 반영
      setMessages((prev) => [
        ...prev,
        { id: tempId, senderId: meId, content: text, createdAt: now, status: "sending" },
      ]);

      // 바닥으로 내리기
      requestAnimationFrame(() => scrollToBottom(true));

      try {
        const r = await sendMessageAPI(threadId, { type: "TEXT", content: text });
        const real = r.item; // 서버가 되돌려 준 실제 메시지
        const normalized = normalizeDbMessage(real, meId);

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...normalized, status: "sent" } : m))
        );

        // 전송 후 바닥 유지
        requestAnimationFrame(() => scrollToBottom(true));
      } catch (e) {
        // 실패 표시 (원하면 status: "error" 등으로 UI 구분)
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
        );
      }
    },
    [threadId, meId]
  );

  // 스크롤 유틸
  const scrollToBottom = useCallback((smooth = false) => {
    const el = containerRef.current;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setShowNewToast(false);
  }, []);

  return {
    messages,
    loading,
    containerRef,
    showNewToast,
    setShowNewToast,
    onScroll,
    loadPrev,
    hasMorePrev,
    send,
    scrollToBottom,
  };
}
