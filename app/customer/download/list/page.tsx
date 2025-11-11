// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useEffect, useMemo, useState } from 'react';

import HeroCard from '@/components/app/HeroCard';
import { NoticeBoard } from '@/components/app/customer/NoticeBoard';

// ====== 타입 & 샘플 데이터 ======
type DownloadFile = { name: string; type: 'HWP' | 'PDF'; url: string; sizeKB?: number };
type DownloadItem = { id: number; title: string; files: DownloadFile[]; count: number };

const DOWNLOADS: DownloadItem[] = [
  {
    id: 1,
    title: '견적서 양식',
    files: [
      { name: '견적서_양식.hwp', type: 'HWP', url: '/download/forms/estimate.hwp', sizeKB: 128 },
      { name: '견적서_양식.pdf', type: 'PDF', url: '/download/forms/estimate.pdf', sizeKB: 96 },
    ],
    count: 342,
  },
  {
    id: 2,
    title: '계약서 양식',
    files: [
      { name: '계약서_양식.hwp', type: 'HWP', url: '/download/forms/contract.hwp', sizeKB: 144 },
      { name: '계약서_양식.pdf', type: 'PDF', url: '/download/forms/contract.pdf', sizeKB: 112 },
    ],
    count: 281,
  },
];

// ====== 간단 모달 컴포넌트(이 파일 내부에서만 사용) ======
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-black/10">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold">{title || '파일 선택'}</h3>
          <button
            onClick={onClose}
            className="rounded-md border px-2.5 py-1 text-sm hover:bg-gray-50"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ====== 다운로드 목록 섹션(테이블 + 모바일 카드 + 모달) ======
function DownloadListSection() {
  const [items, setItems] = useState<DownloadItem[]>(DOWNLOADS);
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState<DownloadItem | null>(null);

  const openModal = (it: DownloadItem) => {
    setTarget(it);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setTarget(null);
  };

  const list = useMemo(
    () =>
      items.map((it) => ({
        ...it,
      })),
    [items]
  );

  const handleClickFile = (file: DownloadFile) => {
    // 실제 다운로드 트래킹 필요 시 여기서 API 호출/카운트 증가 처리
    // setItems((prev) => prev.map(it => it.id === target?.id ? {...it, count: it.count + 1} : it));
    // 데모: 그냥 링크 이동
    window.location.href = file.url;
    closeModal();
  };

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">자료실 다운로드</h2>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 px-3 w-20">번호</th>
              <th className="py-2 px-3">제목</th>
              <th className="py-2 px-3 w-28 text-right">다운로드수</th>
              <th className="py-2 px-3 w-32 text-center">다운로드</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="py-3 px-3 text-gray-500">{it.id}</td>
                <td className="py-3 px-3">{it.title}</td>
                <td className="py-3 px-3 text-right">{it.count.toLocaleString()}</td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => openModal(it)}
                    className="inline-flex h-9 items-center rounded-lg bg-gray-900 text-white px-3 text-sm hover:bg-black/90"
                  >
                    다운로드
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {list.map((it) => (
          <div key={it.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">No. {it.id}</div>
                <div className="mt-0.5 font-medium text-gray-900">{it.title}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>다운로드수 {it.count.toLocaleString()}</span>
              <button
                onClick={() => openModal(it)}
                className="inline-flex h-8 items-center rounded-lg bg-gray-900 text-white px-3 text-xs hover:bg-black/90"
              >
                다운로드
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 모달: 파일 선택 */}
      <Modal open={modalOpen} onClose={closeModal} title={target ? `${target.title} 파일 선택` : '파일 선택'}>
        {target ? (
          <ul className="space-y-2">
            {target.files.map((f, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                  <div className="text-xs text-gray-500">
                    형식: {f.type} {typeof f.sizeKB === 'number' ? `· ${f.sizeKB}KB` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleClickFile(f)}
                  className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs hover:bg-gray-100"
                >
                  받기
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">선택된 항목이 없습니다.</div>
        )}
      </Modal>
    </div>
  );
}

export default function NoticeList() {
  const items: TabItem[] = [
    { label: '공지사항', href: '/customer/notice/list' },
    { label: '자주 묻는 질문', href: '/customer/faq' },
    { label: '문의하기', href: '/customer/qna' },
    { label: '다운로드', href: '/customer/download/list' },
  ];
  const [tab, setTab] = useState<string>('reserve');

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      {/* 헤더 */}
      <Header />
      {/* 배경 스와이퍼 */}
      <CenterSwiper />
      {/* 히어로 카드 */}
      <HeroCard title="경로당 맞춤형 청소" content="예약부터 사후관리까지 한번에" />

      {/* 탭 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* 다운로드 목록 섹션 (여기 꽂기) */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-0 pb-12">
          <DownloadListSection />
        </div>
      </section>

      <Footer />
    </div>
  );
}
