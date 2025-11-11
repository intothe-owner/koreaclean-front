"use client";


import Header from "@/components/admin/Header";
import SidebarMenu from "@/components/admin/SidebarMenu";
import Sidebar from "@/components/admin/Siderbar";
import IconSearch from "@/components/ui/IconSearch";

import { useState } from "react";

// Default export a React component so you can drop it into /app/page.tsx directly
export default function AdminDashboardTemplate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar/>

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header/>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* KPI cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title="당일 주문" value="128" trend="▲ 12.5%" note="어제 대비" />
            <KpiCard title="신규 가입" value="36" trend="▲ 4.1%" note="지난주 대비" />
            <KpiCard title="매출 (₩)" value="8,920,000" trend="▼ 2.8%" note="주간" negative />
            <KpiCard title="처리 대기" value="17" trend="—" note="실시간" flat />
          </section>

          {/* Chart + List */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">7일 매출 추이</h3>
                <div className="text-xs text-gray-500">UI 전용 / 더미 데이터</div>
              </div>
              <MiniAreaChart />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">최근 알림</h3>
                <button className="text-xs text-indigo-600 hover:underline">모두 보기</button>
              </div>
              <ul className="space-y-3 text-sm">
                <ActivityItem title="주문 #A1024 결제 완료" time="3분 전" />
                <ActivityItem title="신규 회원 가입 (k***)" time="18분 전" />
                <ActivityItem title="배치 완료: 통계 업데이트" time="1시간 전" />
                <ActivityItem title="권한 변경: 에디터 -> 매니저" time="어제" />
              </ul>
            </div>
          </section>

          {/* Table */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">최근 주문</h3>
              <div className="flex items-center gap-2">
                <Dropdown label="전체 상태" />
                <button className="rounded-xl border border-gray-200 px-3 py-2 text-sm">내보내기</button>
                <button className="rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm">새 주문</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <Th>#</Th>
                    <Th>고객</Th>
                    <Th>상품</Th>
                    <Th>금액</Th>
                    <Th>상태</Th>
                    <Th>일시</Th>
                    <Th className="text-right">액션</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sampleOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <Td>{o.id}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200" />
                          <div>
                            <div className="font-medium">{o.customer}</div>
                            <div className="text-xs text-gray-500">{o.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{o.product}</Td>
                      <Td>₩ {o.amount.toLocaleString()}</Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                          o.status === "완료"
                            ? "bg-green-100 text-green-700"
                            : o.status === "대기"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {o.status}
                        </span>
                      </Td>
                      <Td>{o.date}</Td>
                      <Td className="text-right">
                        <button className="rounded-lg border border-gray-200 px-2.5 py-1.5">보기</button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
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

function KpiCard({
  title,
  value,
  trend,
  note,
  negative,
  flat,
}: {
  title: string;
  value: string;
  trend: string;
  note: string;
  negative?: boolean;
  flat?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span
          className={`${
            negative ? "text-red-600" : flat ? "text-gray-500" : "text-green-600"
          }`}
        >
          {trend}
        </span>
        <span className="text-gray-400">· {note}</span>
      </div>
      <div className="mt-3">
        <MiniSparkline negative={negative} />
      </div>
    </div>
  );
}

function MiniSparkline({ negative }: { negative?: boolean }) {
  // Simple inline SVG sparkline (UI only)
  return (
    <svg viewBox="0 0 200 60" className="w-full h-12">
      <polyline
        fill="none"
        stroke={negative ? "#dc2626" : "#16a34a"}
        strokeWidth="3"
        points="0,45 30,30 60,35 90,20 120,25 150,18 180,24 200,12"
      />
      <circle cx="200" cy="12" r="4" fill={negative ? "#dc2626" : "#16a34a"} />
    </svg>
  );
}

function MiniAreaChart() {
  // Decorative area chart (no data libs, UI only)
  return (
    <div className="relative h-64 w-full">
      <svg viewBox="0 0 600 240" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polyline
          fill="url(#grad)"
          stroke="#4f46e5"
          strokeWidth="2"
          points="0,180 60,160 120,170 180,120 240,140 300,95 360,110 420,80 480,100 540,70 600,85 600,240 0,240"
        />
        <g>
          {[0, 100, 200, 300, 400, 500, 600].map((x) => (
            <line key={x} x1={x} y1={20} x2={x} y2={220} stroke="#e5e7eb" strokeWidth="1" />
          ))}
        </g>
      </svg>
      <div className="absolute bottom-2 left-2 text-xs text-gray-400">월 · 화 · 수 · 목 · 금 · 토 · 일</div>
    </div>
  );
}

function ActivityItem({ title, time }: { title: string; time: string }) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-indigo-500" />
        <span>{title}</span>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </li>
  );
}

function Dropdown({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white">
      {label}
      <IconChevronDown />
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-2 px-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 px-3 ${className}`}>{children}</td>;
}

/* ------------------------------ Icons ------------------------------ */
function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.11a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.21 17l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.11a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.06 3.21l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.11a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.79 6l-.06.06a1.65 1.65 0 0 0-.33 1.82V8c0 .66.39 1.26 1 1.51.33.14.69.21 1.06.21H22a2 2 0 1 1 0 4h-.11c-.37 0-.73.07-1.06.21-.61.25-1 .85-1 1.51Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


/* --------------------------- Sample Data --------------------------- */
const sampleOrders = [
  { id: "A1024", customer: "김지훈", email: "ji***@mail.com", product: "에어컨 실내기 세척", amount: 99000, status: "완료", date: "08-11 14:21" },
  { id: "A1025", customer: "이서연", email: "se***@mail.com", product: "입주청소 스탠다드", amount: 250000, status: "대기", date: "08-11 15:10" },
  { id: "A1026", customer: "박민수", email: "mi***@mail.com", product: "에어컨 실외기 세척", amount: 49000, status: "진행중", date: "08-12 09:05" },
  { id: "A1027", customer: "최유진", email: "yu***@mail.com", product: "소독·방역 패키지", amount: 180000, status: "완료", date: "08-12 10:44" },
];
