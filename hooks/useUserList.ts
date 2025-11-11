// hooks/useUserList.ts
"use client";

import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { useQuery, keepPreviousData } from "@tanstack/react-query"; // ⬅️ 헬퍼 임포트 추가

export type Role = "SUPER" | "ADMIN" | "CLIENT" | "COMPANY";
export type SearchKey = "email" | "name" | "phone";

export type UserRow = {
  id: number;
  name: string;
  inst: string;
  email: string;
  contact?: string | null;
  phone?: string | null;
  role: Role;
  provider: "local" | "naver" | "kakao" | "google";
  is_use?: boolean;             // ⬅️ 추가
  createdAt?: string;
  updatedAt?: string;
};


export type UserListParams = {
  q?: string;
  key?: SearchKey;
  role?: Role | "";
  page?: number;
  page_size?: number;
  order_by?: "id"|"email"|"name"|"inst"|"role"|"createdAt"|"updatedAt";
  order_dir?: "ASC"|"DESC";
  use?: "active" | "inactive" | "all"; // ⬅️ 추가
};


export type UserListResponse = {
  is_success: boolean;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  items: UserRow[];
};

async function fetchUserList(params: UserListParams): Promise<UserListResponse> {
  const url = new URL("/backend/users/list", window.location.origin);
  Object.entries({
    q: params.q ?? "",
    key: params.key ?? "email",
    role: params.role ?? "",
    page: params.page ?? 1,
    page_size: params.page_size ?? 10,
    order_by: params.order_by ?? "createdAt",
    order_dir: params.order_dir ?? "DESC",
    use: params.use ?? "active",                  // ⬅️ 추가
  }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) {
      url.searchParams.set(k, String(v));
    }
  });
  const res = await fetchWithAuth(url.toString(), {
    method: "GET",
    credentials: "include", // 쿠키(엑세스 토큰) 사용
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET /users/list failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as UserListResponse;
  if (!data?.is_success) throw new Error("API returned is_success=false");
  return data;
}

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUserList(params),
   placeholderData: keepPreviousData,   
    staleTime: 10_000,          // 10s
  });
}
