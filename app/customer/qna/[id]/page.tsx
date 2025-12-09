// app/customer/qna/[id]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import CenterSwiper from '@/components/app/CenterSwiper';
import HeroCard from '@/components/app/HeroCard';

import MainBannerSwiper from '@/components/app/MainBannerSwiper';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';

type QnaStatus = 'NEW' | 'ANSWERED' | 'REOPENED' | 'CLOSED';
type QnaCategory = '서비스 신청' | '변경' | '취소' | '불만사항' | '제안';

type UploadedFile = {
  id?: string | number | null;
  url: string;
  name: string;
  size?: number | null;
  type?: string | null;
};

type QnaDetail = {
  id: number;
  title: string;
  category: QnaCategory;
  status: QnaStatus;
  merged_content: string;          // 서버에서 mergedContent로 저장했던 본문
  files: UploadedFile[];    // JSON 컬럼
  comment_count: number;
  createdAt: string;
  last_commented_at?: string | null;
};

type QnaComment = {
  id: number;
  post_id: number;
  body: string;
  author_role: 'CLIENT' | 'ADMIN' | 'STAFF' | null;
  author_user_id?: number | null;
  createdAt: string;
};

function StatusBadge({ value }: { value: QnaStatus }) {
  const map: Record<QnaStatus, string> = {
    NEW: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    ANSWERED: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    REOPENED: 'bg-orange-100 text-orange-800 ring-orange-600/20',
    CLOSED: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${map[value]}`}>
      {value}
    </span>
  );
}

function RoleBadge({ role }: { role: QnaComment['author_role'] }) {
  if (!role) return null;
  const map = {
    ADMIN: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
    STAFF: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    CLIENT: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] ring-1 ${map[role]}`}>
      {role === 'CLIENT' ? '고객' : role === 'ADMIN' ? '관리자' : '담당자'}
    </span>
  );
}

function fmtDate(v?: string | null) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

