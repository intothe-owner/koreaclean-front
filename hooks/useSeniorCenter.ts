// hooks/useSeniorCenters.ts
'use client';

import { fetchWithAuth } from '@/lib/fetchWitgAuth';
import { baseUrl } from '@/lib/variable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type SeniorCenterRow = {
  id: number;
  name: string;
  address: string;
  address_detail: string;
  post_code?: string;
  lat?: number | null;
  lng?: number | null;
};

async function fetchSeniorCenters(): Promise<SeniorCenterRow[]> {
  const res = await fetchWithAuth(`${baseUrl}/senior/request-list`, {
    method: 'GET',
    credentials: 'include', // 쿠키 인증
  });
  const json = await res.json();
  if (!res.ok || !json?.is_success) {
    throw new Error(json?.message || '목록 조회 실패');
  }
  return Array.isArray(json.items) ? json.items : [];
}

async function deleteSeniorCenter(id: number) {
  const res = await fetchWithAuth(`/backend/senior/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.is_success === false) {
    throw new Error(json?.message || '삭제 실패');
  }
  return true;
}

export function useSeniorCenters() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['senior-centers'],
    queryFn: fetchSeniorCenters,
    staleTime: 60_000, // 1분
  });

  const del = useMutation({
    mutationFn: deleteSeniorCenter,
    onSuccess: () => {
      // 목록 갱신
      qc.invalidateQueries({ queryKey: ['senior-centers'] });
    },
  });

  return { ...query, del };
}
