// app/admin/service/page.tsx
"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";

import { useEffect, useMemo, useState } from "react";

import AdminCompanyListUI from "@/components/admin/AdminCompanyList";



export default function CompanyPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((prev) => !prev);




    return (
        <div className="min-h-screen w-full bg-gray-50 text-gray-900">
            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} />

            {/* Main area */}
            <div className="lg:pl-72">
                {/* Topbar */}
                <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

                <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <AdminCompanyListUI />
                </main>
            </div>
        </div>
    );
}