export default function QnaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();



  const [item, setItem] = useState<QnaDetail | null>(null);
  const [comments, setComments] = useState<QnaComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [acting, setActing] = useState(false); // close/reopen 액션 로딩

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const res = await fetchWithAuth(`/backend/qna/detail/${params.id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `load failed (${res.status})`);
      }
      const json = await res.json();
      console.log(json);
      setItem(json?.item ?? null);
      setComments(Array.isArray(json?.comments) ? json.comments : []);
    } catch (e: any) {
      setErr(e?.message || '상세 조회 실패');
    } finally {
      setLoading(false);
    }
  }



  async function submitComment() {
    if (!newComment.trim()) return;
    try {
      setPosting(true);
      const res = await fetchWithAuth('/backend/qna/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        credentials: 'include',
        body: JSON.stringify({
          post_id: Number(params.id),
          body: newComment.trim(),
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `comment failed (${res.status})`);
      }
      const json = await res.json();
      if (!json?.is_success) throw new Error(json?.message || '댓글 등록 실패');
      setNewComment('');
      await load(); // 댓글/상태/카운트 갱신
    } catch (e: any) {
      alert(e?.message || '댓글 등록 실패');
    } finally {
      setPosting(false);
    }
  }

  async function doClose() {
    if (!item) return;
    if (!confirm('이 문의를 종결하시겠습니까?')) return;
    try {
      setActing(true);
      const res = await fetchWithAuth('/backend/qna/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         
        },
        credentials: 'include',
        body: JSON.stringify({ post_id: item.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (!json?.is_success) throw new Error(json?.message || '종결 실패');
      await load();
    } catch (e: any) {
      alert(e?.message || '종결 실패');
    } finally {
      setActing(false);
    }
  }

  async function doReopen() {
    if (!item) return;
    try {
      setActing(true);
      const res = await fetchWithAuth('/backend/qna/reopen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        credentials: 'include',
        body: JSON.stringify({ post_id: item.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (!json?.is_success) throw new Error(json?.message || '재오픈 실패');
      await load();
    } catch (e: any) {
      alert(e?.message || '재오픈 실패');
    } finally {
      setActing(false);
    }
  }
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function deleteComment(id: number) {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      setDeletingId(id);
      const res = await fetchWithAuth(`/backend/qna/comment/${id}`, {
        method: "DELETE",
        
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (!json?.is_success) throw new Error(json?.message || "삭제 실패");
      await load(); // 댓글/카운트/최근활동 갱신
    } catch (e: any) {
      alert(e?.message || "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }
 
  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />
      <MainBannerSwiper
                          src="/backend/banners/main-banners"
                          height={560}
                          rounded="rounded-3xl"
                          autoplayDelayMs={5000}
                          loop
                          showDots
                          showNav
                        />

      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
              {/* 상단 바 */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {item && <StatusBadge value={item.status} />}
                    {item && (
                      <span className="inline-block text-xs text-gray-500">
                        분류: {item.category}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-lg md:text-xl font-semibold text-gray-900 line-clamp-2">
                    {item ? item.title : loading ? '불러오는 중…' : '상세'}
                  </h1>
                  <div className="mt-1 text-xs text-gray-500">
                    등록 {fmtDate(item?.createdAt)} · 최근활동 {fmtDate(item?.last_commented_at)}
                  </div>
                </div>

                {/* 액션: 데스크탑 */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/customer/qna"
                    className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                  >
                    목록
                  </Link>
                  {item?.status !== 'CLOSED' ? (
                    <button
                      onClick={doClose}
                      disabled={acting}
                      className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {acting ? '처리 중…' : '종결'}
                    </button>
                  ) : (
                    <button
                      onClick={doReopen}
                      disabled={acting}
                      className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {acting ? '처리 중…' : '재오픈'}
                    </button>
                  )}
                </div>
              </div>

              {/* 액션: 모바일 큰 버튼 */}
              <div className="md:hidden grid grid-cols-2 gap-2 mt-3">
                <Link
                  href="/customer/qna"
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium flex items-center justify-center active:scale-[0.99]"
                >
                  목록
                </Link>
                {item?.status !== 'CLOSED' ? (
                  <button
                    onClick={doClose}
                    disabled={acting}
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium flex items-center justify-center hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50"
                  >
                    {acting ? '처리 중…' : '종결'}
                  </button>
                ) : (
                  <button
                    onClick={doReopen}
                    disabled={acting}
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium flex items-center justify-center hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50"
                  >
                    {acting ? '처리 중…' : '재오픈'}
                  </button>
                )}
              </div>

              {/* 본문 */}
              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                {err ? (
                  <div className="text-sm text-rose-600">{err}</div>
                ) : loading ? (
                  <div className="text-sm text-neutral-500">불러오는 중…</div>
                ) : item ? (
                  <pre className="whitespace-pre-wrap text-[15px] leading-6 text-neutral-800">
                    {item.merged_content}
                  </pre>
                ) : (
                  <div className="text-sm text-neutral-500">데이터가 없습니다.</div>
                )}
              </div>

              {/* 첨부파일 */}
              {item?.files && item.files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">첨부파일</h3>
                  <ul className="mt-2 space-y-2">
                    {item.files.map((f, i) => (
                      <li key={`${f.id ?? i}-${f.url}`} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{f.name}</p>
                          <p className="text-xs text-gray-500">
                            {f.type || 'file'}{typeof f.size === 'number' ? ` · ${(f.size / 1024).toFixed(0)} KB` : ''}
                          </p>
                        </div>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                        >
                          다운로드
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 댓글 */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900">댓글 ({comments.length})</h3>

                {/* 모바일 카드형 / 데스크탑 타임라인 공용 */}
                <ul className="mt-3 space-y-3">
                  {comments.length === 0 ? (
                    <li className="text-sm text-neutral-500">등록된 댓글이 없습니다.</li>
                  ) : (
                    comments.map((c) => (
                      <li key={c.id} className="rounded-xl border border-neutral-200 bg-gray-50 p-3 hover:bg-gray-100">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <RoleBadge role={c.author_role} />
                            <span className="text-xs text-gray-500">{fmtDate(c.createdAt)}</span>
                          </div>
                          {/* {Number(c.author_user_id) === Number(user?.id) && (
                            <button
                              onClick={() => deleteComment(c.id)}
                              disabled={deletingId === c.id}
                              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2 text-xs hover:bg-gray-50 disabled:opacity-50"
                            >
                              {deletingId === c.id ? "삭제 중…" : "삭제"}
                            </button>
                          )} */}
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-neutral-800">{c.body}</pre>
                      </li>
                    ))
                  )}
                </ul>

                {/* 댓글 입력 폼 */}
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">댓글 쓰기</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2"
                    placeholder="답변 또는 추가 문의를 입력하세요."
                  />
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={submitComment}
                      disabled={!newComment.trim() || posting}
                      className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm text-white hover:bg-black/90 disabled:opacity-50"
                    >
                      {posting ? '등록 중…' : '댓글 등록'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 하단 네비 */}
              <div className="mt-6 flex items-center justify-between">
                <Link
                  href="/customer/qna/list"
                  className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                >
                  목록으로
                </Link>
                <span className="text-xs text-gray-400">QNA #{item?.id ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
