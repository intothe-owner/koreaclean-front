// app/admin/service/page.tsx
"use client";

import React, { Suspense, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useSearchParams } from "next/navigation";
import { useEduNoticeForm } from "@/hooks/useEduNotice";  // ✅ 교육공지 훅
import FileUpload, { UploadedFile } from "@/components/ui/FileUpload";
import { baseUrl } from "@/lib/variable";

export default function EduNoticeFormPage() {
  return (
    <Suspense fallback={<div className="p-4">불러오는 중...</div>}>
      <EduNoticeForm />
    </Suspense>
  );
}

const EduNoticeForm = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const sp = useSearchParams();
  const id = sp.get("id");
  const uploadEndpoint = `${baseUrl}/upload/edu-upload`;
  const {
    isEdit,
    isDetailLoading,
    isDetailError,
    detailError,
    form,
    set, // set({ ...partial })
    files, // 로컬 업로드 파일(UploadedFile[])
    onSubmit,
    onCancel,
    onFileChange,
    removeLocalFile,
    removeExistingAttachment,
    isSaving,
  } = useEduNoticeForm(id);

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
                홈페이지 관리 &gt;&gt; 교육공지 {isEdit ? "수정" : "등록"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                교육일정과 수업 시간을 입력하고 교육 공지 내용을 작성하세요.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
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
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              불러오는 중...
            </section>
          )}
          {isEdit && isDetailError && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-red-600">
              {(detailError as Error)?.message || "상세를 불러오지 못했습니다."}
            </section>
          )}

          {/* 폼 카드 */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold">
                {isEdit ? "교육 공지 수정" : "교육 공지 등록"}
              </h2>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* 제목 */}
              <div>
                <label className="mb-1 block text-sm font-medium">제목 *</label>
                <input
                  value={form.title ?? ""}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="교육 공지 제목을 입력하세요"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 교육 시작/종료일 */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    교육 시작일 *
                  </label>
                  <input
                    type="date"
                    value={form.edu_start_date ?? ""}
                    onChange={(e) => set({ edu_start_date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    교육 종료일 *
                  </label>
                  <input
                    type="date"
                    value={form.edu_end_date ?? ""}
                    onChange={(e) => set({ edu_end_date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 수업 시작/종료 시간 */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    수업 시작 시간 *
                  </label>
                  <input
                    type="time"
                    value={form.class_start_time ?? ""}
                    onChange={(e) => set({ class_start_time: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    수업 종료 시간 *
                  </label>
                  <input
                    type="time"
                    value={form.class_end_time ?? ""}
                    onChange={(e) => set({ class_end_time: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 본문 */}
              <div>
                <label className="mb-1 block text-sm font-medium">내용 *</label>
                <textarea
                  value={form.content ?? ""}
                  onChange={(e) => set({ content: e.target.value })}
                  rows={10}
                  placeholder="교육 공지 내용을 입력하세요"
                  className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 첨부파일 */}
              <div>
                <label className="mb-1 block text-sm font-medium">첨부파일</label>

                {/* 기존 첨부(수정 모드) */}
                {isEdit && Array.isArray(form.attachments) && form.attachments.length > 0 && (
                  <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-500">
                      기존 첨부파일
                    </p>
                    <ul className="space-y-1 text-sm">
                      {(form.attachments as any[]).map((f, idx) => (
                        <li
                          key={f.id ?? f.url ?? idx}
                          className="flex items-center justify-between gap-2"
                        >
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-blue-600 hover:underline"
                          >
                            {f.name ?? f.url}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(f)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 새로 업로드할 파일 */}
                <FileUpload
                  label="첨부 파일 업로드"
                  value={files as UploadedFile[]}
                  uploadEndpoint={uploadEndpoint}
                  onChange={onFileChange}
                  accept="image/*,.pdf,.xlsx,.xls,.doc,.docx"
                  maxSizeMB={50}
                  maxFiles={10}
                  multiple
                />

                {/* 로컬 파일 목록 (선택된 파일 보여주기용) */}
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {files.map((file:any) => (
                      <li
                        key={file.id ?? file.name}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeLocalFile(file)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          제거
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* 하단 액션 */}
          <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
            <button
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
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
};
