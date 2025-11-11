'use client';

import { fetchWithAuth } from '@/lib/fetchWitgAuth';
import { useMemo, useState } from 'react';

export type ReviewFormValues = {
  title: string;
  content: string;
  rating: number;
  file?: File | null;
};

export type ReviewCreatedPayload = {
  id: number | string;
  title: string;
  content: string;
  rating: number;
  photoUrl?: string;
};

export default function ReviewForm({
  saveEndpoint,
  onCreated,
  maxSizeMB = 8,
}: {
  /** API 엔드포인트 (선택): multipart/form-data POST. 미지정 시 로컬 미리보기로 즉시 등록 처리 */
  saveEndpoint?: string;
  /** 등록 성공 시 상위에서 목록 갱신 */
  onCreated?: (d: ReviewCreatedPayload) => void;
  /** 첨부 용량 제한(기본 8MB) */
  maxSizeMB?: number;
}) {
  const [values, setValues] = useState<ReviewFormValues>({
    title: '',
    content: '',
    rating: 5,
    file: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!values.file) return '';
    return URL.createObjectURL(values.file);
  }, [values.file]);

  const handleChange = (patch: Partial<ReviewFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
  };

  const handleFile = (f?: File | null) => {
    if (!f) return handleChange({ file: undefined });
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`첨부 용량은 최대 ${maxSizeMB}MB 입니다.`);
      return;
    }
    setError(null);
    handleChange({ file: f });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!values.title.trim()) return setError('제목을 입력해주세요.');
    if (!values.content.trim()) return setError('내용을 입력해주세요.');
    if (values.rating < 1 || values.rating > 5) return setError('별점은 1~5 사이여야 합니다.');

    setSubmitting(true);
    try {
      if (saveEndpoint) {
        // ✅ 서버 저장 (multipart/form-data)
        const fd = new FormData();
        fd.append('title', values.title);
        fd.append('content', values.content);
        fd.append('rating', String(values.rating));
        if (values.file) fd.append('photo', values.file);

        const res = await fetchWithAuth(saveEndpoint, {
          method: 'POST',
          body: fd,
          credentials: 'include', // ✅ 쿠키/세션 필요 시
        });

        // 상태코드 기반 1차 체크
        if (!res.ok) {
          let msg = `서버 오류(${res.status})`;
          try {
            const t = await res.text();
            if (t) msg += `: ${t}`;
          } catch {}
          throw new Error(msg);
        }

        // 응답 파싱 (예상: { is_success:true, item:{ id, title, content, rating, photo_url } })
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          // JSON 아닐 때 대비
          data = {};
        }

        const item = data?.item ?? data; // 서버가 바로 item을 주거나 루트에 줄 수도 있음
        const payload: ReviewCreatedPayload = {
          id: item?.id ?? crypto.randomUUID(),
          title: item?.title ?? values.title,
          content: item?.content ?? values.content,
          rating: Number(item?.rating ?? values.rating),
          photoUrl: item?.photo_url ?? item?.photoUrl, // 어떤 키로 오든 수용
        };

        onCreated?.(payload);
      } else {
        // ✅ 백엔드 없이 로컬 등록
        onCreated?.({
          id: crypto.randomUUID(),
          title: values.title,
          content: values.content,
          rating: values.rating,
          photoUrl: values.file ? previewUrl : undefined,
        });
      }

      // 입력값 초기화
      setValues({ title: '', content: '', rating: 5, file: undefined });
    } catch (err: any) {
      setError(err?.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl bg-white p-5 shadow-sm border border-black/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">후기 등록</h3>
        <span className="text-xs text-gray-400">제목 / 내용 / 별점 / 사진첨부</span>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium mb-1">제목</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => handleChange({ title: e.target.value })}
          placeholder="예) 경로당 전체 대청소 후기"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 내용 */}
      <div>
        <label className="block text-sm font-medium mb-1">내용</label>
        <textarea
          value={values.content}
          onChange={(e) => handleChange({ content: e.target.value })}
          placeholder="서비스 이용 후기를 적어주세요."
          rows={5}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 별점 */}
      <div>
        <label className="block text-sm font-medium mb-1">별점</label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const idx = i + 1;
            const active = idx <= values.rating;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleChange({ rating: idx })}
                className="p-1"
                aria-label={`별점 ${idx}점`}
                title={`${idx}점`}
              >
                <svg
                  className={`w-6 h-6 ${active ? 'text-yellow-400' : 'text-gray-300'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              </button>
            );
          })}
          <span className="ml-2 text-sm text-gray-600">{values.rating} / 5</span>
        </div>
      </div>

      {/* 사진 첨부 */}
      <div>
        <label className="block text-sm font-medium mb-2">사진 첨부 (선택)</label>
        <div className="flex items-start gap-4">
          <label className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm cursor-pointer hover:bg-gray-50">
            파일 선택
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </label>
          {values.file && (
            <div className="flex items-center gap-3">
              <img
                src={previewUrl}
                alt="미리보기"
                className="w-24 h-24 rounded-md object-cover border border-gray-200"
              />
              <div className="text-xs text-gray-600">
                {values.file.name} • {(values.file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">최대 {maxSizeMB}MB, JPG/PNG 권장</p>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '등록하기'}
        </button>
      </div>
    </form>
  );
}
