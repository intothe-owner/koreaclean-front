// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/app/Footer";
import Header from "@/components/app/Header";
import { baseUrl } from "@/lib/variable";

type EduNoticeItem = {
  id: number;
  title: string;
  content: string;
  edu_start_date: string;
  edu_end_date: string;
  class_start_time: string;
  class_end_time: string;
  attachments?: Array<{
    id?: number | string;
    name?: string;
    url?: string;
    size?: number;
    [key: string]: any;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

// 날짜만 YYYY-MM-DD
function toDateOnly(v?: string | null) {
  if (!v) return "";
  return v.slice(0, 10);
}

// HH:MM
function toTimeHM(v?: string | null) {
  if (!v) return "";
  return v.slice(0, 5);
}

function toDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function EducationPage() {
  const [list, setList] = useState<EduNoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<EduNoticeItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ===== 목록 로딩 =====
  useEffect(() => {
    const fetchList = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const qs = new URLSearchParams({
          page: "1",
          page_size: "20",
          order_by: "edu_start_date",
          order_dir: "DESC",
        });

        const res = await fetch(`${baseUrl}/edu/admin/edu-notice?` + qs.toString(), {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "교육 공지 목록을 불러오지 못했습니다.");
        }
        const json = await res.json();
        setList(json.items ?? json.rows ?? []);
      } catch (e: any) {
        console.error(e);
        setLoadError(e?.message ?? "목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, []);

  // ===== 상세 로딩 =====
  const openDetail = async (id: number) => {
    try {
      setModalOpen(true);
      setIsDetailLoading(true);
      setDetailError(null);
      setSelected(null);

      const res = await fetch(`${baseUrl}/edu/admin/edu-notice/${id}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "교육 공지 상세를 불러오지 못했습니다.");
      }
      const json = await res.json();
      const item: EduNoticeItem = json.item ?? json;

      setSelected(item);
    } catch (e: any) {
      console.error(e);
      setDetailError(e?.message ?? "상세를 불러오지 못했습니다.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setDetailError(null);
  };

  const hasList = list && list.length > 0;

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">교육 공지사항</h1>
            <p className="mt-1 text-neutral-600">
              한국클린쿱 교육 일정 및 안내를 확인하실 수 있습니다.
            </p>
          </div>

          {/* ====== 데스크톱 레이아웃 ====== */}
          <section className="hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                전체 {list.length}건
              </span>
            </div>

            {isLoading && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                불러오는 중입니다...
              </div>
            )}

            {loadError && !isLoading && (
              <div className="px-6 py-10 text-center text-sm text-red-500">
                {loadError}
              </div>
            )}

            {!isLoading && !loadError && !hasList && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                등록된 교육 공지사항이 없습니다.
              </div>
            )}

            {!isLoading && !loadError && hasList && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="w-20 px-6 py-3">번호</th>
                      <th className="px-6 py-3">제목</th>
                      <th className="w-40 px-6 py-3">교육기간</th>
                      <th className="w-32 px-6 py-3">수업시간</th>
                      <th className="w-40 px-6 py-3">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {list.map((n, idx) => {
                      const rowNo = list.length - idx;
                      const eduStart = toDateOnly(n.edu_start_date);
                      const eduEnd = toDateOnly(n.edu_end_date);
                      const classStart = toTimeHM(n.class_start_time);
                      const classEnd = toTimeHM(n.class_end_time);

                      return (
                        <tr
                          key={n.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openDetail(n.id)}
                        >
                          <td className="px-6 py-3 text-center text-gray-500">
                            {rowNo}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 line-clamp-1">
                                {n.title}
                              </span>
                              <span className="mt-1 line-clamp-1 text-xs text-gray-500">
                                {n.content}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-800">
                            {eduStart && eduEnd
                              ? `${eduStart} ~ ${eduEnd}`
                              : "-"}
                          </td>
                          <td className="px-6 py-3 text-gray-800">
                            {classStart && classEnd
                              ? `${classStart} ~ ${classEnd}`
                              : "-"}
                          </td>
                          <td className="px-6 py-3 text-gray-600">
                            {toDateTime(n.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ====== 모바일 레이아웃 ====== */}
          <section className="md:hidden">
            {isLoading && (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                불러오는 중입니다...
              </div>
            )}

            {loadError && !isLoading && (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-red-500">
                {loadError}
              </div>
            )}

            {!isLoading && !loadError && !hasList && (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                등록된 교육 공지사항이 없습니다.
              </div>
            )}

            {!isLoading && !loadError && hasList && (
              <div className="space-y-3">
                {list.map((n) => {
                  const eduStart = toDateOnly(n.edu_start_date);
                  const eduEnd = toDateOnly(n.edu_end_date);
                  const classStart = toTimeHM(n.class_start_time);
                  const classEnd = toTimeHM(n.class_end_time);

                  return (
                    <button
                      key={n.id}
                      onClick={() => openDetail(n.id)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {n.title}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-2">
                          {n.content}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                            교육기간:{" "}
                            {eduStart && eduEnd
                              ? `${eduStart} ~ ${eduEnd}`
                              : "-"}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                            수업시간:{" "}
                            {classStart && classEnd
                              ? `${classStart} ~ ${classEnd}`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ====== 상세 모달 ====== */}
          {modalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    교육 공지 상세
                  </h2>
                  <button
                    onClick={closeModal}
                    className="rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {/* 내용 */}
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  {isDetailLoading && (
                    <div className="py-8 text-center text-sm text-gray-500">
                      불러오는 중입니다...
                    </div>
                  )}

                  {detailError && !isDetailLoading && (
                    <div className="py-8 text-center text-sm text-red-500">
                      {detailError}
                    </div>
                  )}

                  {selected && !isDetailLoading && !detailError && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selected.title}
                      </h3>

                      {/* 메타 정보 */}
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex gap-2">
                          <span className="w-20 shrink-0 text-gray-500">
                            교육기간
                          </span>
                          <span>
                            {toDateOnly(selected.edu_start_date)} ~{" "}
                            {toDateOnly(selected.edu_end_date)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-20 shrink-0 text-gray-500">
                            수업시간
                          </span>
                          <span>
                            {toTimeHM(selected.class_start_time)} ~{" "}
                            {toTimeHM(selected.class_end_time)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-20 shrink-0 text-gray-500">
                            등록일
                          </span>
                          <span>{toDateTime(selected.createdAt)}</span>
                        </div>
                      </div>

                      {/* 첨부파일 */}
                      {selected.attachments &&
                        selected.attachments.length > 0 && (
                          <div className="mt-4 rounded-md bg-gray-50 p-3">
                            <div className="mb-2 text-sm font-semibold text-gray-800">
                              첨부파일
                            </div>
                            <ul className="space-y-1 text-sm">
                              {selected.attachments.map((f, idx) => (
                                <li
                                  key={f.id ?? f.url ?? idx}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="truncate text-blue-700 hover:underline"
                                  >
                                    {f.name ?? f.url}
                                  </a>
                                  {typeof f.size === "number" && (
                                    <span className="whitespace-nowrap text-xs text-gray-500">
                                      {Math.round(f.size / 1024)}KB
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* 내용 */}
                      <div className="mt-5 border-t border-gray-200 pt-4">
                        <div className="mb-2 text-sm font-semibold text-gray-800">
                          내용
                        </div>
                        <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-800">
                          {selected.content || "(내용 없음)"}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 하단 버튼 */}
                <div className="flex justify-end border-t border-gray-200 px-5 py-3">
                  <button
                    onClick={closeModal}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
