// hooks/useDownload.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "@/lib/variable";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

/* -------- 타입 정의 -------- */

export type DownloadOrderBy = "createdAt" | "title" | "views";
export type DownloadOrderDir = "ASC" | "DESC";

export interface DownloadListQueryParams {
  q?: string;
  page?: number;
  page_size?: number;
  order_by?: DownloadOrderBy;
  order_dir?: DownloadOrderDir;
}

export type DownloadFile = {
  id?: number | string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
};

export type DownloadItem = {
  id: number;
  title: string;
  description?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  files?: DownloadFile[];
};

export interface DownloadListResponse {
  is_success: boolean;
  total: number;
  items: DownloadItem[];
  page: number;
  page_size: number;
}

/* -------- 목록 조회 훅 -------- */

export function useDownloadListQuery(params: DownloadListQueryParams) {
  return useQuery<DownloadListResponse, Error>({
    queryKey: ["download-list", params],
    queryFn: async () => {
      const usp = new URLSearchParams();
      if (params.q) usp.set("q", params.q);
      if (params.page) usp.set("page", String(params.page));
      if (params.page_size) usp.set("page_size", String(params.page_size));
      if (params.order_by) usp.set("order_by", params.order_by);
      if (params.order_dir) usp.set("order_dir", params.order_dir);

      const url = `${baseUrl}/site/download?${usp.toString()}`;
      const res = await fetchWithAuth(url, { method: "GET" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "자료실 목록 조회에 실패했습니다.");
      }

      const data = (await res.json()) as DownloadListResponse;
      return data;
    },
  });
}

/* -------- 삭제 훅 -------- */

type DeleteDownloadInput = { id: number };

export function useDeleteDownloadMutation(
  onSuccess?: () => void,
  onError?: (err: Error) => void
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteDownloadInput>({
    mutationFn: async ({ id }) => {
      const res = await fetchWithAuth(`${baseUrl}/site/download/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "자료 삭제에 실패했습니다.");
      }
    },
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["download-list"] });
      onSuccess?.();
    },
    onError: (err) => {
      onError?.(err);
    },
  });
}
