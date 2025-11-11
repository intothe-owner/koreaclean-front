// components/app/InquiryDetailModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { baseUrl } from '@/lib/variable';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';

type AuthorRole = 'CLIENT' | 'COMPANY' | 'ADMIN';
type CommentRow = {
  id: number;
  inquiry_id: number;
  parent_id: number | null;
  author_user_id: number;
  author_role: AuthorRole;
  content: string;
  createdAt: string;
  author_name?: string | null;
};
type PostCommentVars = {
  content: string;
  companyId?: number;
};
type CommentListResp = {
  is_success: boolean;
  items: CommentRow[];
  page: number; pageSize: number; total: number; totalPages: number;
};

export default function InquiryDetailModal({
  open,
  onClose,
  inquiry,
  companyId,
}: {
  open: boolean;
  onClose: () => void;
  inquiry: { id: number; title: string; status: string; content: string };
  companyId?: number;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 50; // 댓글은 보통 넉넉히
  const [newContent, setNewContent] = useState('');

  useEffect(() => { if (open) { setPage(1); } else { setNewContent(''); } }, [open]);

  const { data, isLoading, isError, error, refetch } = useQuery<CommentListResp>({
    queryKey: ['inquiry-comments', inquiry?.id, page],
    enabled: open && !!inquiry?.id,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const url = `/backend/inquiry/${inquiry.id}/comments?page=${page}&pageSize=${pageSize}&company_id=${companyId}`;
      const res = await fetchWithAuth(url, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`);
      return res.json() as Promise<CommentListResp>;
    },
    staleTime: 5_000,
  });

  const postMutation = useMutation({
    mutationFn: async ({ content, companyId }: PostCommentVars) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetchWithAuth(`/backend/inquiry/${inquiry.id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content,companyId }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      setNewContent('');
      refetch();
    },
    onError: (e: any) => alert(e?.message || '등록 실패'),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="min-w-0">
              <div className="text-sm text-gray-500">문의 #{inquiry.id} · {inquiry.status}</div>
              <div className="truncate text-lg font-semibold" title={inquiry.title}>{inquiry.title}</div>
            </div>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50" onClick={onClose}>
              닫기
            </button>
          </div>

          {/* 본문 */}
          <div className="px-5 py-4">
            <div className="whitespace-pre-wrap text-sm text-gray-800 rounded-lg border bg-gray-50 p-3">
              {inquiry.content}
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="px-5 pb-4">
            <div className="mb-2 text-sm font-medium">댓글</div>
            <div className="max-h-[40vh] overflow-auto rounded-lg border">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500">로딩 중…</div>
              ) : isError ? (
                <div className="p-6 text-center text-rose-600">오류: {(error as Error)?.message}</div>
              ) : (data?.items ?? []).length === 0 ? (
                <div className="p-6 text-center text-gray-500">첫 댓글을 남겨보세요.</div>
              ) : (
                <ul className="divide-y">
                  {data!.items.map(c => (
                    <li key={c.id} className="p-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">{c.author_name || `#${c.author_user_id}`}</span>
                        <span>·</span>
                        <span>{c.author_role}</span>
                        <span>·</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{c.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 페이지네이션 (필요시) */}
            {data && data.totalPages > 1 && (
              <div className="mt-2 flex items-center justify-end gap-2 text-sm">
                <button
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >이전</button>
                <span className="text-gray-600">{page} / {data.totalPages}</span>
                <button
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 disabled:opacity-50"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                >다음</button>
              </div>
            )}
          </div>

          {/* 댓글 입력 */}
          <div className="border-t px-5 py-4">
            <div className="flex gap-2">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1 min-h-[72px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="댓글을 입력하세요"
              />
              <button
                disabled={postMutation.isPending || !newContent.trim()}
                onClick={() => postMutation.mutate({ content: newContent, companyId })}
                className="h-[72px] min-w-[96px] self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {postMutation.isPending ? '등록 중…' : '등록'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
