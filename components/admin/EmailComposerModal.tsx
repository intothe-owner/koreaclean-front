"use client";

import { useEffect, useMemo, useState } from "react";

export type EmailMode = "ALL" | "SELECTED";

export type EmailComposerProps = {
  open: boolean;
  mode: EmailMode;                      // 'ALL' | 'SELECTED'
  onClose: () => void;
  onSubmit: (payload: {
    mode: EmailMode;
    subject: string;
    body: string;
    // 아래 둘 중 하나만 전달 (서버 설계에 맞춰 사용)
    filter?: { q?: string; key?: "email" | "name" | "phone"; role?: string | "" };
    ids?: number[];
  }) => Promise<void> | void;
  // 선택 발송일 때: 선택된 회원 IDs
  selectedIds?: number[];
  // 전체 발송일 때: 현재 필터(서버에서 수신자 선정)
  filter?: { q?: string; key?: "email" | "name" | "phone"; role?: string | "" };

  // UI 표시용
  targetCount?: number;                 // 선택된 수(선택 발송) 또는 전체 건수
};

export default function EmailComposerModal({
  open,
  mode,
  onClose,
  onSubmit,
  selectedIds = [],
  filter,
  targetCount = 0,
}: EmailComposerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubject("");
      setBody("");
      setSending(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!subject.trim() || !body.trim()) return false;
    if (mode === "SELECTED" && selectedIds.length === 0) return false;
    return true;
  }, [subject, body, mode, selectedIds.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 ring-1 ring-gray-200 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">이메일 보내기</h2>
            <p className="mt-1 text-sm text-gray-500">
              대상:{" "}
              {mode === "ALL" ? (
                <>현재 필터 기준 전체 ({targetCount}명)</>
              ) : (
                <>선택된 회원 ({targetCount}명)</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* form */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">제목</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="이메일 제목을 입력하세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">본문</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="이메일 본문을 입력하세요"
              rows={10}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 text-right text-xs text-gray-400">
              {body.length.toLocaleString()} chars
            </div>
          </div>

          {/* (선택) 고급 옵션: 추후 CC/BCC/템플릿/프리뷰 영역 추가 가능 */}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            disabled={!canSubmit || sending}
            onClick={async () => {
              if (!canSubmit || sending) return;
              try {
                setSending(true);
                await onSubmit({
                  mode,
                  subject: subject.trim(),
                  body: body.trim(),
                  filter: mode === "ALL" ? filter : undefined,
                  ids: mode === "SELECTED" ? selectedIds : undefined,
                });
                onClose();
              } finally {
                setSending(false);
              }
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-40 hover:bg-blue-700"
          >
            {sending ? "전송 중..." : "전송"}
          </button>
        </div>
      </div>
    </div>
  );
}
