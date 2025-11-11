// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ClipboardList,
  Phone,
  Wrench,
  Star,
  FileDown,
  Megaphone,
  LineChart,
  Headphones,
} from 'lucide-react';
import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import { Button } from '@/components/ui/button';
import { baseUrl } from '@/lib/variable';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';

// ===== 메뉴 타입/목록 =====
type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  desc?: string;
};

const ORG_MENUS: MenuItem[] = [
  { label: '내 신청현황', href: '/mypage/requests', icon: ClipboardList, desc: '접수·진행·완료 상태 확인' },
  { label: '새 예약 만들기', href: '/request', icon: Building2, desc: '청소/방역 예약 신청' },
  { label: '담당자 연락처', href: '/mypage/contacts', icon: Phone, desc: '지점/담당자 연락' },
  { label: 'A/S 요청', href: '/mypage/as', icon: Wrench, desc: '완료 후 하자 접수' },
  { label: '서비스 평가하기', href: '/mypage/review', icon: Star, desc: '만족도/의견 제출' },
  { label: '결과서 다운로드', href: '/mypage/reports', icon: FileDown, desc: '작업결과서/영수증' },
];

const COOP_MENUS: MenuItem[] = [
  { label: '배정된 일감 확인', href: '/mypage/jobs', icon: ClipboardList, desc: '오늘·주간 작업 확인' },
  { label: '교육 공지', href: '/partner/education', icon: Megaphone, desc: '교육 일정/자료' },
  { label: '내 실적 보기', href: '/partner/performance', icon: LineChart, desc: '매출/평가/정산' },
  { label: '본사 연락처', href: '/partner/contacts', icon: Headphones, desc: '본사지원/헬프데스크' },
];

// ===== API 타입 =====
type ApproveAPI = {
  is_success: boolean;
  data?: {
    email: string;
    name: string;
    company?: { status: 'submitted'|'reviewing'|'approved'|'rejected' } | null;
  };
};

type CompanyLite = { id: number; name: string };
type MyCompaniesAPI = {
  is_success: boolean;
  items: CompanyLite[];
};

