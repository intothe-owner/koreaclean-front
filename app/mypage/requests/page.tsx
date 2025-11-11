// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import { useSession } from 'next-auth/react';
import { baseUrl, RequestForm } from "@/lib/variable";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import ServiceDetailModal from "@/components/app/ServiceDetailModal";
import type { SRStatus } from "@/hooks/useServiceRequests";

// ✅ 채팅
import ChatModal from "@/components/app/ChatModal";
import ChatIconButton from "@/components/app/ChatIconButton";

// ✅ 소켓 & Zustand (업체 회원 페이지와 동일한 로직)
import { getSocket } from "@/lib/socket";
import { create } from "zustand";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

// ====== [이 파일 안에서만 쓰는 뱃지 스토어] ======
type BadgeState = {
  counts: Record<number, number>; // service_request_id -> unread_count
  upsert: (items: Array<{ id: number; unread_count?: number }>) => void;
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
        if (!(id in next)) {
          next[id] = Math.max(0, Number(it.unread_count ?? 0));
        }
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
/** 요청ID 하나의 카운트만 구독 (리렌더 보장) */
function useBadgeCount(reqId?: number | null) {
  return useBadgeStore((s) => (reqId ? (s.counts[reqId] ?? 0) : 0));
}

// ====== 공통 유틸 ======
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
  };
  const label: Record<string, string> = {
    PENDING: "대기",
    ACCEPTED: "수락",
    IN_PROGRESS: "진행",
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

function normalizeSeniors(r: any): Array<{ id?: number; name?: string; address?: string; address_detail?: string }> {
  let arr = r?.seniors ?? r?.senior_centers ?? r?.senior ?? r?.centers ?? r?.senior_list ?? r?.seniors_json ?? [];
  if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch {} }
  return Array.isArray(arr) ? arr : [];
}

function seniorSummary(list: Array<{ name?: string }>) {
  if (!list?.length) return "-";
  const names = list.map((s) => s?.name).filter(Boolean) as string[];
  if (names.length === 1) return names[0]!;
  return `${names[0]} 외 ${names.length - 1}개`;
}

function seniorTooltip(list: Array<{ name?: string; address?: string; address_detail?: string }>) {
  if (!list?.length) return "경로당 없음";
  return list.map((s) => {
    const name = s?.name ?? "-";
    const addr = [s?.address, s?.address_detail].filter(Boolean).join(" ");
    return addr ? `${name} • ${addr}` : `${name}`;
  }).join("\n");
}

function HoverTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex max-w-full align-middle">
      <span className="truncate">{children}</span>
      <span className="absolute left-0 top-[calc(100%+4px)] z-30 hidden whitespace-pre rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-lg group-hover:block max-w-[70vw]">
        {text}
      </span>
    </span>
  );
}

// ====== 모바일 카드 ======
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
  const companyName: string = assignment?.company?.name || "-";
  const assignStatus: string | undefined = assignment?.status;

  const seniors = normalizeSeniors(r as any);
  const summary = seniorSummary(seniors);
  const tooltip = seniorTooltip(seniors);

  // ✅ 뱃지 구독
  const badge = useBadgeCount(Number(r.id));

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.org_name}</div>
        </div>
        <StatusBadge value={r.status} />
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-gray-700">
        <div className="col-span-2">
          <dt className="text-gray-500">경로당</dt>
          <dd className="truncate">
            <div className="flex items-center gap-2">
              <HoverTooltip text={tooltip}>
                <span className="truncate">{summary}</span>
              </HoverTooltip>
              <ChatIconButton
                count={badge}
                onClick={() => onOpenChat(r)}
                label="채팅"
              />
            </div>
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">담당자</dt>
          <dd>{r.contact_name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">사무실</dt>
          <dd>{r.contact_tel || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">담당자연락처</dt>
          <dd>{r.contact_phone || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">희망일</dt>
          <dd>{hope}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">신청일</dt>
          <dd>{created}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">배정 업체</dt>
          <dd className="flex items-center gap-2">
            <span className="truncate">{companyName}</span>
            {assignment && <AssignmentBadge value={assignStatus} />}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => onDetail(r.id ?? 0)}
          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
        >
          상세
        </button>
        <ChatIconButton
          count={badge}
          onClick={() => onOpenChat(r)}
          label="채팅"
          className="h-9 min-w-9"
        />
      </div>
    </div>
  );
}

