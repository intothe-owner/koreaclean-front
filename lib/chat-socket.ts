// lib/chat-socket.ts
"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    socket = io("/chat", {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
}
