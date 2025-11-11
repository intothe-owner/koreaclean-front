"use client";

import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { baseUrl, RequestForm } from "@/lib/variable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type SRStatus = "WAIT" | "IN_PROGRESS" | "DONE" | "CANCELLED";



export type ServiceRequestsResponse = {
  is_success: boolean;
  items: RequestForm[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  order_by?: string;
  order_dir?: "ASC" | "DESC";
  message?: string;
  mine?:string;
};

export type ServiceRequestsQuery = {
  page?: number;
  page_size?: number;
  org_name?: string;        // 기관명 검색
  contact_name?: string;    // 담당자명 검색
  status?: string;          // WAIT/IN_PROGRESS/DONE/CANCELLED 또는 한글(대기/진행중/완료/취소)
  order_by?: "createdAt" | "hope_date";
  order_dir?: "ASC" | "DESC";
  /**
   * 인증쿠키를 쓰면 true (기본). Authorization 헤더를 쓰면 false.
   */
  withCredentials?: boolean;
  accessToken?: string; // Authorization: Bearer 토큰 필요 시
  mine?:string;
  unread_count?:number;
};

export function buildRequestQuery(params: ServiceRequestsQuery = {}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set("page", String(params.page));
  if (params.page_size) qp.set("page_size", String(params.page_size));
  if (params.org_name) qp.set("org_name", params.org_name);
  if (params.contact_name) qp.set("contact_name", params.contact_name);
  if (params.status) qp.set("status", params.status); 
  if (params.order_by) qp.set("order_by", params.order_by);
  if (params.order_dir) qp.set("order_dir", params.order_dir);
  if (params.mine) qp.set("mine", params.mine);
  return qp.toString();
}

export async function fetchServiceRequests(params: ServiceRequestsQuery = {}): Promise<ServiceRequestsResponse> {
  const qs = buildRequestQuery(params); 

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (params.accessToken) headers.Authorization = `Bearer ${params.accessToken}`;

  const res = await fetchWithAuth(`/backend/request/list?${qs}`, {
    method: "GET",
    headers,
    credentials: params.withCredentials === false ? "same-origin" : "include",
  });
  const json = (await res.json()) as ServiceRequestsResponse;
  if (!res.ok || json.is_success === false) {
    throw new Error(json.message || "서비스 신청 목록 조회 실패");
  }
  return json;
}

export function useServiceRequests(params: ServiceRequestsQuery) {
  console.log(params);
  return useQuery({
    queryKey: ["service-requests", params],
    queryFn: () => fetchServiceRequests(params),
    placeholderData: (prev) => prev, // 페이지 전환 깜빡임 최소화
    staleTime: 10_000,
  });
}

// (선택) 상태 변경 훅 — 필요 시 사용
export function useUpdateServiceRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SRStatus }) => {
      const res = await fetchWithAuth(`${baseUrl}/request/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}
//업체가 서비스 배정상태 변경
export function useUpdateAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      cancel_memo,
    }: {
      id: number | string;
      status: "ACCEPTED" | "DECLINED";
      cancel_memo?: string; // DECLINED일 때 필수
    }) => {
      const res = await fetchWithAuth(`/backend/request/assignment/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, cancel_memo }),
      });
      const json = await res.json();
      if (!res.ok || json?.is_success === false) {
        throw new Error(json?.message || "배정 상태 변경 실패");
      }
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

export function useSaveEstimateAmount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, amount }: { requestId: number; amount: number }) => {
      const res = await fetchWithAuth(`/backend/request/${requestId}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("견적금액 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

export function useUploadEstimateFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, files }: { requestId: number; files: File[] }) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f)); // 백엔드: field name "files" 기준
      const res = await fetchWithAuth(`/backend/request/${requestId}/estimate/files`, {
        method: "POST",
        credentials: "include",
        body: fd, // 멀티파트
      });
      if (!res.ok) throw new Error("견적서 업로드 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}