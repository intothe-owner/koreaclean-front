// app/admin/site/download/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useRouter, useParams } from "next/navigation";
import { baseUrl } from "@/lib/variable";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

/* ----------------- 타입 (백엔드 스펙에 맞게 나중에 수정 가능) ----------------- */
type DownloadFile = {
  id?: number | string;
  name: string;
  name_original:string;
  url: string;
  size?: number;
  type?: string;
};

type DownloadItem = {
  id: number;
  title: string;
  description?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  files?: DownloadFile[];
};

/* ----------------- 공통 유틸 ----------------- */
function toDateTime(v?: string | Date | null) {
  if (!v) return "-";
  const d = typeof v === "string" ? new Date(v) : v!;
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

/* ----------------- 페이지 컴포넌트 ----------------- */
export default function DownloadDetailPage() {
  return <DownloadDetailAuthed />;
}

function DownloadDetailAuthed() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const [item, setItem] = useState<DownloadItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ----------------- 데이터 로드 ----------------- */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchWithAuth(`${baseUrl}/site/download/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "자료를 불러오지 못했습니다.");
        }
        const data = (await res.json()) as DownloadItem;
        if (!cancelled) setItem(data);
      } catch (err: any) {
        console.error(err);
        if (!cancelled) setErrorMsg(err.message ?? "자료를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ----------------- 액션 ----------------- */
  const goList = () => router.push("/admin/site/download/list");

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("정말 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) return;

    try {
      setDeleting(true);
      const res = await fetchWithAuth(`${baseUrl}/site/download/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "삭제에 실패했습니다.");
      }
      alert("삭제되었습니다.");
      router.push("/admin/site/download/list");
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 수정 기능을 나중에 만들면 여기 연결
  const handleEdit = () => {
    // 예시: /admin/site/download/form?id=123
    router.push(`/admin/site/download/form?id=${id}`);
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
              홈페이지 관리 &gt;&gt; 자료실 상세
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goList}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                목록
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-lg border border-blue-500 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>

          {/* 내용 영역 */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            {loading && (
              <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                자료를 불러오는 중입니다...
              </div>
            )}

            {errorMsg && !loading && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            {!loading && !errorMsg && !item && (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                자료를 찾을 수 없습니다.
              </div>
            )}

            {item && !loading && !errorMsg && (
              <div className="space-y-6">
                {/* 제목 + 메타 */}
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>등록일: {toDateTime(item.createdAt)}</span>
                    {item.updatedAt && (
                      <span className="text-gray-400">
                        (수정: {toDateTime(item.updatedAt)})
                      </span>
                    )}
                    <span>조회수: {item.views ?? 0}</span>
                  </div>
                </div>

                {/* 설명 */}
                {item.description && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">설명</h3>
                    <div className="whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {item.description}
                    </div>
                  </div>
                )}

                {/* 첨부 파일 */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">첨부 파일</h3>

                  {(!item.files || item.files.length === 0) && (
                    <p className="text-sm text-gray-500">등록된 첨부 파일이 없습니다.</p>
                  )}

                  {item.files && item.files.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-fixed text-sm">
                        <colgroup>
                          <col /> {/* 파일명 */}
                          <col className="w-28" /> {/* 용량 */}
                          <col className="w-28" /> {/* 타입 */}
                          <col className="w-24" /> {/* 버튼 */}
                        </colgroup>
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                              파일명
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              용량
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              형식
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              다운로드
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.files.map((f, idx) => (
                            <tr
                              key={f.id ?? idx}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-2 py-2 text-sm text-gray-800">
                                <span className="line-clamp-1">{f.name}</span>
                              </td>
                              <td className="px-2 py-2 text-center text-xs text-gray-500">
                                {formatBytes(f.size)}
                              </td>
                              <td className="px-2 py-2 text-center text-xs text-gray-500">
                                {f.type ?? "-"}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {f.url ? (
                                  <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-md border border-blue-500 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                                  >
                                    다운로드
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">URL 없음</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