// ====== 데스크톱 행 컴포넌트 (훅 안전) ======
function DesktopRow({
  r,
  onDetail,
  onOpenChat,
}: {
  r: any;
  onDetail: (id: number) => void;
  onOpenChat: (row: any) => void;
}) {
  const created = toDateOnly(r.created_at || r.createdAt);
  const hope = toDateOnly(r.hope_date as any);
  const assignment = pickLatestAssignment(r);
  const companyName: string = assignment?.company?.name || "-";
  const assignStatus: string | undefined = assignment?.status;

  const seniors = normalizeSeniors(r);
  const summary = seniorSummary(seniors);
  const tooltip = seniorTooltip(seniors);

  // ✅ 여기서 훅 호출 (최상위, 고정 순서)
  const badgeCount = useBadgeCount(Number(r.id));

  return (
    <tr className="hover:bg-gray-50/60">
      <td className="px-4 py-3 text-sm text-gray-500">{r.id}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2 max-w-[340px]">
          <HoverTooltip text={tooltip}>
            <span className="inline-flex items-center gap-1">
              <span className="truncate">{summary}</span>
            </span>
          </HoverTooltip>
          <ChatIconButton
            count={badgeCount}
            onClick={() => onOpenChat(r)}
            label="채팅"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{hope}</td>
      <td className="px-4 py-3 text-sm"><StatusBadge value={r.status} /></td>
      <td className="px-4 py-3 text-sm text-gray-600">{created}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[160px]">{companyName}</span>
          {assignment && <AssignmentBadge value={assignStatus} />}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <button
          onClick={() => onDetail(r.id ?? 0)}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-50"
        >
          상세
        </button>
      </td>
    </tr>
  );
}

