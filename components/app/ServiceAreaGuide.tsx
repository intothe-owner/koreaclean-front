// components/app/ServiceAreaGuide.tsx
'use client';

import { MapPin } from 'lucide-react';

export type RegionItem = {
  name: string;
  status: '가동 중' | '준비 중' | '확대 예정';
};

const DEFAULT_REGIONS: RegionItem[] = [
  { name: '서울특별시', status: '가동 중' },
  { name: '부산광역시', status: '가동 중' },
  { name: '경기도', status: '가동 중' },
  { name: '대구광역시', status: '준비 중' },
  { name: '광주광역시', status: '확대 예정' },
];

export default function ServiceAreaGuide({ regions = DEFAULT_REGIONS, title = '서비스 지역', subtitle = '전국 단위로 순차 확대 중입니다. 상세 지도는 ‘홈 > 주요 서비스 지역’에서 확인하세요.' }: { regions?: RegionItem[]; title?: string; subtitle?: string }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h2>
        <p className="text-neutral-600 mt-1">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <div className="relative aspect-[16/9] w-full rounded-2xl border border-dashed border-neutral-300 bg-white/60 grid place-items-center text-neutral-400">
            <span className="text-sm">지도(이미지)</span>
          </div>
        </div>
        <div className="space-y-2">
          {regions.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-neutral-500"/> <span className="text-sm text-neutral-800">{r.name}</span></div>
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                r.status === '가동 중' ? 'bg-emerald-100 text-emerald-700' : r.status === '준비 중' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'
              }`}>{r.status}</span>
            </div>
          ))}
          <div className="text-xs text-neutral-500">* 신규 지역 제안은 ‘문의하기’로 접수해주세요.</div>
        </div>
      </div>
    </section>
  );
}
