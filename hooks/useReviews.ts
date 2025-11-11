// src/hooks/useReviews.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'PENDING';

export interface ReviewDTO {
  id: number;
  title: string;
  content: string;
  rating: number;
  photo_url?: string | null;
  status: ReviewStatus;
  reviewer_user_id?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ReviewListResponse {
  is_success: boolean;
  items: ReviewDTO[];
  total: number;
  page: number;
  page_size: number;
}

export interface ReviewQueryParams {
  q?: string;
  status?: ReviewStatus;
  rating_min?: number; // 1~5
  rating_max?: number; // 1~5
  page?: number;       // 기본 1
  page_size?: number;  // 기본 20
  order_by?: 'createdAt' | 'rating';
  order_dir?: 'ASC' | 'DESC';
}

/** 쿼리스트링 생성 */
function toQS(params: ReviewQueryParams = {}) {
  const u = new URLSearchParams();
  if (params.q) u.set('q', params.q);
  if (params.status) u.set('status', params.status);
  if (params.rating_min != null) u.set('rating_min', String(params.rating_min));
  if (params.rating_max != null) u.set('rating_max', String(params.rating_max));
  u.set('page', String(params.page ?? 1));
  u.set('page_size', String(params.page_size ?? 20));
  u.set('order_by', String(params.order_by ?? 'createdAt'));
  u.set('order_dir', String(params.order_dir ?? 'DESC'));
  return u.toString();
}

/** 목록 가져오기 fetcher */
async function fetchReviews(params: ReviewQueryParams = {}): Promise<ReviewListResponse> {
  const qs = toQS(params);
  const res = await fetch(`/backend/reviews?${qs}`, {
    method: 'GET',
    credentials: 'include', // 세션/쿠키 인증 사용 시
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`리뷰 목록 조회 실패 (${res.status}) ${text}`);
  }
  return res.json();
}

/** 후기 삭제 (soft 기본 / force=1 이면 하드 삭제) */
async function deleteReview(id: number | string, force = false) {
  const res = await fetch(`/backend/reviews/${id}?force=${force ? 1 : 0}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`리뷰 삭제 실패 (${res.status}) ${text}`);
  }
  return res.json();
}

/** 후기 상태/내용 수정 */
async function updateReview(id: number | string, patch: Partial<Pick<ReviewDTO, 'title' | 'content' | 'rating' | 'status'>>) {
  const res = await fetch(`/backend/reviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`리뷰 수정 실패 (${res.status}) ${text}`);
  }
  return res.json();
}

/** 목록 훅 */
export function useReviews(params: ReviewQueryParams = {}) {
  const key = ['reviews', params];
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchReviews(params),
    staleTime: 30_000, // 30초
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? (params.page ?? 1),
    pageSize: query.data?.page_size ?? (params.page_size ?? 20),
  };
}

/** 삭제 훅 */
export function useDeleteReview(params: ReviewQueryParams = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force = false }: { id: number | string; force?: boolean }) => deleteReview(id, force),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', params] });
    },
  });
}

/** 수정 훅 */
export function useUpdateReview(params: ReviewQueryParams = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number | string; patch: Partial<Pick<ReviewDTO, 'title' | 'content' | 'rating' | 'status'>> }) =>
      updateReview(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', params] });
    },
  });
}