// ===== 공용 UI =====
function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((m) => (
        <Link key={m.href} href={m.href} className="group">
          <div className="h-full rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all group-hover:shadow-md group-hover:border-black/20">
            <div className="flex items-center gap-3">
              <m.icon className="size-6" />
              <div className="text-base font-semibold">{m.label}</div>
            </div>
            {m.desc && <p className="mt-2 text-sm text-neutral-600">{m.desc}</p>}
            <Button className="mt-4">이동</Button>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ===== 메인 페이지 =====
export default function MyPage() {
 const { data: session, status } = useSession();
  const isCompany = session?.user?.role === 'COMPANY';

  // (1) 자활기업 승인 여부 조회 (있으면 메뉴 노출, 없으면 안내)
  const { data: approvRes } = useQuery({
    queryKey: ['partnerApproval', session?.user?.email, session?.user?.role],
    enabled: !!session?.user?.email && isCompany,
    queryFn: async (): Promise<ApproveAPI> => {
      const url = `${baseUrl}/users/approv?email=${encodeURIComponent(session?.user!.email!)}&onlyApproved=1`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok && res.status !== 404) throw new Error('NETWORK_ERROR');
      return res.json();
    },
    staleTime: 60_000,
  });

  // (2) 승인된 업체 목록 가져오기
  const {
    data: companyListRes,
    isLoading: companyLoading,
    isError: companyError,
  } = useQuery({
    queryKey: ['myApprovedCompanies', session?.user?.email, session?.user?.role],
    enabled: !!session?.user?.email && isCompany,
    queryFn: async (): Promise<MyCompaniesAPI> => {
      // 백엔드에서 로그인/권한을 통해 현재 사용자 소속의 "승인된" 업체만 내려주는 API를 가정
      // 예: GET /company/my-approved  (header의 세션/토큰으로 식별)
      const res = await fetchWithAuth(`${baseUrl}/company/companies`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const companies: CompanyLite[] = companyListRes?.items ?? [];

  // (3) 선택된 업체 상태: { id, name } 객체로 관리 (로컬 저장 포함)
  const [selectedCompany, setSelectedCompany] = useState<CompanyLite | null>(null);

  // 최초 로드 시 localStorage 복원
  useEffect(() => {
    if (!isCompany) {
      localStorage.setItem('selected_company','');
      return;
    }
    const saved = localStorage.getItem('selected_company');
    if (saved) {
      try {
        setSelectedCompany(JSON.parse(saved) as CompanyLite);
      } catch {}
    }
  }, [isCompany]);

  // 목록이 1개뿐이고 선택이 없을 때 자동 선택
  useEffect(() => {
    if (!isCompany) return;
    if (selectedCompany) return;
    if (companies.length === 1) {
      const comp = companies[0];
      setSelectedCompany(comp);
      localStorage.setItem('selected_company', JSON.stringify(comp));
    }
  }, [isCompany, companies, selectedCompany]);

  // (4) 타이틀/서브타이틀/메뉴 결정
  const { title, subtitle, menus } = useMemo(() => {
    // 기관회원
    if (session?.user?.role === 'CLIENT') {
      return {
        title: '기관회원 마이페이지',
        subtitle: '예약·결과서·평가 등 기관 전용 메뉴를 이용하세요.',
        menus: ORG_MENUS,
      };
    }

    // 자활기업: 승인 결과 체크
    if (isCompany) {
      if (approvRes && approvRes.is_success === false) {
        return {
          title: '마이페이지',
          subtitle: '승인되지 않은 조합 회원입니다. 승인 문의는 관리자에게 하시면 됩니다.',
          menus: [] as MenuItem[],
        };
      }
      // 승인된 경우
      return {
        title: '자활기업 파트너 마이페이지',
        subtitle: '배정 일감과 교육 공지, 실적 관리를 확인하세요.',
        menus: COOP_MENUS,
      };
    }

    // 기본
    return {
      title: '마이페이지',
      subtitle: '회원 유형이 확인되지 않았습니다. 프로필에서 회원 유형을 설정해주세요.',
      menus: [] as MenuItem[],
    };
  }, [session?.user?.role, approvRes, isCompany]);

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-neutral-600">{subtitle}</p>
          </div>

          {/* 자활기업 전용: 승인된 업체 선택 영역 */}
          {isCompany && (
            <div className="mb-6 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-neutral-800">
                    소속 업체 선택
                  </label>

                  <select
                    value={selectedCompany?.id ?? ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const c = companies.find((x) => x.id === id);
                      if (c) {
                        const comp = { id: c.id, name: c.name };
                        setSelectedCompany(comp);
                        localStorage.setItem('selected_company', JSON.stringify(comp));
                      } else {
                        setSelectedCompany(null);
                        localStorage.removeItem('selected_company');
                      }
                    }}
                    disabled={companyLoading}
                    className="h-10 min-w-[260px] rounded-lg border border-neutral-300 bg-white px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>
                      {companyLoading
                        ? '업체 불러오는 중…'
                        : companyError
                        ? '업체 불러오기 실패'
                        : companies.length
                        ? '업체를 선택하세요'
                        : '승인된 업체가 없습니다'}
                    </option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-neutral-700">
                  {selectedCompany ? (
                    <>
                      선택된 업체: <b>{selectedCompany.name}</b>{' '}
                      <span className="text-neutral-400">(ID: {selectedCompany.id})</span>
                    </>
                  ) : (
                    <span className="text-neutral-500">아직 업체가 선택되지 않았습니다.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 메뉴 또는 안내 */}
          {menus.length > 0 ? (
            <MenuGrid items={menus} />
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-neutral-600">
              표시할 메뉴가 없습니다.
              <div className="mt-4">
                <Link href="/mypage/profile">
                  <Button>프로필로 이동</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
