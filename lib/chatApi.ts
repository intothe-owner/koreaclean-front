// lib/backend/chatApi.ts
export type ChatMessageDTO = {
  id: number;

  // ✅ thread id: snake | camel 모두 허용
  thread_id?: number;
  threadId?: number;

  // ✅ author/sender: 다양한 키 허용
  author_user_id?: number;
  authorUserId?: number;
  user_id?: number;
  userId?: number;
  sender_id?: number;
  senderId?: number;

  type?: "TEXT" | "IMAGE" | "FILE" | string;
  content?: string | null;
  attachments?: any | null;

  // ✅ created at: snake | camel 모두 허용
  createdAt?: string;
  created_at?: string;

  // 서버가 주면 사용 (옵션)
  is_read?: boolean;
  status?: "sending" | "sent" | "delivered" | "read" | string;
};

export async function listThreads(opts?: {
  page?: number;
  page_size?: number;
  status?: "OPEN" | "CLOSED";
  q?: string;
  credentials?: RequestCredentials;
}) {
  const qs = new URLSearchParams();
  if (opts?.page) qs.set("page", String(opts.page));
  if (opts?.page_size) qs.set("page_size", String(opts.page_size));
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.q) qs.set("q", opts.q);
  const res = await fetch(`/backend/chat/threads?${qs.toString()}`, {
    credentials: opts?.credentials ?? "include",
  });
  if (!res.ok) throw new Error("Failed to list threads");
  return res.json();
}

export async function getThread(threadId: number, credentials: RequestCredentials = "include") {
  const res = await fetch(`/backend/chat/threads/${threadId}`, { credentials });
  if (!res.ok) throw new Error("Failed to get thread");
  return res.json() as Promise<{ item: any; myRead?: any }>;
}

export async function getMessages(
  threadId: number,
  params?: { page?: number; page_size?: number; before_id?: number; after_id?: number; order_dir?: "ASC" | "DESC" },
  credentials: RequestCredentials = "include"
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  if (params?.before_id) qs.set("before_id", String(params.before_id));
  if (params?.after_id) qs.set("after_id", String(params.after_id));
  if (params?.order_dir) qs.set("order_dir", params.order_dir);
  const res = await fetch(`/backend/chat/threads/${threadId}/messages?${qs.toString()}`, { credentials });
  if (!res.ok) throw new Error("Failed to list messages");
  return res.json() as Promise<{ items: ChatMessageDTO[]; total: number; total_pages: number; page: number }>;
}

export async function sendMessageAPI(
  threadId: number,
  body: { type?: string; content?: string | null; attachments?: any },
  credentials: RequestCredentials = "include"
) {
  const res = await fetch(`/backend/chat/threads/${threadId}/messages`, {
    method: "POST",
    credentials,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json() as Promise<{ is_success: true; item: ChatMessageDTO }>;
}

export async function markReadAPI(
  threadId: number,
  lastMessageId: number,
  perMessage = false,
  credentials: RequestCredentials = "include"
) {
  const res = await fetch(`/backend/chat/threads/${threadId}/read`, {
    method: "POST",
    credentials,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ last_read_message_id: lastMessageId, perMessage }),
  });
  if (!res.ok) throw new Error("Failed to mark read");
  return res.json();
}
// lib/chatApi.ts
export async function resolveThreadByRequest(
  service_request_id: number,
  company_id?: number | null,
  credentials: RequestCredentials = 'include'
) {
  const res = await fetch(`/backend/chat/threads/resolve`, {
    method: 'POST',
    credentials,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service_request_id, company_id: company_id ?? null }),
  });
  if (!res.ok) throw new Error('Failed to resolve thread');
  return res.json() as Promise<{ is_success: true; item: { id: number } }>;
}
