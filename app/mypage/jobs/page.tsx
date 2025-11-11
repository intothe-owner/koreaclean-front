// app/page.tsx
'use client';

import CompanyServiceDetail from "@/components/app/CompanyServiceDetail";
import Footer from "@/components/app/Footer";
import Header from "@/components/app/Header";

import { useServiceRequests, useUpdateAssignmentStatus } from "@/hooks/useServiceRequests";
import { baseUrl, RequestForm } from "@/lib/variable";
import { useEffect, useMemo, useState } from "react";
import ChatModal from "@/components/app/ChatModal";
import ChatIconButton from "@/components/app/ChatIconButton";

// ====== [이 파일 안에서만 쓰는 소켓 싱글톤 + 뱃지 스토어] ======
import { create } from "zustand";
import { getSocket } from "@/lib/socket";
import { useSession } from 'next-auth/react';
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

// 서비스요청ID -> 미읽음수 저장
type BadgeState = {
  counts: Record<number, number>; // service_request_id -> unread_count
  upsert: (items: Array<{ id: number; unread_count?: number }>) => void; // ✅ 항상 서버 값으로 덮어쓰기
  setCount: (reqId: number, n: number) => void;
  bump: (reqId: number, d?: number) => void;
  get: (reqId?: number | null) => number;
  clear: () => void;
};
const useBadgeStore = create<BadgeState>((set, get) => ({
  counts: {},
  upsert: (items) =>
    set((s) => {
      const next = { ...s.counts };
      for (const it of items) {
        const id = Number(it.id);
        // 🔧 덮어쓰기(merge 아님)
        next[id] = Math.max(0, Number(it.unread_count ?? 0));
      }
      return { counts: next };
    }),
  setCount: (reqId, n) =>
    set((s) => ({ counts: { ...s.counts, [reqId]: Math.max(0, Number(n) || 0) } })),
  bump: (reqId, d = 1) =>
    set((s) => {
      const curr = s.counts[reqId] ?? 0;
      return { counts: { ...s.counts, [reqId]: Math.max(0, curr + d) } };
    }),
  get: (reqId) => (reqId ? get().counts[reqId] ?? 0 : 0),
  clear: () => set({ counts: {} }),
}));

/** 요청ID 하나의 카운트만 구독하는 훅 (리렌더 보장) */
function useBadgeCount(reqId?: number | null) {
  return useBadgeStore((s) => (reqId ? (s.counts[reqId] ?? 0) : 0));
}

/** YYYY-MM-DD 로 표기 */
function toDateOnly(v?: string | Date | null) {
  if (!v) return "-";
  if (typeof v === "string") {
    if (v.length >= 10) return v.slice(0, 10);
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
  }
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return "-";
}

function StatusBadge({ value }: { value?: string }) {
  const v = (value || "WAIT").toUpperCase();
  const map: Record<string, string> = {
    WAIT: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-200 text-gray-700",
  };
  const label: Record<string, string> = {
    WAIT: "대기",
    IN_PROGRESS: "진행중",
    DONE: "완료",
    CANCELLED: "취소",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[v] || "bg-gray-100 text-gray-700"}`}>
      {label[v] || v}
    </span>
  );
}

function AssignmentBadge({ value }: { value?: string }) {
  const v = (value || "PENDING").toUpperCase();
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    DECLINED: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  const label: Record<string, string> = {
    PENDING: "대기",
    ACCEPTED: "승인",
    IN_PROGRESS: "진행",
    DECLINED: "거절",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map[v] || "bg-gray-50 text-gray-700 ring-gray-200"}`}>
      {label[v] || v}
    </span>
  );
}

function pickLatestAssignment(r: any) {
  if (!r) return null;
  if (Array.isArray(r.latest_assignment)) return r.latest_assignment[0] ?? null;
  if (r.latest_assignment && typeof r.latest_assignment === "object") return r.latest_assignment;
  if (Array.isArray(r.assignment)) return r.assignment[0] ?? null;
  if (r.assignment && typeof r.assignment === "object") return r.assignment;
  if (Array.isArray(r.assignments)) return r.assignments[0] ?? null;
  if (r.assignments && typeof r.assignments === "object") return r.assignments;
  return null;
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <div className="mb-2 text-sm text-gray-500">검색 조건에 해당하는 신청이 없습니다.</div>
      <div className="text-xs text-gray-400">검색어를 변경하거나 초기화해 보세요.</div>
    </div>
  );
}

