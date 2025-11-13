// components/app/UsageGuide.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ClipboardCheck, Calendar } from 'lucide-react';

export type GuideStep = { n: number; title: string; desc: string };

const RESERVE_STEPS: GuideStep[] = [
  { n: 1, title: '신청서 작성', desc: '기관·담당자·연락처·주소·희망 일정 입력' },
  { n: 2, title: '접수·배정', desc: '관리자 검토 후 업체 배정, 일정 확정' },
  { n: 3, title: '안내 수신', desc: '문자/이메일로 일정 및 준비사항 안내' },
];

const RESULT_STEPS: GuideStep[] = [
  { n: 1, title: '작업 완료', desc: '현장 체크리스트 완료 및 사진 촬영' },
  { n: 2, title: '보고서 업로드', desc: '플랫폼에 결과보고서 등록' },
  { n: 3, title: '확인/다운로드', desc: '담당자 계정에서 보고서 열람·저장·A/S 접수' },
];

export default function UsageGuide({ title = '이용 안내', subtitle = '예약 방법과 결과 확인 방법을 단계별로 안내합니다.', reserveSteps = RESERVE_STEPS, resultSteps = RESULT_STEPS, screenshotCount = 3 }: { title?: string; subtitle?: string; reserveSteps?: GuideStep[]; resultSteps?: GuideStep[]; screenshotCount?: number }) {
  const [tab, setTab] = useState<'reserve' | 'result'>('reserve');

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{title}</h2>
        <p className="text-neutral-600 mt-1">{subtitle}</p>
      </div>

      <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1">
        <button onClick={() => setTab('reserve')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${tab === 'reserve' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-50'}`}>예약 방법</button>
        <button onClick={() => setTab('result')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${tab === 'result' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-50'}`}>결과 확인 방법</button>
      </div>

      <AnimatePresence initial={false}>
        {tab === 'reserve' && (
          <motion.div key="reserve" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {reserveSteps.map((s) => (
              <GuideStepCard key={s.n} step={s} />
            ))}
          </motion.div>
        )}
        {tab === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {resultSteps.map((s) => (
              <GuideStepCard key={s.n} step={s} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: screenshotCount }).map((_, i) => (
          <div key={i} className="aspect-[16/10] rounded-2xl border border-dashed border-neutral-300 bg-white/60 grid place-items-center text-neutral-400 text-sm">화면샷 {i + 1}</div>
        ))}
      </div> */}
    </section>
  );
}

function GuideStepCard({ step }: { step: GuideStep }) {
  const Icon = step.n === 1 ? FileText : step.n === 2 ? ClipboardCheck : Calendar;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-bold">{step.n}</div>
      <div className="mt-3 font-semibold text-neutral-900 flex items-center gap-2">
        <Icon className="w-4 h-4"/> {step.title}
      </div>
      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{step.desc}</p>
    </div>
  );
}
