// hooks/useUnreadBadges.ts
"use client";
import { create } from "zustand";
import { useEffect } from "react";
import { getChatSocket } from "@/lib/chat-socket";

type BadgeState = {
  // service_request_id -> unread_count
  counts: Record<number, number>;
  setCount: (reqId: number, n: number) => void;
  bump: (reqId: number, delta?: number) => void;
  get: (reqId?: number | null) => number;
  // 최초 1회 초기화용
  seeded: boolean;
  seedInitialCounts: (items: Array<{ id: number; unread_count?: number }>) => void;
  clear: () => void;
};

export const useUnreadBadges = create<BadgeState>((set, get) => ({
  counts: {},
  setCount: (reqId, n) =>
    set((s) => ({ counts: { ...s.counts, [reqId]: Math.max(0, Number(n) || 0) } })),
  bump: (reqId, d = 1) =>
    set((s) => {
      const curr = s.counts[reqId] ?? 0;
      return { counts: { ...s.counts, [reqId]: Math.max(0, curr + d) } };
    }),
  get: (reqId) => (reqId ? get().counts[reqId] ?? 0 : 0),
  seeded: false,
  seedInitialCounts: (items) => {
    if (get().seeded) return;
    const next: Record<number, number> = {};
    for (const it of items) next[it.id] = Math.max(0, Number(it.unread_count ?? 0));
    set({ counts: next, seeded: true });
  },
  clear: () => set({ counts: {}, seeded: false }),
}));

/** 소켓 이벤트(room:unread)로 실시간 뱃지 갱신 */
export function useUnreadSocket(meId?: number | null) {
  useEffect(() => {
    const socket = getChatSocket();

    const onConnect = () => {
      if (meId) socket.emit("join:user", { user_id: Number(meId) });
    };

    // 서버가 아래 payload를 보내도록 해주세요(4) 참고):
    // { room_id:number, service_request_id:number, unread_count:number }
    const onUnread = (p: any) => {
      const reqId = Number(p?.service_request_id);
      if (!reqId) return;
      if (typeof p?.unread_count === "number") {
        useUnreadBadges.getState().setCount(reqId, p.unread_count);
      } else {
        useUnreadBadges.getState().bump(reqId, 1);
      }
    };

    socket.on("connect", onConnect);
    socket.on("room:unread", onUnread);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:unread", onUnread);
    };
  }, [meId]);
}
