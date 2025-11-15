// app/admin/service/page.tsx
"use client";

import React, { Suspense, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useSearchParams } from "next/navigation";
import { useNoticeForm } from "@/hooks/useNotice"; 

export default function NoticeFormPage() {
  return (
    <Suspense>
      <NoticeForm/>
    </Suspense>
  )
}

const NoticeForm = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
      const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const sp = useSearchParams();
  const id = sp.get("id");
  const {
    isEdit,
    isDetailLoading,
    isDetailError,
    detailError,
    form,
    set,
    files,
    onSubmit,
    onCancel,
    onFileChange,
    removeLocalFile,
    removeExistingAttachment,
    priorityOptions,
    isSaving,
  } = useNoticeForm(id);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          {/* 타이틀/액션 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                홈페이지 관리 &gt;&gt; 공지사항 {isEdit ? "수정" : "등록"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">중요도와 상단 고정 여부를 선택하고 본문을 작성하세요.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={onSubmit}
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          {/* 로딩/에러 표시 */}
          {isEdit && isDetailLoading && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">불러오는 중...</section>
          )}
          {isEdit && isDetailError && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-red-600">
              {(detailError as Error)?.message || "상세를 불러오지 못했습니다."}
            </section>
          )}

          {/* 폼 카드 */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold">{isEdit ? "공지 수정" : "공지 등록"}</h2>
            </div>

            <div className="px-5 py-5">
              {/* 상단: 제목 / 중요도 / 상단고정 */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">제목 *</label>
                  <input
                    value={form.title}
                    onChange={(e) => set({ title: e.target.value })}
                    placeholder="공지 제목을 입력하세요"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">중요도</label>
                    <select
                      value={form.priority}
                      onChange={(e) => set({ priority: e.target.value as any })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!form.is_pinned}
                        onChange={(e) => set({ is_pinned: e.target.checked })}
                      />
                      <span className="text-sm">상단 고정</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 본문 */}
              <div className="mt-5">
                <label className="mb-1 block text-sm font-medium">본문 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => set({ content: e.target.value })}
                  rows={12}
                  placeholder="공지 내용을 입력하세요"
                  className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 첨부파일 */}
              <div className="mt-5">
                <label className="mb-1 block text-sm font-medium">첨부파일</label>

                {/* 기존 첨부(수정) */}
                {isEdit && (form.attachments?.length ?? 0) > 0 && (
                  <div className="mb-3 rounded-lg border border-gray-200">
                    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">기존 첨부</div>
                    <ul className="divide-y divide-gray-200">
                      {form.attachments!.map((f, i) => (
                        <li key={`${f.id || f.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="truncate">
                            <a href={f.url} target="_blank" className="text-blue-700 hover:underline" rel="noreferrer">
                              {f.name}
                            </a>
                            {typeof f.size === "number" && (
                              <span className="ml-2 text-xs text-gray-500">({Math.round(f.size / 1024)}KB)</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(i)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            제거
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 신규 업로드 */}
                <div className="rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">새 파일 업로드</div>
                  <div className="p-3">
                    <input
                      type="file"
                      multiple
                      onChange={onFileChange}
                      className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1 file:text-sm hover:file:bg-gray-50"
                    />
                    {files.length > 0 && (
                      <ul className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-200">
                        {files.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                            <div className="truncate">
                              {f.name} <span className="text-xs text-gray-500">({Math.round(f.size / 1024)}KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLocalFile(i)}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                            >
                              제거
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 하단 액션 */}
          <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
            <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              취소
            </button>
            <button
              onClick={onSubmit}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}