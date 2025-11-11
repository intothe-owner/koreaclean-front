// components/app/Achievements.tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, MapPinned } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts';

type Monthly = { m: string; cnt: number };
type RegionItem = { name: string; value: number };

type AchievementsProps = {
  /** 누적 서비스 '경로당' 건수 */
  totalCenters?: number;
  /** 연간 월별 서비스 건수 (합산하여 연간서비스건수 계산) */
  monthlyCounts?: Monthly[];
  /** 참여 기업 수 */
  companyCount?: number;
  /** 지역 분포 */
  regions?: RegionItem[];

  /** ===== 색상 커스터마이즈 옵션 ===== */
  /** AreaChart 선 색 */
  areaStrokeColor?: string;            // default: '#111827'
  /** AreaChart 그라디언트 시작/끝 불투명도 */
  areaStartOpacity?: number;           // default: 0.25
  areaEndOpacity?: number;             // default: 0
  /** AreaChart 그라디언트 채움 색 (미지정 시 stroke 색을 사용) */
  areaFillColor?: string;              // default: areaStrokeColor
  /** Grid/축 색 */
  gridStroke?: string;                 // default: '#eee'
  axisTickColor?: string;              // default: '#6b7280' (neutral-500)
  /** BarChart 각 막대 색 배열 */
  barColors?: string[];                // default 팔레트 사용
};

const defaultMonthly: Monthly[] = [
  { m: '01', cnt: 62 }, { m: '02', cnt: 74 }, { m: '03', cnt: 86 }, { m: '04', cnt: 95 },
  { m: '05', cnt: 110 }, { m: '06', cnt: 128 }, { m: '07', cnt: 140 }, { m: '08', cnt: 152 },
  { m: '09', cnt: 160 }, { m: '10', cnt: 172 }, { m: '11', cnt: 181 }, { m: '12', cnt: 195 },
];

const defaultRegions: RegionItem[] = [
  { name: '서울', value: 420 },
  { name: '부산', value: 260 },
  { name: '경기', value: 510 },
  { name: '대구', value: 140 },
  { name: '광주', value: 120 },
];

/** 기본 팔레트 (막대 색상용) */
const DEFAULT_BAR_PALETTE = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
];

export default function Achievements({
  totalCenters = 523,
  monthlyCounts = defaultMonthly,
  companyCount = 80,
  regions = defaultRegions,

  // 색상 옵션 기본값
  areaStrokeColor = '#111827', // neutral-900
  areaStartOpacity = 0.25,
  areaEndOpacity = 0,
  areaFillColor,
  gridStroke = '#eee',
  axisTickColor = '#6b7280',
  barColors = DEFAULT_BAR_PALETTE,
}: AchievementsProps) {
  const annualServiceCount = useMemo(
    () => monthlyCounts.reduce((sum, it) => sum + (Number(it.cnt) || 0), 0),
    [monthlyCounts]
  );

  const stats = useMemo(
    () => [
      {
        key: 'centers',
        icon: <MapPinned className="w-4 h-4" />,
        label: '누적 서비스 경로당',
        value: `${totalCenters.toLocaleString()}곳`,
        sub: '전국 기준',
      },
      {
        key: 'annual',
        icon: <TrendingUp className="w-4 h-4" />,
        label: '연간서비스건수',
        value: `${annualServiceCount.toLocaleString()}건`,
        sub: '최근 12개월',
      },
      {
        key: 'companies',
        icon: <Users className="w-4 h-4" />,
        label: '참여 기업',
        value: `${companyCount.toLocaleString()}개`,
        sub: '전국 파트너',
      },
    ],
    [totalCenters, annualServiceCount, companyCount]
  );

  // AreaChart gradient id를 안정적으로 만들기 위해 key 고정
  const gradientId = 'achv-area-gradient';

  // Area 채움 색 (미지정 시 선 색을 사용)
  const resolvedAreaFill = areaFillColor || areaStrokeColor;

  return (
    <div className="space-y-12">
      {/* 1) 타이틀 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">간단한 성과 현황</h2>
        <p className="text-neutral-600 mt-1">
          월별 추이와 지역 분포, 핵심 KPI(경로당·연간건수·참여기업)를 한눈에 확인하세요.
        </p>
      </section>

      {/* 2) KPI 카드 — 3개만 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 text-neutral-700 mb-2">
              {s.icon}
            </div>
            <div className="text-sm text-neutral-600">{s.label}</div>
            <div className="text-2xl font-extrabold tracking-tight text-neutral-900 mt-0.5">{s.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </section>

      {/* 3) 차트: 월별 서비스 추이 (색상 커스터마이즈) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-neutral-900">월별 서비스 추이</div>
            <div className="text-xs text-neutral-500">최근 12개월</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCounts} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={resolvedAreaFill} stopOpacity={areaStartOpacity} />
                    <stop offset="95%" stopColor={resolvedAreaFill} stopOpacity={areaEndOpacity} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="m" tick={{ fontSize: 12, fill: axisTickColor }} />
                <YAxis tick={{ fontSize: 12, fill: axisTickColor }} />
                <Tooltip
                  formatter={(v: any) => [`${v}건`, '건수']}
                  labelFormatter={(l) => `${l}월`}
                />
                <Area
                  type="monotone"
                  dataKey="cnt"
                  stroke={areaStrokeColor}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4) 차트: 지역별 분포 (막대 개별 색상) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-neutral-900 flex items-center gap-2">
              <MapPinned className="w-4 h-4" /> 지역별 분포
            </div>
            <div className="text-xs text-neutral-500">상위 5개 지역</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regions} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisTickColor }} />
                <YAxis tick={{ fontSize: 12, fill: axisTickColor }} />
                <Tooltip formatter={(v: any) => [`${v}건`, '건수']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {regions.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

    </div>
  );
}
