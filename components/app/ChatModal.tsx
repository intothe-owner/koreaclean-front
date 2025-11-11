"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

type ChatMessage = {
  id: number;
  room_id: number;
  user_id: number;
  content?: string;
  text?: string;
  created_at: string;
};

export default function ChatModal({
  open,
  onClose,
  title,
  meId,
  roomId: roomIdProp,       // (선택) 이미 알고 있는 방 PK
  serviceRequestId,         // ✅ 서버에서 방 보장은 service_request_id로 처리
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  meId: number;
  roomId?: number;
  serviceRequestId?: number | string;
}) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [text, setText] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);
  const didInit = useRef(false);
  const loadedForRoomRef = useRef<Set<number>>(new Set()); // ✅ roomId별 초기 로드 1회 보장
  const [sockReady, setSockReady] = useState(false);

  // 서버에서 확정된 실제 room_id (ChatRoom PK)
  const [roomId, setRoomId] = useState<number | undefined>(roomIdProp);
  useEffect(() => {
    if (roomIdProp) setRoomId(roomIdProp);
  }, [roomIdProp]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return d.toTimeString().slice(0, 5);
    } catch {
      return "";
    }
  };

  function dedupById(arr: ChatMessage[]) {
    const seen = new Set<number>();
    return arr.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  const getMsgText = (m: ChatMessage) => m.content ?? m.text ?? "";

  // --- 초기 메시지 로드 (roomId 확정 후)
  async function fetchInitial(currentRoomId?: number) {
    const rid = currentRoomId ?? roomId;
    if (!rid) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("limit", "30");
      q.set("dir", "backward");
      const res = await fetchWithAuth(`/backend/chat/rooms/${rid}/messages?` + q.toString(), {
        credentials: "include",
        cache: "no-store", // ✅ 캐시 금지
      });
      if (!res.ok) throw new Error("메시지 조회 실패");
      const json = await res.json();
      const list: ChatMessage[] = json?.items ?? [];
      setItems(list);
      setNextCursor(json?.nextCursor);
      scrollToBottom();

      // 읽음 처리
      await fetchWithAuth(`/backend/chat/rooms/${rid}/read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      setLoading(false);
    }
  }

  // --- 과거 메시지 추가 로드
  async function fetchBackward() {
    if (!nextCursor || !roomId) return;
    const q = new URLSearchParams();
    q.set("limit", "30");
    q.set("dir", "backward");
    q.set("cursor", nextCursor);
    const res = await fetchWithAuth(`/backend/chat/rooms/${roomId}/messages?` + q.toString(), {
      credentials: "include",
      cache: "no-store", // ✅ 캐시 금지
    });
    if (!res.ok) return;
    const json = await res.json();
    const list: ChatMessage[] = json?.items ?? [];
    setItems((prev) => dedupById([...list, ...prev]));
    setNextCursor(json?.nextCursor);
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop < 60 && nextCursor && !loading) {
      fetchBackward();
    }
  }

  // --- roomId가 확정되는 즉시 초기 로드 (소켓과 무관하게 보장)
  useEffect(() => {
    if (!open) return;
    if (!roomId) return;
    if (loadedForRoomRef.current.has(roomId)) return; // 중복 방지
    loadedForRoomRef.current.add(roomId);

    // 새 방이면 UI 초기화 (선택)
    setItems([]);
    setNextCursor(undefined);

    fetchInitial(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roomId]);

  // --- 소켓 연결/조인/이벤트
  useEffect(() => {
    if (!open) return;
    if (didInit.current) return;
    didInit.current = true;

    const socket = getSocket();

    const onConnect = async () => {
      setSockReady(true);

      // 1) serviceRequestId가 있으면 REST로 방 보장 + room_id 확정
      if (serviceRequestId) {
        try {
          const resp = await fetchWithAuth(`/backend/chat/rooms/open`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_request_id: serviceRequestId }),
          });
          const data = await resp.json();
          if (data?.is_success && data?.room?.id) {
            const rid = Number(data.room.id);
            setRoomId(rid);

            // 2) 소켓 방 조인 (서버 이벤트명에 맞춤: room:join, payload.conversationId)
            socket.emit("room:join", { conversationId: rid });

            // ✅ 초기 로드는 roomId 변경 훅에서 보장
          } else if (roomIdProp) {
            // fallback: 이미 아는 roomId로 진행
            socket.emit("room:join", { conversationId: roomIdProp });
            setRoomId(roomIdProp); // ✅ 변경 훅이 로드 수행
          }
        } catch (e) {
          console.error("[chat] open room failed", e);
          // fallback
          if (roomIdProp) {
            socket.emit("room:join", { conversationId: roomIdProp });
            setRoomId(roomIdProp);
          }
        }
      } else if (roomIdProp) {
        // serviceRequestId가 없고 roomId만 주어진 경우
        socket.emit("room:join", { conversationId: roomIdProp });
        setRoomId(roomIdProp); // ✅ 변경 훅이 로드 수행
      }
    };

    const onDisconnect = () => setSockReady(false);

    // 서버 표준 이벤트: 새 메시지
    const onNewMessage = (msg: ChatMessage) => {
      if (!msg) return;
      if (roomId && msg.room_id !== roomId) return;
      setItems((prev) => dedupById([...prev, msg]));
      // 스크롤 다운
      if (
        msg.user_id === meId ||
        (listRef.current &&
          listRef.current.scrollHeight - listRef.current.scrollTop < 800)
      ) {
        scrollToBottom();
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onNewMessage); // 서버 라우터/소켓 모두 'message:new'로 브로드캐스트

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onNewMessage);
      didInit.current = false;
      loadedForRoomRef.current.clear(); // 다음 오픈 시 초기 로드 다시 허용
    };
  }, [open, serviceRequestId, roomIdProp, meId, roomId]);

  // --- 메시지 전송: REST 사용(서버가 message:new 브로드캐스트)
  async function send() {
    const message = text.trim();
    if (!roomId || !message) return;

    setSending(true);
    try {
      const res = await fetchWithAuth(`/backend/chat/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: roomId, // router가 room_id도 허용하지만 통일해서 conversationId 사용
          message_type: "TEXT",
          text: message,
        }),
      });
      const json = await res.json();
      if (!json?.is_success) {
        throw new Error(json?.message || "전송 실패");
      }
      setText("");
      scrollToBottom();
    } catch (e: any) {
      alert("전송 실패: " + (e?.message || String(e)));
    } finally {
      setSending(false);
    }
  }

  // Enter 전송
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) send();
    }
  }

  // 모달 닫힐 때 읽음 처리(선택)
  useEffect(() => {
    if (!open || !roomId) return;
    return () => {
      fetchWithAuth(`/backend/chat/rooms/${roomId}/read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    };
  }, [open, roomId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[1001] w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {title || "채팅"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              방 번호: {roomId ?? roomIdProp ?? "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50"
          >
            닫기
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="max-h-[70vh] overflow-y-auto px-3 py-3 sm:px-4 sm:py-4"
        >
          {loading && items.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">불러오는 중…</div>
          )}

          {items.length === 0 && !loading && (
            <div className="py-10 text-center text-sm text-gray-400">메시지가 없습니다.</div>
          )}

          {items.map((m) => {
            const mine = m.user_id === meId;
            return (
              <div key={m.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {getMsgText(m)}
                  </div>
                  <div className={`mt-1 text-[10px] ${mine ? "text-indigo-100/80" : "text-gray-500"}`}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div className="flex items-end gap-2 border-t px-3 py-3 sm:px-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요…"
            className="min-h-[44px] max-h-[160px] w-full resize-y rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim() || !roomId}
            className="h-[44px] shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
