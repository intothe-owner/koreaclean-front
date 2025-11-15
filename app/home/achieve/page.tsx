// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useEffect, useState } from 'react';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,           // ✅ 막대별 색상 적용을 위한 Cell 추가
} from 'recharts';

type RegionItem = {
  region: string;
  total: number;
};

type CompanyItem = {
  company_id: number;
  company_name: string;
  total: number;
};

// 지역별 색상 팔레트
const REGION_COLORS = [
  '#0ea5e9', // sky-500
  '#22c55e', // green-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#e11d48', // rose-600
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
];

export default function Achieve() {
  const items: TabItem[] = [
    { label: '서비스 개요 소개', href: '/home/intro' },
    { label: '주요 서비스 지역', href: '/home/area' },
    { label: '연락처 및 위치', href: '/home/contact' },
    { label: '성과 현황', href: '/home/achieve' },
    { label: '고객후기', href: '/home/review' },
  ];
  const [tab, setTab] = useState<string>('/home/achieve');

  // 지역별 요약 데이터
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loadingRegion, setLoadingRegion] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  // 선택된 지역 + 해당 업체 목록
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // ====== 지역별 그래프 데이터 불러오기 ======
  const fetchRegionSummary = async () => {
    try {
      setLoadingRegion(true);
      setRegionError(null);

      const res = await fetch('/backend/count/region-summary?metric=REQ_TOTAL');
      if (!res.ok) throw new Error(`지역 요약 조회 실패: ${res.status}`);

      const json = await res.json();

      const rows: RegionItem[] = (json.rows || []).map((r: any) => ({
        region: String(r.region),
        total: Number(r.total ?? 0),
      }));

      setRegions(rows);

      // 처음 한 번은 가장 건수가 많은 지역 자동 선택
      if (rows.length > 0 && !selectedRegion) {
        const firstRegion = rows[0].region;
        setSelectedRegion(firstRegion);
        fetchCompanyList(firstRegion); // 첫 지역 업체 목록도 같이 로딩
      }
    } catch (err: any) {
      console.error('지역 요약 조회 오류:', err);
      setRegionError(err?.message || '지역 요약 조회 중 오류가 발생했습니다.');
    } finally {
      setLoadingRegion(false);
    }
  };

  // ====== 특정 지역의 업체 리스트 불러오기 ======
  const fetchCompanyList = async (region: string) => {
    try {
      setLoadingCompany(true);
      setCompanyError(null);

      const params = new URLSearchParams();
      params.set('region', region);
      params.set('metric', 'REQ_TOTAL');

      const res = await fetch(`/backend/count/company-by-region?${params.toString()}`);
      if (!res.ok) throw new Error(`업체 목록 조회 실패: ${res.status}`);

      const json = await res.json();

      const rows: CompanyItem[] = (json.rows || []).map((r: any) => ({
        company_id: Number(r.company_id ?? 0),
        company_name: String(r.company_name ?? ''),
        total: Number(r.total ?? 0),
      }));

      setCompanies(rows);
    } catch (err: any) {
      console.error('업체 목록 조회 오류:', err);
      setCompanyError(err?.message || '업체 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoadingCompany(false);
    }
  };

  // 첫 로딩 시 지역 데이터 불러오기
  useEffect(() => {
    fetchRegionSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지역 클릭 처리
  const handleSelectRegion = (region: string) => {
    setSelectedRegion(region);
    fetchCompanyList(region);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      {/* 헤더 */}
      <Header />

      <MainBannerSwiper
        src="/backend/banners/main-banners"
        height={560}
        rounded="rounded-3xl"
        autoplayDelayMs={5000}
        loop
        showDots
        showNav
      />

      {/* 상단 서비스 탭 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* 성과 현황 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-16 space-y-6">
          <div className="flex flex-col gap-1 mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              지역별 서비스 건수 & 업체별 집계
            </h2>
            <p className="text-sm text-gray-500">
              상단 그래프에서 지역을 클릭하면, 해당 지역에서 활동한 업체별 서비스 건수를 하단에서 확인할 수 있습니다.
            </p>
          </div>

          {/* 1) 지역별 전체 서비스 건수 그래프 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-4 md:px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  지역별 전체 서비스 건수
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                  서비스 요청(REQ_TOTAL)을 기준으로 시도 단위 건수를 집계했습니다.
                </p>
              </div>
            </div>

            {regionError && (
              <p className="text-sm text-red-600 mb-2">{regionError}</p>
            )}

            {loadingRegion && (
              <p className="text-sm text-gray-500">지역 데이터를 불러오는 중입니다…</p>
            )}

            {!loadingRegion && regions.length === 0 && !regionError && (
              <p className="text-sm text-gray-500">
                집계된 지역 데이터가 없습니다. 통계 데이터(seed)가 있는지 확인해주세요.
              </p>
            )}

            {!loadingRegion && regions.length > 0 && (
              <div className="w-full h-[260px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regions}
                    margin={{ top: 8, right: 8, left: 0, bottom: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="total"
                      // 막대 클릭 시 지역 선택
                      onClick={(data) => {
                        const rg =
                          (data && (data as any).payload?.region) || '';
                        if (rg) handleSelectRegion(rg);
                      }}
                    >
                      {regions.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.region}`}
                          fill={REGION_COLORS[index % REGION_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 2) 선택된 지역의 업체별 건수 목록 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-4 md:px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  {selectedRegion ? `${selectedRegion} 지역 업체별 서비스 건수` : '업체별 서비스 건수'}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                  선택된 지역에서 각 업체가 처리한 서비스 건수(REQ_TOTAL)입니다.
                </p>
              </div>
            </div>

            {selectedRegion == null && (
              <p className="text-sm text-gray-500">
                상단 그래프에서 지역을 먼저 선택해 주세요.
              </p>
            )}

            {companyError && (
              <p className="text-sm text-red-600 mb-2">{companyError}</p>
            )}

            {loadingCompany && selectedRegion && (
              <p className="text-sm text-gray-500">
                {selectedRegion} 지역 업체 데이터를 불러오는 중입니다…
              </p>
            )}

            {!loadingCompany &&
              selectedRegion &&
              companies.length === 0 &&
              !companyError && (
                <p className="text-sm text-gray-500">
                  {selectedRegion} 지역에 대한 업체별 데이터가 없습니다.
                </p>
              )}

            {!loadingCompany && selectedRegion && companies.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                        업체명
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                        서비스 건수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr
                        key={c.company_id}
                        className="border-b border-gray-100 hover:bg-gray-50/60"
                      >
                        <td className="px-3 py-2 text-gray-800">
                          {c.company_name}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {c.total.toLocaleString()} 건
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
