// components/app/InquiryListModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { baseUrl } from '@/lib/variable';
import InquiryDetailModal from './InquiryDetailModal';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';

type InquiryStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';
type InquiryRow = {
  id: number;
  title: string;
  status: InquiryStatus;
  content: string;
  service_request_id: number | null;
  requester_user_id: number;
  company_id: number | null;
  createdAt: string;
  updatedAt: string;
};

type InquiryListResponse = {
  is_success: boolean;
  items: InquiryRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function InquiryListModal({
  open,
  onClose,
  requesterUserId,
  serviceRequestId,
  companyId,
}: {
  open: boolean;
  onClose: () => void;
  requesterUserId: number;
  serviceRequestId?: number | null;
  companyId?: number | null;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<'' | InquiryStatus>('');
  // 모달 상태 추가
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<{ id: number; title: string; status: string; content: string } | null>(null);
  useEffect(() => {
    if (!open) { setPage(1); setStatus(''); }
  }, [open]);

  const { data, isLoading, isError, error, refetch } = useQuery<InquiryListResponse>({
    queryKey: ['inquiry-list-modal', { requesterUserId, serviceRequestId, companyId, page, pageSize, status }],
    enabled: open && !!requesterUserId,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const sp = new URLSearchParams();
      sp.set('requester_user_id', String(requesterUserId));
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      if (status) sp.set('status', status);
      if (serviceRequestId) sp.set('service_request_id', String(serviceRequestId));
      if (companyId) sp.set('company_id', String(companyId));

      const url = `/backend/inquiry/list?${sp.toString()}`;
      const res = await fetchWithAuth(url, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`);
      return res.json() as Promise<InquiryListResponse>;
    },
    staleTime: 10_000,
  });

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return !open ? null : (
    <div className="fixed inset-0 z-[1200]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="text-lg font-semibold">1:1 문의 목록</div>
            <button
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              onClick={onClose}
            >
              닫기
            </button>
          </div>

          <div className="p-4">
            {/* 필터 */}
            <div className="mb-3 flex items-end justify-between gap-2">
              <div className="flex gap-2">
                <div>
                  <label className="text-xs text-gray-500">상태</label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value as InquiryStatus | ''); setPage(1); refetch(); }}
                    className="mt-1 w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">전체</option>
                    <option value="OPEN">OPEN</option>
                    <option value="ANSWERED">ANSWERED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); refetch(); }}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value={10}>10개씩</option>
                  <option value={20}>20개씩</option>
                  <option value={50}>50개씩</option>
                </select>
              </div>
            </div>

            {/* 리스트 */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="max-h-[50vh] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left w-14">ID</th>
                      <th className="px-3 py-2 text-left">제목</th>
                      <th className="px-3 py-2 text-left w-24">상태</th>
                      <th className="px-3 py-2 text-left w-40">등록일</th>
                      <th className="px-3 py-2 text-right w-24">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-500">로딩 중…</td></tr>
                    )}
                    {isError && (
                      <tr><td colSpan={5} className="py-10 text-center text-rose-600">오류: {(error as Error)?.message}</td></tr>
                    )}
                    {!isLoading && !isError && (data?.items ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-3 py-2">{r.id}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium line-clamp-1" title={r.title}>{r.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1" title={r.content}>{r.content}</div>
                        </td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end">
                            <button
                              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                              onClick={() => {
                                setDetailItem({ id: r.id, title: r.title, status: r.status, content: r.content });
                                setDetailOpen(true);
                              }}
                            >
                              보기
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && !isError && (data?.items ?? []).length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-500">문의가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs text-gray-500">
                  {total > 0
                    ? `${(page - 1) * (data?.pageSize ?? pageSize) + 1}–${Math.min(page * (data?.pageSize ?? pageSize), total)} / ${total}`
                    : '0 / 0'}
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >이전</button>
                  <span className="text-sm text-gray-600">{data?.page ?? page} / {totalPages}</span>
                  <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >다음</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

{detailOpen && detailItem && (
  <InquiryDetailModal
    open={detailOpen}
    onClose={() => setDetailOpen(false)}
    inquiry={detailItem}
  />
)}
    </div>
  );
}
