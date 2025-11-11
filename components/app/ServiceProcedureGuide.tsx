// components/app/ServiceProcedureGuide.tsx
'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FileText, ClipboardCheck, Calendar, Sparkles, ShieldCheck } from 'lucide-react';

export type ServiceStep = {
  title: string;
  desc: string;
  /** 아이콘을 커스터마이징하려면 전달 (없으면 인덱스에 맞춰 기본 아이콘 노출) */
  icon?: ReactNode;
};

const DEFAULT_STEPS: ServiceStep[] = [
  { title: '온라인 서비스 신청', desc: '기관/담당자·주소·일정·특이사항 입력' },
  { title: '담당자 현장 방문 및 견적', desc: '현장 면적 파악과 구조 파악' },
  { title: '계약 체결 및 일정 조율', desc: '접수 확인 후 적정 업체 배정 및 일정 협의' },
  { title: '전문 청소 시행', desc: '작업 진행 과정 실시간 모니터링' },
  { title: '완료 보고서 제출', desc: '사진 포함 결과보고서 업로드·공유' },
  { title: '고객 만족도 조사', desc: '사후관리, 만족도 조사 및 개선' },
  { title: '사후 A/S 제공', desc: '사후관리, 만족도 조사 및 개선' },
];

export default function ServiceProcedureGuide({
  steps = DEFAULT_STEPS,
  showHeader = true,
  title = '서비스 절차 안내',
  subtitle = '접수부터 사후관리까지 모든 과정을 표준화하여 빠르고 투명하게 운영합니다.',
  className = '',
}: {
  steps?: ServiceStep[];
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <section className={className}>
      {showHeader && (
        <div className="mb-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h2>
          <p className="text-neutral-600 mt-1">{subtitle}</p>
        </div>
      )}

      <ol className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {steps.map((s, idx) => (
          <motion.li
            key={`${s.title}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: 0.03 * idx }}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="inline-flex items-center justify-center w-20 h-8 rounded-full bg-neutral-900 text-white text-sm font-bold">
              {idx + 1} 단계
            </div>
            <div className="mt-3 font-semibold text-neutral-900 flex items-center gap-2">
              <StepIcon index={idx} override={s.icon} /> {s.title}
            </div>
            <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{s.desc}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

function StepIcon({ index, override }: { index: number; override?: ReactNode }) {
  if (override) return <>{override}</>;
  switch (index) {
    case 0:
      return <FileText className="w-4 h-4" />;
    case 1:
      return <ClipboardCheck className="w-4 h-4" />;
    case 2:
      return <Calendar className="w-4 h-4" />;
    case 3:
      return <Sparkles className="w-4 h-4" />;
    case 4:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      );
    default:
      return <ShieldCheck className="w-4 h-4" />;
  }
}
