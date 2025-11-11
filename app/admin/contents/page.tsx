"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";

import { useEffect, useMemo, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
// 1) 홈 & 서비스 소개만 추린 데이터 (href 제거)
const MENUS = [
    {
        id: "home",
        label: "홈",
        children: [
            { id: "home1", label: "서비스 개요 소개" },
            { id: "home2", label: "주요 서비스 지역" },
            { id: "home3", label: "연락처 및 위치" },
            { id: "home4", label: "간단한 성과 현황" },
        ],
    },
    {
        id: "service",
        label: "서비스 소개",
        children: [
            { id: "service1", label: "경로당 청소 서비스" },
            { id: "service2", label: "서비스 절차 안내" },
            { id: "service3", label: "요금표" },
            { id: "service4", label: "서비스 지역" },
            { id: "service5", label: "이용 안내" },
            { id: "service6", label: "품질 보증 정책" },
        ],
    },
];

// 2) 간단 HTML 소스코드 에디터 모달 (Textarea + 미리보기 탭, 저장/취소)
function HtmlEditorModal({
    open,
    title,
    initialHtml,
    onClose,
    onSave,
}: {
    open: boolean;
    title: string;
    initialHtml?: string;
    onClose: () => void;
    onSave: (html: string) => Promise<void> | void;
}) {
    const [tab, setTab] = useState<"html" | "preview">("html");
    const [value, setValue] = useState<string>(initialHtml ?? "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            // 기본값: <style></style> + <div></div>
            const defaultHtml = `<style>\n</style>\n<div>\n</div>`;
            setValue(initialHtml && initialHtml.trim() !== "" ? initialHtml : defaultHtml);
            setTab("html");
        }
    }, [open, initialHtml]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* backdrop: 더 옅은 회색/블랙 */}
            <div
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
            />

            <div className="relative z-[101] w-[min(100%,_960px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <h2 className="text-base font-semibold text-gray-800">{title} - HTML 소스 편집</h2>
                    <button
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        닫기
                    </button>
                </div>

                {/* 탭 */}
                <div className="flex items-center gap-2 border-b border-gray-200 px-4">
                    <button
                        className={`px-3 py-2 text-sm ${tab === "html"
                            ? "border-b-2 border-gray-400 text-gray-900"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                        onClick={() => setTab("html")}
                    >
                        HTML
                    </button>
                    <button
                        className={`px-3 py-2 text-sm ${tab === "preview"
                            ? "border-b-2 border-gray-400 text-gray-900"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                        onClick={() => setTab("preview")}
                    >
                        미리보기
                    </button>
                </div>

                {/* 본문 */}
                <div className="p-4">
                    {tab === "html" ? (
                        <div className="h-[48vh] w-full overflow-hidden rounded-lg border border-gray-200">
                            <MonacoEditor
                                height="48vh"
                                defaultLanguage="html"
                                value={value}
                                onChange={(v) => setValue(v ?? "")}
                                theme="vs" // vs, vs-dark 선택 가능
                                options={{
                                    minimap: { enabled: false },
                                    wordWrap: "on",
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-[48vh] w-full overflow-auto rounded-lg border border-gray-200 bg-white">
                            {/* iframe 미리보기: srcDoc 으로 렌더 */}
                            <iframe
                                title="preview"
                                className="h-full w-full"
                                srcDoc={value}
                            />
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
                    <button
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <button
                        disabled={saving}
                        className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-60"
                        onClick={async () => {
                            try {
                                setSaving(true);
                                await onSave(value);
                                onClose();
                            } finally {
                                setSaving(false);
                            }
                        }}
                    >
                        {saving ? "저장 중..." : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// 3) 관리자 목록 + 에디터 연결
export default function AdminContents() {
    const [sidebarOpen, setSidebarOpen] = useState(false);


    // 편집 모달 상태
    const [editorOpen, setEditorOpen] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>("");
    const [initialHtml, setInitialHtml] = useState<string>("");


    // 로컬스토리지 키
    const keyOf = (id: string) => `content_${id}`;

    const openEditor = (id: string, title: string) => {
        setCurrentId(id);
        setCurrentTitle(title);
        // 저장된 값 불러오기 (임시: LocalStorage). 추후 서버 연동으로 교체.
        const saved = typeof window !== "undefined" ? localStorage.getItem(keyOf(id)) : null;
        setInitialHtml(saved ?? "");
        setEditorOpen(true);
    };

    const saveEditor = async (html: string) => {
        if (!currentId) return;
        // 임시 저장: LocalStorage. ★ 추후 API 연동으로 교체하세요.
        if (typeof window !== "undefined") {
            localStorage.setItem(keyOf(currentId), html);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 text-gray-900">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar />

            {/* Main area */}
            <div className="lg:pl-72">
                <Header />

                {/* Content */}
                <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="mb-2 text-xl font-bold">콘텐츠 관리</h1>
                    <p className="mb-4 text-sm text-gray-600">
                        홈 / 서비스 소개 항목을 선택하여 HTML 소스를 편집하세요.
                    </p>

                    {MENUS.map((menu) => (
                        <div key={menu.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-4 py-2 font-semibold text-gray-800">
                                {menu.label}
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {menu.children?.map((sub) => (
                                    <li
                                        key={sub.id}
                                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                                    >
                                        <span className="text-gray-800">{sub.label}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                                onClick={() => openEditor(sub.id, `${menu.label} / ${sub.label}`)}
                                            >
                                                편집
                                            </button>
                                            <button
                                                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50"
                                                onClick={() => {
                                                    // 임시 저장 내용 삭제
                                                    if (typeof window !== "undefined") {
                                                        localStorage.removeItem(keyOf(sub.id));
                                                    }
                                                }}
                                            >
                                                초기화
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </main>
            </div>

            {/* 에디터 모달 */}
            <HtmlEditorModal
                open={editorOpen}
                title={currentTitle}
                initialHtml={initialHtml}
                onClose={() => setEditorOpen(false)}
                onSave={saveEditor}
            />
        </div>
    );
}
