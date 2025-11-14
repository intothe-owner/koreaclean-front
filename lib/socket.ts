// lib/socket.ts
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

function pickBaseURL() {
  if (typeof window === "undefined") return "/";
  //return "http://113.131.151.103:4500"; // 백엔드 직접 접속
  return "http://back.koreaclean.kr"; // 백엔드 직접 접속
}

function getAccessToken(): string | undefined {
  try {
    const fromLS =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") || undefined
        : undefined;
    if (fromLS) return fromLS;
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
  } catch {}
  return undefined;
}

/** /chat 네임스페이스 소켓 */
export function getSocket() {
  if (_socket && _socket.connected) return _socket;

  const base = pickBaseURL();
  const token = getAccessToken();

  _socket = io(`${base}/chat`, {
    path: "/socket.io",
    withCredentials: false,
    transports: ["websocket", "polling"],
    auth: token ? { token } : undefined,
    autoConnect: true,
  });

  _socket.on("connect_error", (e) => {
    console.error("[socket] connect_error:", e?.message || e);
  });

  return _socket;
}

/** 내 사용자룸 join (서버가 user:{id}로 넣어줌) */
export function joinUserRoom(userId: number) {
  try {
    const s = getSocket();
    if (!userId) return;
    s.emit("join:user", { user_id: Number(userId) });
  } catch (e) {
    console.warn("[socket] joinUserRoom failed", e);
  }
}

/** 특정 대화방 join/leave (conv:{roomId}) */
export function joinConv(roomId: number) {
  try {
    const s = getSocket();
    if (!roomId) return;
    s.emit("join:conv", { room_id: Number(roomId) });
  } catch (e) {
    console.warn("[socket] joinConv failed", e);
  }
}

export function leaveConv(roomId: number) {
  try {
    const s = getSocket();
    if (!roomId) return;
    s.emit("leave:conv", { room_id: Number(roomId) });
  } catch (e) {
    console.warn("[socket] leaveConv failed", e);
  }
}

export function closeSocket() {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.close();
    _socket = null;
  }
}
