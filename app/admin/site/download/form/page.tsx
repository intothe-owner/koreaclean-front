// app/admin/site/download/form/page.tsx
"use client";

import React, { useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useRouter } from "next/navigation";

import { baseUrl } from "@/lib/variable";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import FileUpload, { UploadedFile } from "@/components/ui/FileUpload";

// 🔁 프로젝트에서 쓰는 FileUpload 경로/타입에 맞게 수정


export default function DownloadFormPage() {
  return <DownloadFormAuthed />;
}

function DownloadFormAuthed() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }

    if (files.length === 0) {
      if (!confirm("첨부 파일 없이 등록하시겠습니까?")) return;
    }

    try {
      setSubmitting(true);

      // 🔁 백엔드 자료실 저장 API에 맞게 body 필드명 조정
      const res = await fetchWithAuth(`${baseUrl}/site/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          // 예: 파일 ID / URL 전달 방식은 서버 설계에 따라 변경
          files: files.map((f) => ({
            id: f.id,
            name: f.name,
            url: f.url,
            size: f.size,
            type: f.type,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "등록에 실패했습니다.");
      }

      alert("자료가 등록되었습니다.");
      router.push("/admin/site/download/list"); // 📌 목록 페이지 URL
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm("작성 중인 내용이 사라집니다. 목록으로 돌아가시겠습니까?")) {
      router.push("/admin/site/download/list");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-bold sm:text-xl">
              홈페이지 관리 &gt;&gt; 자료실 등록
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                목록으로
              </button>
              <button
                type="submit"
                form="download-form"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          {/* 폼 영역 */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            {errorMsg && (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <form id="download-form" onSubmit={handleSubmit} className="space-y-5">
              {/* 제목 */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="자료실 제목을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 설명 / 비고 */}
              <div>
                <label className="mb-1 block text-sm font-medium">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="자료에 대한 간단한 설명을 입력하세요."
                  rows={5}
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 파일 업로드 */}
              <div>
                <label className="mb-1 block text-sm font-medium">첨부 파일</label>
                <p className="mb-2 text-xs text-gray-500">
                  매뉴얼, 양식, 자료 등 업로드 (최대 10개, 20MB 이하 / PDF, 엑셀, 워드 등)
                </p>

                <FileUpload
                  uploadEndpoint={`${baseUrl}/upload/files`} // 🔁 실제 업로드 API로 변경
                  value={files}
                  onChange={setFiles}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,image/*"
                  maxFiles={10}
                  maxSizeMB={20}
                  multiple
                  label="파일 선택 또는 드래그 앤 드롭"
                />
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