/** 모바일 카드 */
function RequestRowCard({
  r,
  onDetail,
  onOpenChat,
}: {
  r: RequestForm;
  onDetail: (id: number) => void;
  onOpenChat: (row: any) => void;
}) {
  const created = toDateOnly((r as any).created_at || (r as any).createdAt);
  const hope = toDateOnly(r.hope_date as any);
  const assignment = pickLatestAssignment(r as any);
  const updateAssign = useUpdateAssignmentStatus();
  const badge = useBadgeCount(Number(r.id)); // ✅ 구독

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-gray-900">{r.org_name}</div>
          <div className="mt-0.5 text-xs text-gray-500">ID: {r.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={r.status} />
          <ChatIconButton
            count={badge}
            onClick={() => onOpenChat(r)}
            label="채팅"
          />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        <div className="col-span-2">
          <dt className="text-gray-500">담당자</dt>
          <dd className="text-gray-900">
            <div className="font-medium">{r.contact_name || "-"}</div>
            <div className="mt-0.5 break-all text-xs text-gray-500">{r.contact_email || "-"}</div>
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">사무실</dt>
          <dd className="text-gray-800">{r.contact_tel || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">담당자 연락처</dt>
          <dd className="text-gray-800">{r.contact_phone || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">희망일</dt>
          <dd className="text-gray-800">{hope}</dd>
        </div>
        <div>
          <dt className="text-gray-500">신청일</dt>
          <dd className="text-gray-800">{created}</dd>
        </div>

        <div className="col-span-2">
          <dt className="text-gray-500">배정 상태</dt>
          <dd className="mt-1">
            {!assignment ? (
              <span className="text-xs text-gray-400">배정 없음</span>
            ) : assignment.status === "PENDING" ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => updateAssign.mutate({ id: assignment.id, status: "ACCEPTED" })}
                  className="h-9 rounded-lg border border-emerald-300 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50 active:opacity-90"
                  disabled={updateAssign.isPending}
                >
                  승인
                </button>
                <button
                  onClick={() => {
                    const memo = window.prompt("거절 사유를 입력하세요.");
                    if (!memo || !memo.trim()) return;
                    updateAssign.mutate({ id: assignment.id, status: "DECLINED", cancel_memo: memo.trim() });
                  }}
                  className="h-9 rounded-lg border border-rose-300 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50 active:opacity-90"
                  disabled={updateAssign.isPending}
                >
                  거절
                </button>
              </div>
            ) : (
              <AssignmentBadge value={assignment.status} />
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => onDetail(r.id ?? 0)}
          className="h-9 rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-800 hover:bg-gray-50 active:opacity-90"
        >
          상세
        </button>
        <ChatIconButton
          count={badge}
          onClick={() => onOpenChat(r)}
          className="h-9 min-w-9"
          label="채팅"
        />
      </div>
    </div>
  );
}

/** 데스크탑 테이블 행 (뱃지 구독 포함) */
function DesktopRequestRow({
  r,
  onDetail,
  onOpenChat,
  updateAssign,
}: {
  r: any;
  onDetail: (id: number) => void;
  onOpenChat: (row: any) => void;
  updateAssign: ReturnType<typeof useUpdateAssignmentStatus>;
}) {
  const created = toDateOnly(r.created_at || r.createdAt);
  const hope = toDateOnly(r.hope_date as any);
  const assignment = pickLatestAssignment(r);
  const badgeCount = useBadgeCount(Number(r.id)); // ✅ 구독

  return (
    <tr className="hover:bg-gray-50/60">
      <td className="px-4 py-3 text-sm text-gray-500">{r.id}</td>
      <td className="truncate px-4 py-3">
        <div className="flex items-center gap-2 font-medium">
          {r.org_name}
          <ChatIconButton
            count={badgeCount}
            onClick={() => onOpenChat(r)}
            label="채팅"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="font-medium">{r.contact_name}</div>
        <div className="text-xs text-gray-500">{r.contact_email}</div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="text-xs text-gray-500">
          {r.contact_tel || "-"}<br />{r.contact_phone || "-"}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{hope}</td>
      <td className="px-4 py-3 text-sm"><StatusBadge value={r.status} /></td>
      <td className="px-4 py-3 text-sm text-gray-600">{created}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {!assignment ? (
            <span className="text-xs text-gray-400">배정 없음</span>
          ) : assignment.status === "PENDING" ? (
            <>
              <button
                onClick={() => updateAssign.mutate({ id: assignment.id, status: "ACCEPTED" })}
                className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                disabled={updateAssign.isPending}
              >
                승인
              </button>
              <button
                onClick={() => {
                  const memo = window.prompt("거절 사유를 입력하세요.");
                  if (!memo || !memo.trim()) return;
                  updateAssign.mutate({ id: assignment.id, status: "DECLINED", cancel_memo: memo.trim() });
                }}
                className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                disabled={updateAssign.isPending}
              >
                거절
              </button>
            </>
          ) : (
            <AssignmentBadge value={assignment.status} />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDetail(r.id ?? 0)}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
          >
            상세
          </button>
        </div>
      </td>
    </tr>
  );
}

// ====== 메인 페이지 ======
export default function MyPage() {
  const { data: session } = useSession();
  const meId = (session?.user as any)?.id ?? 0;
  const updateAssign = useUpdateAssignmentStatus();

  // 목록/페이징 상태
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<RequestForm | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState<string>("채팅");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [serviceRequestId, setServiceRequestId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [sortKey, setSortKey] = useState<"createdAt" | "hope_date">("createdAt");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { setPage(1); }, [statusFilter, sortKey, sortDir]);

  const { data, isLoading, isError } = useServiceRequests({
    page,
    page_size: pageSize,
    order_by: sortKey,
    order_dir: sortDir,
    withCredentials: true,
    mine: 'company',
  });
  console.log(data);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const blockStart = Math.floor((page - 1) / 10) * 10 + 1;
  const blockEnd = Math.min(blockStart + 9, totalPages);
  const pageNumbers = useMemo(
    () => Array.from({ length: Math.max(0, blockEnd - blockStart + 1) }, (_, i) => blockStart + i),
    [blockStart, blockEnd]
  );
  const goFirst = () => setPage(1);
  const goLast = () => setPage(totalPages);
  const goPrevBlock = () => setPage(Math.max(1, blockStart - 10));
  const goNextBlock = () => setPage(Math.min(totalPages, blockStart + 10));

  function handleDetail(id: number) {
    const found = items.find((x) => x.id === id) || null;
    setSelected(found as any);
    setDetailOpen(true);
  }

  // ✅ 목록이 바뀔 때마다 뱃지 upsert
  useEffect(() => {
    if (items.length > 0) {
      useBadgeStore.getState().upsert(
        items.map((x: any) => ({ id: x.id, unread_count: x.unread_count }))
      );
    }
  }, [items]);

  // ✅ 소켓 구독(개인룸 조인 + room:unread 갱신)
  useEffect(() => { 
    const socket = getSocket();
    const onConnect = () => {
      if (meId) socket.emit("join:user", { user_id: Number(meId) });
    };
    const onUnread = (p: any) => {
      // 서버가 { room_id, service_request_id, unread_count } 형식으로 보냄
      const reqId = Number(p?.service_request_id);
      if (!reqId) return;
      if (typeof p?.unread_count === "number") {
        useBadgeStore.getState().setCount(reqId, Number(p.unread_count));
      } else {
        useBadgeStore.getState().bump(reqId, 1);
      }
    };
    socket.on("connect", onConnect);
    socket.on("room:unread", onUnread);
    return () => {
      socket.off("connect", onConnect);
      socket.off("room:unread", onUnread);
      socket.disconnect();
    };
  }, [meId]);

  // ✅ 채팅 버튼 → 방 보장 → 조인 → 서버 읽음 처리(REST) → 로컬 0 → 모달 오픈
  async function openChatFor(row: any) {
    const res = await fetchWithAuth(`${baseUrl}/chat/rooms/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ service_request_id: row.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.message || "채팅방 생성/열기 실패");
      return;
    }
    const json = await res.json();
    const rid = Number(json?.room?.id);
    if (!rid) {
      alert("room.id 가 응답에 없습니다.");
      return;
    }

    // 실시간 수신을 위해 방 조인
    const socket = getSocket();
    socket.emit("join:conv", { room_id: rid });

    // 🔧 서버 DB 읽음 처리 (내 unread=0 세팅 + 정확한 브로드캐스트)
    await fetchWithAuth(`${baseUrl}/chat/rooms/${rid}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    // 로컬 뱃지 0
    useBadgeStore.getState().setCount(Number(row.id), 0);

    setChatTitle(`채팅 • ${row.org_name ?? `요청 #${row.id}`}`);
    setRoomId(rid);
    setServiceRequestId(Number(row.id));
    setChatOpen(true);
  }

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">배정된 일감확인</h1>
            <p className="mt-1 text-neutral-600">오늘 주간 작업 확인</p>
          </div>

          <section className="hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[64px]" />
                  <col className="w-[220px]" />
                  <col className="w-[120px]" />
                  <col className="w-[160px]" />
                  <col className="w-[120px]" />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">기관</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">담당자</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">연락처</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">희망일</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">신청일</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">배정 상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isLoading && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">불러오는 중…</td></tr>
                  )}
                  {isError && !isLoading && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-rose-600">목록 조회 실패</td></tr>
                  )}
                  {!isLoading && !isError && items.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-10"><EmptyState /></td></tr>
                  )}

                  {items.map((r: any) => (
                    <DesktopRequestRow
                      key={r.id}
                      r={r}
                      onDetail={handleDetail}
                      onOpenChat={openChatFor}
                      updateAssign={updateAssign}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <Pager
              page={page}
              total={total}
              totalPages={totalPages}
              blockStart={blockStart}
              blockEnd={blockEnd}
              onFirst={goFirst}
              onPrevBlock={goPrevBlock}
              onNextBlock={goNextBlock}
              onLast={goLast}
              onPick={setPage}
            />
          </section>

          <section className="md:hidden">
            <div className="space-y-3">
              {isLoading && (<div className="rounded-xl border p-6 text-center text-sm text-gray-500">불러오는 중…</div>)}
              {isError && !isLoading && (<div className="rounded-xl border p-6 text-center text-sm text-rose-600">목록 조회 실패</div>)}
              {!isLoading && !isError && items.length === 0 && (<div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">조회된 신청이 없습니다.</div>)}
              {items.map((r) => (
                <RequestRowCard key={(r as any).id} r={r as any} onDetail={handleDetail} onOpenChat={openChatFor} />
              ))}
            </div>
            <Pager
              page={page}
              total={total}
              totalPages={totalPages}
              blockStart={blockStart}
              blockEnd={blockEnd}
              onFirst={goFirst}
              onPrevBlock={goPrevBlock}
              onNextBlock={goNextBlock}
              onLast={goLast}
              onPick={setPage}
              mobile
            />
          </section>

          <CompanyServiceDetail
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            request={selected}
            onStatusChange={undefined}
          />
        </div>
      </section>

      {/* 채팅 모달: roomId가 있어야 렌더 */}
      {chatOpen && roomId != null && (
        <ChatModal
          key={roomId}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          title={chatTitle}
          meId={meId}
          roomId={roomId}
          serviceRequestId={serviceRequestId ?? undefined}
        />
      )}

      <Footer />
    </div>
  );
}

/** 공통 페이지네션 UI */
function Pager({
  page, total, totalPages, blockStart, blockEnd, onFirst, onPrevBlock, onPick, onNextBlock, onLast, mobile
}: {
  page: number; total: number; totalPages: number; blockStart: number; blockEnd: number;
  onFirst: () => void; onPrevBlock: () => void; onPick: (n: number) => void; onNextBlock: () => void; onLast: () => void;
  mobile?: boolean;
}) {
  const pageSize = 10;
  const pageNumbers = Array.from({ length: Math.max(0, blockEnd - blockStart + 1) }, (_, i) => blockStart + i);
  return (
    <div className={`flex items-center justify-between gap-3 border-t border-gray-100 ${mobile ? "mt-3" : ""} px-4 py-3`}>
      <div className="text-xs text-gray-500">
        {total > 0
          ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} / ${total}`
          : `0 / 0`}
        &nbsp;· 페이지 {page} / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onFirst} disabled={page === 1} className="rounded-l-xl border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">처음</button>
        <button onClick={onPrevBlock} disabled={blockStart === 1} className="border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">이전</button>
        {pageNumbers.map((n) => (
          <button key={n} onClick={() => onPick(n)} className={`border px-3 py-1.5 text-sm ${n === page ? "bg-gray-600 text-white" : "bg-white hover:bg-gray-50"}`}>{n}</button>
        ))}
        <button onClick={onNextBlock} disabled={blockEnd === totalPages} className="border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">다음</button>
        <button onClick={onLast} disabled={page === totalPages} className="rounded-r-xl border px-3 py-1.5 text-sm disabled:opacity-50 bg-gray-100 hover:bg-gray-200">마지막</button>
      </div>
    </div>
  );
}
