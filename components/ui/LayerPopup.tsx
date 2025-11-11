// components/ui/LayerPopup.tsx
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  widthClass?: string; // ex) 'max-w-lg'
};

export default function LayerPopup({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-lg',
}: Props) {
  // ESC 닫기 + 바디 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose} // 배경 클릭 시 닫기
      />
      {/* 박스 */}
      <div
        className={[
          'relative z-[1001] w-[92%] rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200',
          widthClass,
        ].join(' ')}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
