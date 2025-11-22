// components/app/QualityAssurancePolicy.tsx
'use client';

import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
} from 'lucide-react';
import React from 'react';
export type PolicyPoint = { title: string; points: string[]; icon?: React.ReactNode };

const DEFAULT_SECTIONS: PolicyPoint[] = [
  {
    title: '보증 범위',
    points: [
      '표준 체크리스트 미이행 항목의 무상 보완',
      '작업 48시간 내 접수된 품질 이슈 우선 대응',
      '안전수칙 위반·손상 발생 시 처리 절차 가동',
    ],
    icon: <ShieldCheck className="w-5 h-5"/>,
  },
  {
    title: 'A/S SLA',
    points: [
      '접수 24시간 내 1차 연락',
      '평균 48시간 내 현장 조치',
      '재발 방지 조치 보고서 공유',
    ],
    icon: <Clock className="w-5 h-5"/>,
  },
  {
    title: '제외/제한',
    points: [
      '사전에 고지되지 않은 특수 오염/위험물',
      '설비 노후·결함으로 인한 성능 한계',
      '현장 출입 제한·안전 미준수로 인한 지연',
    ],
    icon: <AlertTriangle className="w-5 h-5"/>,
  },
];

export default function QualityAssurancePolicy({ title = '품질 보증 정책', subtitle = '표준 품질 기준과 A/S 정책을 통해 서비스 만족을 보장합니다.', sections = DEFAULT_SECTIONS }: { title?: string; subtitle?: string; sections?: PolicyPoint[] }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h2>
        <p className="text-neutral-600 mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <PolicyCard key={sec.title} icon={sec.icon} title={sec.title} points={sec.points} />
        ))}
      </div>

      <div className="mt-6">
  <div className="font-semibold text-neutral-900 mb-3">A/S 처리 플로우</div>

  {(() => {
    const steps = [
      { n: 1, title: '접수', desc: '담당자/플랫폼에서 A/S 요청' },
      { n: 2, title: '확인', desc: '현황 파악·사진 요청·일정 협의' },
      { n: 3, title: '조치', desc: '현장 재방문·보완 수행' },
      { n: 4, title: '검수', desc: '담당자 확인 및 추가 보완' },
      { n: 5, title: '종결', desc: '보고서 공유·재발 방지 안내' },
    ];

    // PC용 위치: 3열 2행
    // 1 2 3
    //   4 5
    const mdPos: Record<number, string> = {
  1: 'md:row-start-1 md:col-start-1',
  2: 'md:row-start-1 md:col-start-2',
  3: 'md:row-start-1 md:col-start-3',
  4: 'md:row-start-2 md:col-start-3', // 3번 아래(오른쪽)
  5: 'md:row-start-2 md:col-start-2', // 2번 아래(가운데)
};

    return (
      <ol className="grid grid-cols-1 md:grid-cols-3 md:auto-rows-[1fr] gap-4 md:gap-x-6 md:gap-y-8">
        {steps.map((s, idx) => {
          const isLast = idx === steps.length - 1;
          const posClass = mdPos[s.n] ?? '';

          return (
            <React.Fragment key={s.n}>
              <FlowStep
                n={s.n}
                title={s.title}
                desc={s.desc}
                isLast={isLast}
                className={posClass}
              />

              {/* 모바일 전용 ↓ (카드 바깥) */}
              {!isLast && (
                <li className="md:hidden flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-neutral-900" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    );
  })()}
</div>


      {/* <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-700"><FileText className="w-4 h-4"/> 품질 보증 약관 (PDF) / 체크리스트 (XLSX)</div>
        <div className="flex gap-2">
          <button className="rounded-xl bg-white border border-neutral-300 text-neutral-800 px-4 py-2 text-sm font-semibold hover:bg-neutral-50">약관 보기</button>
          <button className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800">체크리스트 다운</button>
        </div>
      </div> */}
    </section>
  );
}

function PolicyCard({ icon, title, points }: { icon?: React.ReactNode; title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-2 font-semibold text-neutral-900">{icon} {title}</div>
      <ul className="mt-2 space-y-1">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-neutral-700"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5"/> {p}</li>
        ))}
      </ul>
    </div>
  );
}

function FlowStep({
  n,
  title,
  desc,
  isLast = false,
  className = '',
}: {
  n: number;
  title: string;
  desc: string;
  isLast?: boolean;
  className?: string;
}) {
  // 화살표 방향 결정 (PC용)
  // 1,2 : →
  // 3 : ↓  (3 → 4)
  // 4 : ←  (4 → 5)
  let arrow: 'right' | 'down' | 'left' | null = null;

  if (!isLast) {
    if (n === 3) arrow = 'down';
    else if (n === 4) arrow = 'left';
    else arrow = 'right';
  }

  return (
    <li
      className={`relative rounded-2xl border border-neutral-200 bg-white p-5 ${className}`}
    >
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-bold">
        {n}
      </div>
      <div className="mt-3 font-semibold text-neutral-900">{title}</div>
      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{desc}</p>

      {/* 데스크탑 화살표 */}
      {arrow && (
        <div className="hidden md:block">
          {arrow === 'right' && (
            <div className="absolute -right-5 top-1/2 -translate-y-1/2">
              <ArrowRight className="w-5 h-5 text-neutral-900" />
            </div>
          )}
          {arrow === 'left' && (
            <div className="absolute -left-5 top-1/2 -translate-y-1/2">
              <ArrowLeft className="w-5 h-5 text-neutral-900" />
            </div>
          )}
          {arrow === 'down' && (
            <div className="absolute left-1/2 -bottom-6 -translate-x-1/2">
              <ArrowDown className="w-5 h-5 text-neutral-900" />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

