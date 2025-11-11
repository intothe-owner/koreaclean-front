"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useUserList, type Role, type UserRow, type SearchKey } from "@/hooks/useUserList";
import { useDebounce } from "@/hooks/useDebounce"; // 선택사항: ②를 만든 경우
import EmailComposerModal, { EmailMode } from "@/components/admin/EmailComposerModal";
import UserDetailModal from "@/components/admin/UserDetailModal";
const ROLE_LABEL: Record<Role, string> = {
    SUPER: "슈퍼",
    ADMIN: "관리자",
    CLIENT: "기관",
    COMPANY: "업체",
};

const ROLE_BADGE: Record<Role, string> = {
    SUPER: "bg-purple-100 text-purple-700 ring-purple-200",
    ADMIN: "bg-blue-100 text-blue-700 ring-blue-200",
    CLIENT: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    COMPANY: "bg-amber-100 text-amber-700 ring-amber-200",
};

function safePhone(v?: string | null) {
    return v?.trim() ? v : "-";
}

// 1~10 그룹 페이징 컴포넌트(변경 없음)
function PaginationBar({
    page,
    setPage,
    totalPages,
    groupSize = 10,
}: {
    page: number;
    setPage: (p: number) => void;
    totalPages: number;
    groupSize?: number;
}) {
    if (totalPages <= 1) return null;
    const groupStart = Math.floor((page - 1) / groupSize) * groupSize + 1;
    const groupEnd = Math.min(groupStart + groupSize - 1, totalPages);
    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="flex flex-wrap items-center gap-1 text-sm">
            <button onClick={() => setPage(1)} disabled={!canPrev} className="px-2 py-1 rounded-md ring-1 ring-gray-300 disabled:opacity-40">« 처음</button>
            <button onClick={() => setPage(page - 1)} disabled={!canPrev} className="px-2 py-1 rounded-md ring-1 ring-gray-300 disabled:opacity-40">‹ 이전</button>

            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map((n) => (
                <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1 rounded-md ring-1 ${n === page ? "ring-blue-500 bg-blue-600 text-white" : "ring-gray-300 hover:bg-gray-100"}`}
                    aria-current={n === page ? "page" : undefined}
                >
                    {n}
                </button>
            ))}

            <button onClick={() => setPage(page + 1)} disabled={!canNext} className="px-2 py-1 rounded-md ring-1 ring-gray-300 disabled:opacity-40">다음 ›</button>
            <button onClick={() => setPage(totalPages)} disabled={!canNext} className="px-2 py-1 rounded-md ring-1 ring-gray-300 disabled:opacity-40">마지막 »</button>
            <span className="ml-2 text-gray-500">{page} / {totalPages}</span>
        </div>
    );
}

export default function UserPage() {
    const router = useRouter();
    const [useFilter, setUseFilter] = useState<"active" | "inactive" | "all">("active");
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailUser, setDetailUser] = useState<UserRow | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailMode, setEmailMode] = useState<EmailMode>("ALL");
    // 검색/필터/정렬/페이지 상태
    const [searchKey, setSearchKey] = useState<SearchKey>("email");
    const [query, setQuery] = useState("");
    const debouncedQ = useDebounce(query, 300); // 선택: 디바운스 사용
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const orderBy: "createdAt" | "name" | "email" = "createdAt";
    const orderDir: "ASC" | "DESC" = "DESC";
    const [roleFilter, setRoleFilter] = useState<"" | Role>(""); // 필요 없으면 없애도 됨
    function goService(u: UserRow) {
        router.push(`/admin/service?client_id=${u.id}`);
    }
    // 서버에서 목록 가져오기
    const { data, isLoading, isError, refetch } = useUserList({
        q: debouncedQ,           // 디바운스 적용
        key: searchKey,
        role: roleFilter || undefined,
        page,
        page_size: pageSize,
        order_by: orderBy,
        order_dir: orderDir,
        use: useFilter, // ⬅️ 추가
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.total_pages ?? 1;

    // 선택(체크박스)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const isChecked = (id: number) => selectedIds.has(id);
    const toggleOne = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const isAllOnPageChecked = items.length > 0 && items.every((u) => selectedIds.has(u.id));
    const toggleAllOnPage = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isAllOnPageChecked) items.forEach((u) => next.delete(u.id));
            else items.forEach((u) => next.add(u.id));
            return next;
        });
    };

    // 검색어 변경 시 1페이지로
    function handleQueryChange(v: string) {
        setQuery(v);
        setPage(1);
    }

    // 이메일 발송(샘플)
    function promptEmailContent() {
        const subject = window.prompt("이메일 제목을 입력하세요:", "");
        if (subject === null) return null;
        const body = window.prompt("이메일 본문을 입력하세요:", "");
        if (body === null) return null;
        return { subject, body };
    }
    async function submitEmail(payload: {
        mode: "ALL" | "SELECTED";
        subject: string;
        body: string;
        filter?: { q?: string; key?: "email" | "name" | "phone"; role?: string | "" };
        ids?: number[];
    }) {
        const res = await fetch("/backend/users/send-email", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, isHtml: true, dryRun: false }),
        });
        const data = await res.json();
        if (!res.ok || !data?.is_success) {
            alert(`발송 실패: ${data?.message ?? res.status}`);
            return;
        }
        alert(`발송 결과: 성공 ${data.data?.success} / 실패 ${data.data?.failedCount}`);
    }


    // RowActions 교체: 수정 버튼 제거 → 탈퇴/복구 버튼
    function RowActions({ user }: { user: UserRow }) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                {user.role === "CLIENT" && (
                    <button
                        onClick={() => router.push(`/admin/service?client_id=${user.id}`)}
                        className="px-2 py-1 text-xs rounded-md ring-1 ring-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                        서비스 이용 조회
                    </button>
                )}

                <button
                    onClick={() => { setDetailUser(user); setDetailOpen(true); }}
                    className="px-2 py-1 text-xs rounded-md ring-1 ring-gray-300 hover:bg-gray-100"
                >
                    보기
                </button>

                {/* ⬇️ 탈퇴/복구 토글 */}
                {user.is_use ? (
                    <button
                        onClick={() => toggleUse(user)}
                        className="px-2 py-1 text-xs rounded-md ring-1 ring-rose-300 text-rose-700 hover:bg-rose-50"
                        title="계정을 탈퇴 처리합니다"
                    >
                        탈퇴
                    </button>
                ) : (
                    <button
                        onClick={() => toggleUse(user)}
                        className="px-2 py-1 text-xs rounded-md ring-1 ring-amber-300 text-amber-700 hover:bg-amber-50"
                        title="탈퇴 계정을 복구합니다"
                    >
                        복구
                    </button>
                )}
            </div>
        );
    }

    const EmailButtons = () => (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <button
                onClick={() => { setEmailMode("ALL"); setEmailModalOpen(true); }}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
                전체 회원 이메일 보내기 ({total})
            </button>
            <button
                onClick={() => { setEmailMode("SELECTED"); setEmailModalOpen(true); }}
                disabled={selectedIds.size === 0}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-40 hover:bg-emerald-700"
            >
                선택된 회원 이메일 보내기 ({selectedIds.size})
            </button>
        </div>
    );
    // 페이지 컴포넌트 안
    async function toggleUse(user: UserRow) {
        const next = !user.is_use;
        const verb = next ? "복구" : "탈퇴";
        if (!confirm(`정말 ${verb} 처리할까요?\n\n이메일: ${user.email}`)) return;

        const res = await fetch(`/backend/users/use/${user.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_use: next }),
        });
        const data = await res.json();
        if (!res.ok || !data?.is_success) {
            alert(`${verb} 실패: ${data?.message ?? res.status}`);
            return;
        }
        // 목록 갱신
        try { await refetch(); } catch { }
        // 선택 상태에서도 해제(선택 유지 원치 않으면)
        setSelectedIds((prev) => {
            const n = new Set(prev);
            n.delete(user.id);
            return n;
        });
    }


    return (
        <div className="min-h-screen w-full bg-gray-50 text-gray-900">
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <Sidebar />

            <div className="lg:pl-72">
                <Header />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-xl font-bold">회원관리</h1>
                    </div>

                    {/* 검색 + (선택) 권한 필터 + 이메일 버튼 */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        

                        {/* 권한 필터 */}
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value as Role | ""); setPage(1); }}
                            className="w-full sm:w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">권한 전체</option>
                            <option value="SUPER">슈퍼</option>
                            <option value="ADMIN">관리자</option>
                            <option value="CLIENT">기관</option>
                            <option value="COMPANY">업체</option>
                        </select>

                        {/* ✅ 상태 필터 */}
                        <select
                            value={useFilter}
                            onChange={(e) => { setUseFilter(e.target.value as any); setPage(1); }}
                            className="w-full sm:w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="active">사용중</option>
                            <option value="inactive">탈퇴</option>
                            <option value="all">전체</option>
                        </select>
                        {/* 기존 검색키 */}
                        <select
                            value={searchKey}
                            onChange={(e) => { setSearchKey(e.target.value as SearchKey); setPage(1); }}
                            className="w-full sm:w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="email">회원이메일</option>
                            <option value="name">이름</option>
                            <option value="phone">휴대폰번호</option>
                        </select>
                        {/* 검색어 인풋 */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => handleQueryChange(e.target.value)}
                                placeholder="검색어를 입력하세요"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {query && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => handleQueryChange("")}
                                    aria-label="clear"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 결과 카운트 & 페이지네이션 상단 */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                            총 <b className="text-gray-800">{total}</b>명 · 선택 <b className="text-gray-800">{selectedIds.size}</b>명
                            {isLoading && <span className="ml-2 text-blue-600">로딩 중…</span>}
                            {isError && <span className="ml-2 text-rose-600">불러오기 실패</span>}
                        </div>
                        <PaginationBar page={page} setPage={setPage} totalPages={totalPages} groupSize={10} />
                    </div>

                    {/* 데스크톱 테이블 */}
                    <div className="hidden lg:block overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-sm text-gray-600">
                                    <th className="px-4 py-3 w-10">
                                        <input type="checkbox" aria-label="select all on page" checked={isAllOnPageChecked} onChange={toggleAllOnPage} className="h-4 w-4 rounded border-gray-300" />
                                    </th>
                                    <th className="px-6 py-3 font-medium">아이디(Email)</th>
                                    <th className="px-6 py-3 font-medium">이름</th>
                                    <th className="px-6 py-3 font-medium">연락처</th>
                                    <th className="px-6 py-3 font-medium">권한</th>
                                    <th className="px-6 py-3 font-medium">설정</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((u) => (
                                    <tr key={u.id} className="text-sm">
                                        <td className="px-4 py-3">
                                            <input type="checkbox" checked={isChecked(u.id)} onChange={() => toggleOne(u.id)} className="h-4 w-4 rounded border-gray-300" />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-gray-900">{u.email}</div>
                                            <div className="text-xs text-gray-500">{u.inst}</div>
                                        </td>
                                        <td className="px-6 py-3">{u.name}</td>
                                        <td className="px-6 py-3">
                                            <div>{safePhone(u.phone)}</div>
                                            <div className="text-xs text-gray-500">{u.contact || "-"}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                                            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1
  ${u.is_use ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-gray-200 text-gray-600 ring-gray-300"}`}>
                                                {u.is_use ? "사용중" : "탈퇴"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <RowActions user={u} />
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">검색 결과가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 모바일 카드 리스트 */}
                    <div className="lg:hidden space-y-3">
                        {items.map((u) => (
                            <div key={u.id} className="rounded-2xl bg-white p-4 ring-1 ring-gray-200 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={isChecked(u.id)} onChange={() => toggleOne(u.id)} className="h-4 w-4 rounded border-gray-300" />
                                        <div>
                                            <div className="text-sm text-gray-500">아이디(Email)</div>
                                            <div className="font-semibold break-all">{u.email}</div>
                                            <div className="text-xs text-gray-500">{u.inst}</div>
                                        </div>
                                    </label>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-500">이름</div>
                                    <div className="text-right">{u.name}</div>
                                    <div className="text-gray-500">휴대폰</div>
                                    <div className="text-right">{safePhone(u.phone)}</div>
                                    <div className="text-gray-500">연락처</div>
                                    <div className="text-right">{u.contact || "-"}</div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <RowActions user={u} />
                                </div>
                            </div>
                        ))}
                        {items.length === 0 && !isLoading && (
                            <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 text-center text-sm text-gray-500">검색 결과가 없습니다.</div>
                        )}
                    </div>

                    {/* 페이지네이션 하단 + 이메일 버튼(하단) */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-end">
                            <PaginationBar page={page} setPage={setPage} totalPages={totalPages} groupSize={10} />
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200 shadow-sm">
                            <EmailButtons />
                        </div>
                    </div>

                    {/* ✅ 이메일 작성 모달 */}
                    <EmailComposerModal
                        open={emailModalOpen}
                        onClose={() => setEmailModalOpen(false)}
                        mode={emailMode}
                        onSubmit={submitEmail}
                        selectedIds={Array.from(selectedIds)}                 // 선택 발송 모드에 사용
                        targetCount={emailMode === "ALL" ? total : selectedIds.size}
                        filter={{
                            q: query,                                           // 현재 검색어
                            key: searchKey,                                     // email | name | phone
                            // role: roleFilter,                                 // (역할 필터 쓰는 경우 주석 해제)
                        }}
                    />
                    {/* ✅ 상세 모달 */}
                    <UserDetailModal
                        open={detailOpen}
                        user={detailUser}
                        onClose={() => setDetailOpen(false)}
                        onGoService={goService} // 기관회원 전용 버튼 활성화
                    />
                </main>
            </div>
        </div>
    );
}
