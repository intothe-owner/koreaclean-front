// components/app/customer/NoticeDetail.tsx
'use client';

import Link from 'next/link';
import { useMemo } from 'react';

export type Notice = {
  id: number;
  title: string;
  category: '긴급' | '중요' | '일반';
  date: string;   // YYYY-MM-DD
  views: number;
  hasFile?: boolean;
  content: string;
  files?: { name: string; url?: string; size?: number }[];
};

// ✅ 데모 데이터(목록과 동일 ID 사용). 실제에선 API로 교체하세요.
const DATA: Notice[] = [
  {
    id: 1012,
    title: '8월 시스템 점검 안내',
    category: '긴급',
    date: '2025-08-10',
    views: 213,
    content:
      '안정적인 서비스 제공을 위해 8월 정기 시스템 점검을 진행합니다.\n\n' +
      '- 점검일시: 2025-08-12(화) 01:00 ~ 04:00\n' +
      '- 영향: 점검 시간 중 간헐적 접속 지연\n\n불편을 드려 죄송합니다.',
  },
  {
    id: 1011,
    title: '경로당 클린 서비스 확대 지역 공지',
    category: '중요',
    date: '2025-08-07',
    views: 532,
    hasFile: true,
    content:
      '서비스 수요 증가에 따라 경로당 클린 서비스 제공 지역을 확대합니다.\n\n' +
      '- 추가 지역: 부산 해운대구, 기장군, 서울 송파구\n' +
      '- 적용일: 2025-08-15\n\n자세한 사항은 첨부파일을 참고하세요.',
    files: [
      { name: '서비스_확대_지역_안내.pdf', size: 482_000 },
      { name: '신청_절차_가이드.hwp', size: 132_000 },
    ],
  },
  {
    id: 1010,
    title: '여름철 위생관리 캠페인 참여 안내',
    category: '일반',
    date: '2025-08-05',
    views: 178,
    content:
      '무더위 속 시설 위생 강화를 위한 캠페인을 진행합니다.\n' +
      '참여 기관에는 소독용품 키트가 제공됩니다.\n\n' +
      '- 참여기간: 2025-08-10 ~ 2025-08-31\n' +
      '- 신청방법: 관리자 페이지 > 캠페인 > 참여신청',
  },
  {
    id: 1009,
    title: '플랫폼 약관 일부 개정 고지',
    category: '중요',
    date: '2025-08-01',
    views: 614,
    content:
      '서비스 운영 정책 정비를 위해 이용약관 일부가 개정됩니다.\n\n' +
      '- 시행일: 2025-08-20\n' +
      '- 주요 변경: 데이터 보관 기간 및 A/S SLA 조항 명확화\n\n' +
      '세부 변경 내용은 약관 전문을 참고해주세요.',
  },
];

const badgeClass = (c: Notice['category']) =>
  ({
    긴급: 'border-red-500 text-red-600',
    중요: 'border-amber-500 text-amber-600',
    일반: 'border-gray-400 text-gray-600',
  }[c]);

export function NoticeDetail({ id }: { id: number }) {
  const idx = useMemo(() => DATA.findIndex((n) => n.id === id), [id]);
  const item = idx >= 0 ? DATA[idx] : undefined;
  const prev = idx >= 0 && idx < DATA.length - 1 ? DATA[idx + 1] : undefined;
  const next = idx > 0 ? DATA[idx - 1] : undefined;

  if (!item) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/10">
        <h1 className="text-xl font-semibold">게시글을 찾을 수 없습니다.</h1>
        <p className="mt-2 text-sm text-gray-600">삭제되었거나 주소가 올바르지 않습니다.</p>
        <div className="mt-4">
          <Link
            href="/customer/notice"
            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-50"
          >
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
        {/* 상단 메타 */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badgeClass(item.category)}`}>
              {item.category}
            </span>
            <span className="text-xs text-gray-400">No. {item.id}</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">{item.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 10h5v5H7z" stroke="currentColor" strokeWidth="2"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/></svg>
              {item.date}
            </div>
            <span className="mx-1 text-gray-300">|</span>
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
              조회 {item.views.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <article className="prose prose-sm max-w-none text-gray-800">
          {item.content.split('\n').map((line, i) => (
            <p key={i}>{line.trim() === '' ? <>&nbsp;</> : line}</p>
          ))}
        </article>

        {/* 첨부 */}
        {(item.hasFile || item.files?.length) ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="mb-2 text-sm font-medium text-gray-700">첨부파일</div>
            <ul className="space-y-2">
              {(item.files?.length ? item.files : [{ name: '첨부파일.zip', size: 1024 * 120 }]).map((f, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <path d="M21 15V7a4 4 0 10-8 0v10a3 3 0 11-6 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="truncate">{f.name}</span>
                    {typeof f.size === 'number' && (
                      <span className="shrink-0 text-gray-400">({Math.round(f.size / 1024)} KB)</span>
                    )}
                  </div>
                  <a
                    href={f.url || '#'}
                    download
                    className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs hover:bg-gray-100"
                  >
                    다운로드
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 하단 액션 */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Link
              href="/customer/notice/list"
              className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-50"
            >
              목록
            </Link>
            <Link
              href={`/customer/notice/${item.id}/edit`}
              className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-50"
            >
              수정
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('정말 삭제하시겠습니까?')) {
                alert('데모: 삭제 API 연동 위치입니다.');
                window.location.href = '/customer/notice';
              }
            }}
            className="inline-flex h-10 items-center rounded-lg bg-gray-900 text-white px-4 text-sm hover:bg-black/90"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 이전/다음 */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white">
        <dl className="divide-y">
          <div className="flex items-center">
            <dt className="w-24 shrink-0 px-4 py-3 text-xs text-gray-500">이전글</dt>
            <dd className="min-w-0 px-4 py-3">
              {prev ? (
                <Link href={`/customer/notice/${prev.id}`} className="block truncate hover:underline">
                  [{prev.category}] {prev.title}
                </Link>
              ) : (
                <span className="text-gray-400">이전 글이 없습니다.</span>
              )}
            </dd>
          </div>
          <div className="flex items-center">
            <dt className="w-24 shrink-0 px-4 py-3 text-xs text-gray-500">다음글</dt>
            <dd className="min-w-0 px-4 py-3">
              {next ? (
                <Link href={`/customer/notice/${next.id}`} className="block truncate hover:underline">
                  [{next.category}] {next.title}
                </Link>
              ) : (
                <span className="text-gray-400">다음 글이 없습니다.</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
