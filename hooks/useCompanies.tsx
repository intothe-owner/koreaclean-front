"use client";

import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { baseUrl, CompanyItem } from "@/lib/variable";
import { QueryKey, useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";



export type CompaniesResponse = {
  is_success: boolean;
  items: CompanyItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type CompaniesQuery = {
  page?: number;
  page_size?: number;
  q?: string;
  status?: string; // 승인/대기/중지 or APPROVED/PENDING/REJECTED 등
  order_by?: string;
  order_dir?: "ASC" | "DESC";
  /**
   * 인증쿠키를 쓰면 true (기본). Authorization 헤더를 쓰면 false.
   */
  withCredentials?: boolean;
  accessToken?: string; // 필요시 Authorization: Bearer
  regions?: string[]; // ← 추가: "시도>시군구" 키 배열
};

// 추가: regions 쿼리스트링 반영
export function buildQuery(params: CompaniesQuery = {}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set("page", String(params.page));
  if (params.page_size) qp.set("page_size", String(params.page_size));
  if (params.q) qp.set("q", params.q);
  if (params.status) qp.set("status", params.status);
  if (params.order_by) qp.set("order_by", params.order_by);
  if (params.order_dir) qp.set("order_dir", params.order_dir);
  if (params.regions?.length) qp.set("regions", params.regions.join(",")); // ← 추가
  return qp.toString();
}

export async function fetchCompanies(params: CompaniesQuery = {}): Promise<CompaniesResponse> {
  const qs = buildQuery(params);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (params.accessToken) headers.Authorization = `Bearer ${params.accessToken}`;

  const res = await fetchWithAuth(`${baseUrl}/company/list?${qs}`, {
    method: "GET",
    headers,
    credentials: params.withCredentials === false ? "same-origin" : "include",
  });
  console.log(res);
  if (!res.ok) throw new Error("회사 목록 조회 실패");
  return res.json();
}
/** 🔧 옵션 타입: queryKey/queryFn은 내부에서 지정하니 제외(Omit) */
type CompaniesQueryOptions = Omit<
  UseQueryOptions<CompaniesResponse, Error, CompaniesResponse, QueryKey>,
  "queryKey" | "queryFn"
>;

/** 🔧 regions 정렬 등으로 키 안정화(선택사항이지만 추천) */
function normalizeParams(params: CompaniesQuery) {
  const p = { ...params }; 
  if (p.regions) p.regions = [...p.regions].sort();
  return p;
}
export function useCompanies(params: CompaniesQuery, options?: CompaniesQueryOptions) {
  const normalized = normalizeParams(params);
  return useQuery<CompaniesResponse, Error, CompaniesResponse, QueryKey>({
    queryKey: ["companies", normalized],
    queryFn: () => fetchCompanies(params),
    placeholderData: (prev) => prev,
    ...options, // ← 이제 enabled 같은 옵션을 안전하게 받을 수 있음
  });
}
export function useUpdateCompanyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "PENDING"|"APPROVED"|"REJECTED" }) => {
      const res = await fetchWithAuth(`/backend/company/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      return res.json();
    },
    onSuccess: () => {
      // 목록/상세 갱신
      qc.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetchWithAuth(`/backend/company/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("삭제 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

