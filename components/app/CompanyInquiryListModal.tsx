import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import InquiryDetailModal from "./InquiryDetailModal";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
type InquiryRow = {
  id: number;
  title: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  content:string;
  requester_user_id?: number;
  company_id?: number | null;
  service_request_id?: number | null;
};
type InquiryListResp = {
  is_success: boolean;
  items: InquiryRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message?: string;
};
export function CompanyInquiryListModal({
  open,
  onClose,
  requesterUserId,       // <- optional
  serviceRequestId,
  companyId,
}: {
  open: boolean;
  onClose: () => void;
  requesterUserId?: number;          // ✅ optional
  serviceRequestId?: number | null;  // ✅ optional
  companyId?: number | null;         // ✅ optional
}) {
    // 모달 상태 추가
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<{ id: number; title: string; status: string; content: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  useEffect(() => {

    if (open) { setPage(1); }
  }, [open, requesterUserId, companyId]);

  // 쿼리 활성화 조건
  const enabled = open && serviceRequestId != null && companyId != null;

  const { data, isLoading, isError, error, refetch } = useQuery<InquiryListResp>({
    queryKey: ['inquiry-list', { serviceRequestId, companyId, page, pageSize }],
    enabled,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      // ✅ 올바른 파라미터 바인딩
      sp.set('service_request_id', String(serviceRequestId));
      sp.set('company_id', String(companyId));

      const url = `/backend/inquiry/list?${sp.toString()}`;
      const res = await fetchWithAuth(url, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 401) throw new Error('로그인이 필요합니다.');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as InquiryListResp;
      if (!json?.is_success) throw new Error(json?.message || '문의 목록 조회 실패');
      return json;
    },
    staleTime: 15_000,
    gcTime: 120_000,
    // 선택: 페이지 바꿀 때 UX 부드럽게
  });
  console.log('list',data)
  if (!open) return null;

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="font-semibold">1:1 문의 목록</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => refetch()}
              >
                새로고침
              </button>
              <button
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* 목록 테이블 */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">제목</th>
                      <th className="px-3 py-2 text-left">상태</th>
                      <th className="px-3 py-2 text-left">작성일</th>
                      <th className="px-3 py-2 text-right w-24">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-500">불러오는 중…</td></tr>
                    )}
                    {isError && (
                      <tr><td colSpan={4} className="py-8 text-center text-rose-600">
                        오류: {(error as Error)?.message || '조회 실패'}
                      </td></tr>
                    )}
                    {!isLoading && !isError && (data?.items ?? []).map((it) => (
                      <tr key={it.id} className="border-b last:border-b-0 border-gray-100 hover:bg-gray-50/50">
                        <td className="px-3 py-2">{it.id}</td>
                        <td className="px-3 py-2">{it.title}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            {it.status === 'OPEN' ? '열림'
                              : it.status === 'ANSWERED' ? '답변완료'
                              : '종료'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{new Date(it.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end">
                            <button
                              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                              onClick={() => {
                                setDetailItem({ id: it.id, title: it.title, status: it.status, content: it.content });
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
                      <tr><td colSpan={4} className="py-8 text-center text-gray-500">문의가 없습니다.</td></tr>
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
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value={10}>10개씩</option>
                    <option value={20}>20개씩</option>
                    <option value={50}>50개씩</option>
                  </select>
                  <button
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-600">{data?.page ?? page} / {totalPages}</span>
                  <button
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              서비스신청 ID: <b>{serviceRequestId ?? '-'}</b> / 업체 ID: <b>{companyId ?? '-'}</b>
            </div>
          </div>
        </div>
      </div>
      {detailOpen && detailItem && (
        <InquiryDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          inquiry={detailItem}
          companyId={companyId??0}
        />
      )}
    </div>
  );
}