/** 상태 변경 뮤테이션 훅 (예시) */
function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SRStatus }) => {
      const res = await fetchWithAuth(`/backend/request/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

function MyPageContent() {
  const { data: session, status } = useSession();
  const meId = (session?.user as any)?.id ?? 0;

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<RequestForm | null>(null);

  // ✅ 채팅 모달 상태 (room 기반)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState<string>("채팅");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [serviceRequestId, setServiceRequestId] = useState<number | null>(null);

  const [qOrg, setQOrg] = useState("");
  const [qContact, setQContact] = useState("");
  const [debOrg, setDebOrg] = useState("");
  const [debContact, setDebContact] = useState("");

  useEffect(() => { const t = setTimeout(() => setDebOrg(qOrg.trim()), 300); return () => clearTimeout(t); }, [qOrg]);
  useEffect(() => { const t = setTimeout(() => setDebContact(qContact.trim()), 300); return () => clearTimeout(t); }, [qContact]);

  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [sortKey, setSortKey] = useState<"createdAt" | "hope_date">("createdAt");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { setPage(1); }, [debOrg, debContact, statusFilter, sortKey, sortDir]);

  const { data, isLoading, isError } = useServiceRequests({
    page,
    page_size: pageSize,
    org_name: debOrg || undefined,
    contact_name: debContact || undefined,
    status: statusFilter || undefined,
    order_by: sortKey,
    order_dir: sortDir,
    withCredentials: true,
    mine: 'client',
  });
  console.log(data);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const blockStart = Math.floor((page - 1) / 10) * 10 + 1;
  const blockEnd = Math.min(blockStart + 9, totalPages);

  const goFirst = () => setPage(1);
  const goLast = () => setPage(totalPages);
  const goPrevBlock = () => setPage(Math.max(1, blockStart - 10));
  const goNextBlock = () => setPage(Math.min(totalPages, blockStart + 10));

  function handleDetail(id: number) {
    const found = items.find((x: any) => x.id === id) || null;
    setSelected(found as any);
    setDetailOpen(true);
  }

  // ✅ 목록이 바뀔 때마다 뱃지 upsert (초기/재조회 모두 반영)
  useEffect(() => {
    if (items.length > 0) {
      useBadgeStore.getState().upsert(
        items.map((x: any) => ({ id: x.id, unread_count: x.unread_count }))
      );
    }
  }, [items]);

  // ✅ 소켓 구독(개인룸 조인 + room:unread 수신하여 해당 서비스요청 뱃지 갱신)

   useEffect(() => { 
     const socket = getSocket();
     const onConnect = () => {
       if (meId) socket.emit("join:user", { user_id: Number(meId) });
     };
     const onUnread = (p: any) => {
       // 서버가 { room_id, service_request_id, unread_count }를 보내도록 함
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

  /** ✅ 채팅 열기: 방 보장 → 모달 오픈 → 로컬 뱃지 0으로 */
  async function openChatFor(row: any) {
    try {
      const res = await fetchWithAuth(`${baseUrl}/chat/rooms/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ service_request_id: row.id }),
      });
      console.log('data',row);
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

      // (옵션) 방 조인 및 읽음 처리 emit
      const socket = getSocket();
      socket.emit("join:conv", { room_id: rid });
      socket.emit("room:read", { room_id: rid, service_request_id: row.id });

      // ✅ 로컬 뱃지를 즉시 0으로 반영
      useBadgeStore.getState().setCount(Number(row.id), 0);

      setChatTitle(`채팅 • ${row.org_name ?? `요청 #${row.id}`}`);
      setRoomId(rid);
      setServiceRequestId(Number(row.id));
      setChatOpen(true);
    } catch (e: any) {
      alert(e?.message || "채팅방 열기에 실패했습니다.");
    }
  }

  const { mutateAsync: updateStatus } = useUpdateRequestStatus();
  const handleStatusChange = async (id: number, next: SRStatus) => {
    await updateStatus({ id, status: next });
    setSelected((prev) => (prev && prev.id === id ? ({ ...prev, status: next } as any) : prev));
    alert("상태가 변경되었습니다.");
  };

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <main className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
          <h2 className="text-xl font-semibold text-gray-900">내 서비스 신청</h2>
          <p className="mt-1 text-sm text-gray-600">기관 계정으로 접수한 서비스 신청 목록입니다.</p>

          <section className="hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[64px]" />
                  <col />
                  <col className="w-[110px]" />
                  <col className="w-[110px]" />
                  <col className="w-[120px]" />
                  <col className="w-[200px]" />
                  <col className="w-[100px]" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">경로당</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">희망일</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">신청일</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">배정 업체</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isLoading && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">불러오는 중…</td></tr>
                  )}
                  {isError && !isLoading && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-rose-600">목록 조회 실패</td></tr>
                  )}
                  {!isLoading && !isError && items.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10">
                      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
                        <div className="mb-2 text-sm text-gray-500">검색 조건에 해당하는 신청이 없습니다.</div>
                        <div className="text-xs text-gray-400">검색어를 변경하거나 초기화해 보세요.</div>
                      </div>
                    </td></tr>
                  )}

                  {items.map((r: any) => (
                    <DesktopRow
                      key={r.id}
                      r={r}
                      onDetail={(id) => {
                        const found = items.find((x: any) => x.id === id) || null;
                        setSelected(found as any);
                        setDetailOpen(true);
                      }}
                      onOpenChat={openChatFor}
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
              onFirst={() => setPage(1)}
              onPrevBlock={() => setPage(Math.max(1, blockStart - 10))}
              onPick={setPage}
              onNextBlock={() => setPage(Math.min(totalPages, blockStart + 10))}
              onLast={() => setPage(totalPages)}
            />
          </section>
        </div>

        <section className="md:hidden px-6 pb-16">
          <div className="space-y-3">
            {isLoading && (<div className="rounded-xl border p-6 text-center text-sm text-gray-500">불러오는 중…</div>)}
            {(!isLoading && isError) && (<div className="rounded-xl border p-6 text-center text-sm text-rose-600">목록 조회 실패</div>)}
            {!isLoading && !isError && items.length === 0 && (<div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">조회된 신청이 없습니다.</div>)}
            {items.map((r: any) => (
              <RequestRowCard
                key={r.id}
                r={r as any}
                onDetail={(id) => {
                  const found = items.find((x: any) => x.id === id) || null;
                  setSelected(found as any);
                  setDetailOpen(true);
                }}
                onOpenChat={openChatFor}
              />
            ))}
          </div>

          <Pager
            page={page}
            total={total}
            totalPages={totalPages}
            blockStart={blockStart}
            blockEnd={blockEnd}
            onFirst={() => setPage(1)}
            onPrevBlock={() => setPage(Math.max(1, blockStart - 10))}
            onPick={setPage}
            onNextBlock={() => setPage(Math.min(totalPages, blockStart + 10))}
            onLast={() => setPage(totalPages)}
            mobile
          />
        </section>
      </main>

      <ServiceDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        request={selected}
        onEdit={(req) => { console.log("edit", req.id); }}
        onStatusChange={handleStatusChange}
      />

      {/* ✅ roomId 확보된 경우에만 채팅 모달 렌더 */}
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

const queryClient = new QueryClient();
export default function MyPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyPageContent />
    </QueryClientProvider>
  );
}
