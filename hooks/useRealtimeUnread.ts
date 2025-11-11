// hooks/useRealtimeUnread.ts
"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

type CountsState = {
  counts: Record<number, number>; // room_id -> unread_count
  roomMap: Record<number, number>; // service_request_id -> room_id
  getCount: (roomId?: number | null) => number;
  setCount: (roomId: number, n: number) => void;
  bump: (roomId: number, delta?: number) => void;
  setZeroLocal: (roomId: number) => void;
  setRoomIdForRequest: (serviceRequestId: number, roomId: number) => void;
  getRoomIdByRequest: (serviceRequestId: number) => number | undefined;
  clearAll: () => void;
};

export const useUnreadStore = create<CountsState>((set:any, get:any) => ({
  counts: {},
  roomMap: {},
  getCount: (roomId:any) => (roomId ? get().counts[roomId] ?? 0 : 0),
  setCount: (roomId:any, n:any) =>
    set((s:any) => ({ counts: { ...s.counts, [roomId]: Math.max(0, Number(n) || 0) } })),
  bump: (roomId:any, delta = 1) =>
    set((s:any) => {
      const curr = s.counts[roomId] ?? 0;
      return { counts: { ...s.counts, [roomId]: Math.max(0, curr + delta) } };
    }),
  setZeroLocal: (roomId:any) =>
    set((s:any) => ({ counts: { ...s.counts, [roomId]: 0 } })),
  setRoomIdForRequest: (reqId:any, roomId:any) =>
    set((s:any) => ({ roomMap: { ...s.roomMap, [reqId]: roomId } })),
  getRoomIdByRequest: (reqId:any) => get().roomMap[reqId],
  clearAll: () => set({ counts: {}, roomMap: {} }),
}));

/** 사용자 개인 룸 조인 + room:unread/room:read 이벤트 수신 */
export function useRealtimeUnread(meId?: number | null) {
  const store = useUnreadStore();
  const socket: Socket = useMemo(
    () =>
      io("/chat", {
        withCredentials: true,
        autoConnect: true,
        transports: ["websocket"],
      }),
    []
  );

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (meId) socket.emit("join:user", { user_id: Number(meId) });
    };

    const onUnread = (p: { room_id: number; unread_count?: number; service_request_id?: number }) => {
      if (typeof p.unread_count === "number") {
        store.setCount(Number(p.room_id), Number(p.unread_count));
      } else {
        store.bump(Number(p.room_id), 1);
      }
      if (p.service_request_id) {
        store.setRoomIdForRequest(Number(p.service_request_id), Number(p.room_id));
      }
    };

    const onRead = (_p: { room_id: number; user_id?: number }) => {
      // 필요 시 처리 (옵션)
    };

    socket.on("connect", onConnect);
    socket.on("room:unread", onUnread);
    socket.on("room:read", onRead);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:unread", onUnread);
      socket.off("room:read", onRead);
    };
  }, [socket, meId, store]);

  /** 목록의 service_request_id 들을 방 보장하여 room_id 매핑 확보 */
  async function ensureRoomsForRequests(reqIds: number[]) {
    const unique = Array.from(new Set(reqIds.filter(Boolean)));
    if (!unique.length) return;
    try {
      await Promise.all(
        unique.map(async (rid) => {
          const res = await fetchWithAuth(`/backend/chat/rooms/open`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ service_request_id: rid }),
          });
          const json = await res.json().catch(() => null);
          const roomId = json?.room?.id;
          const unread = json?.member?.unread_count;
          if (roomId) {
            store.setRoomIdForRequest(rid, Number(roomId));
            if (typeof unread === "number") {
              store.setCount(Number(roomId), Number(unread));
            }
          }
        })
      );
    } catch (e) {
      console.warn("ensureRoomsForRequests failed", e);
    }
  }

  /** 읽음 처리: 서버 + 로컬 동기화 */
  async function markRead(roomId: number) {
    if (!roomId) return;
    try {
      const res = await fetchWithAuth(`/backend/chat/rooms/${roomId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) store.setZeroLocal(roomId);
    } catch (e) {
      console.warn("markRead failed", e);
    }
  }

  return {
    getCount: store.getCount,
    getRoomIdByRequest: store.getRoomIdByRequest,
    ensureRoomsForRequests,
    markRead,
  };
}
