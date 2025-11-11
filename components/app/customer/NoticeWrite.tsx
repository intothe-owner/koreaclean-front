// app/customer/notice/write/page.tsx
'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

type NoticeCategory = '긴급' | '중요' | '일반';

export default function NoticeWrite() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<NoticeCategory>('일반');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleErr = useMemo(() => (title.trim().length === 0 ? '제목을 입력하세요.' : ''), [title]);
  const contentErr = useMemo(() => (content.trim().length === 0 ? '내용을 입력하세요.' : ''), [content]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  };

  const resetForm = () => {
    setCategory('일반');
    setTitle('');
    setContent('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // 🔌 API 연동 시 이 핸들러에서 FormData를 서버로 POST 하시면 됩니다.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titleErr || contentErr) return;

    try {
      setSubmitting(true);

      // --- 예시: FormData 구성 (엔드포인트는 상황에 맞게 교체) ---
      const fd = new FormData();
      fd.append('category', category);
      fd.append('title', title.trim());
      fd.append('content', content.trim());
      if (file) fd.append('file', file);

      // 서버 연동 예시 (주석 해제해서 사용)
      // const res = await fetch('/backend/notice/save', { method: 'POST', body: fd });
      // const json = await res.json();
      // if (!json?.is_success) throw new Error(json?.message || '등록에 실패했습니다.');

      // UI 전용 데모: 500ms 대기 후 성공 처리
      await new Promise((r) => setTimeout(r, 500));

      resetForm();
      // 등록 후 목록 페이지로 이동
      router.push('/customer/notice');
    } catch (err) {
      console.error(err);
      alert('등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
        <h1 className="text-xl font-semibold text-gray-900">공지사항 등록</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {/* 분류 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              className="w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="긴급">긴급</option>
              <option value="중요">중요</option>
              <option value="일반">일반</option>
            </select>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className={`w-full h-11 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                titleErr ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            {titleErr && <p className="mt-1 text-xs text-red-500">{titleErr}</p>}
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className={`w-full min-h-[200px] rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                contentErr ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            <div className="mt-1 text-xs text-gray-400">({content.trim().length}자)</div>
            {contentErr && <p className="mt-1 text-xs text-red-500">{contentErr}</p>}
          </div>

          {/* 파일첨부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                onChange={onFileChange}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:hover:bg-gray-50 file:cursor-pointer"
              />
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                >
                  제거
                </button>
              )}
            </div>
            {file && (
              <div className="mt-2 text-xs text-gray-500">
                선택된 파일: <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/customer/notice/list')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-50"
            >
              목록
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={submitting || !!titleErr || !!contentErr}
              className="h-10 rounded-lg bg-gray-900 text-white px-5 text-sm hover:bg-black/90 disabled:opacity-50"
            >
              {submitting ? '등록 중…' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
