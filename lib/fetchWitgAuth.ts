// lib/fetchWithAuth.ts
import { getSession } from "next-auth/react"; // CSR 훅이면 useSession 사용

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const session = await getSession();
  const token = (session as any)?.accessToken;

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");

  return fetch(input, {
    ...init,
    headers,
    credentials: "include", // 필요 시
  });
}
