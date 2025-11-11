'use client'
import { useState } from "react";
import IconDot from "../ui/IconDot";
import IconSearch from "../ui/IconSearch";

/* --------------------------- Subcomponents --------------------------- */
const Header = ()=>  {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
   <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {/* Mobile menu button */}
                            <button
                                className="inline-flex lg:hidden items-center justify-center rounded-xl border border-gray-200 h-10 w-10"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                aria-label="Toggle sidebar"
                            >
                                <IconMenu />
                            </button>
                            <div className="hidden md:flex items-center gap-2">
                                <div className="text-sm text-gray-500">오늘</div>
                                <div className="text-sm font-medium">대시보드</div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <input
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                                    placeholder="검색 ( / )"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <IconSearch />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <TopIconButton ariaLabel="알림">
                                <IconBell />
                            </TopIconButton>
                            <TopIconButton ariaLabel="설정">
                                <IconSettings />
                            </TopIconButton>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center text-sm font-semibold">
                                NK
                            </div>
                        </div>
                    </div>
                </header>
  );
}
function IconSettings() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.11a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.21 17l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.11a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.06 3.21l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.11a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.79 6l-.06.06a1.65 1.65 0 0 0-.33 1.82V8c0 .66.39 1.26 1 1.51.33.14.69.21 1.06.21H22a2 2 0 1 1 0 4h-.11c-.37 0-.73.07-1.06.21-.61.25-1 .85-1 1.51Z" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}
/* ------------------------------ Icons ------------------------------ */
function IconMenu() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
function TopIconButton({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
    return (
        <button
            aria-label={ariaLabel}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 h-10 w-10 hover:bg-gray-50"
        >
            {children}
        </button>
    );
}

function IconBell() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 17H9a6 6 0 0 1-6-6V9a7 7 0 1 1 14 0v2a6 6 0 0 0 6 6h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="18" r="2" fill="currentColor" />
        </svg>
    );
}
export default Header;
