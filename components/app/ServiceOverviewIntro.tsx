// components/app/ServiceOverviewIntro.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Shield, Clock, Sparkles } from 'lucide-react';

export default function ServiceOverviewIntro() {
  return (
    <div className="space-y-16">
      {/* 1) 헤드라인 + 리드문 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
            서비스 개요
          </h2>
          <p className="text-neutral-600 leading-relaxed">
            경로당 특화 청소를 중심으로 예약 → 배정 → 작업 → 보고서 → 사후관리까지 전 과정을 한 곳에서 관리합니다.
            깔끔한 UI와 표준화된 프로세스로 지자체 담당자와 수행업체 모두가 편리하게 이용할 수 있도록 설계했습니다.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white text-xs md:text-sm px-4 py-2">
              <Sparkles className="w-4 h-4" /> 경로당 특화 표준 프로세스
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-300 text-neutral-700 text-xs md:text-sm px-4 py-2">
              <Shield className="w-4 h-4" /> 책임 A/S
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-300 text-neutral-700 text-xs md:text-sm px-4 py-2">
              <Clock className="w-4 h-4" /> 일정/보고 자동화
            </span>
          </div>
        </div>
        {/* 이미지 플레이스홀더 */}
        <div className="relative aspect-[16/10] w-full rounded-2xl border border-dashed border-neutral-300 bg-white/60 grid place-items-center text-neutral-400">
          <span className="text-sm">이미지</span>
        </div>
      </section>

      {/* 2) 핵심 가치(Features) */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="전문화된 인력"
            desc="경로당 특화 교육 이수 인력이 표준 체크리스트로 작업합니다."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="책임 A/S"
            desc="작업 후 불편 사항은 A/S 정책에 따라 신속 대응합니다."
          />
          <FeatureCard
            icon={<Clock className="w-5 h-5" />}
            title="간편 예약/관리"
            desc="지자체 포털에서 한 번에 신청·일정 관리·결과 확인이 가능합니다."
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="투명한 보고"
            desc="사진 첨부 결과보고서와 만족도 평가로 품질을 상시 모니터링합니다."
          />
        </div>
      </section>

      {/* 3) 서비스 프로세스 */}
      <section>
        <h3 className="text-xl font-bold mb-4">서비스 프로세스</h3>
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Step order={1} title="온라인 신청" desc="기관/담당자·주소·일정 입력" />
          <Step order={2} title="업체 배정" desc="관리자 검토 후 적정 업체 배정" />
          <Step order={3} title="현장 수행" desc="체크리스트 기준 작업 및 기록" />
          <Step order={4} title="결과 보고" desc="사진 포함 보고서 업로드" />
          <Step order={5} title="사후관리" desc="만족도 조사·A/S 대응" />
        </ol>
      </section>

      {/* 4) 성과 지표(Stats) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="누적 서비스" value="1,234건" />
        <StatCard label="참여 기업" value="80개" />
        <StatCard label="만족도" value="4.8/5" />
        <StatCard label="A/S 처리" value="98%" />
      </section>

      {/* 5) 콜투액션 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h4 className="text-lg md:text-xl font-semibold text-neutral-900">지자체 경로당 예약부터 결과보고까지, 한 곳에서.</h4>
          <p className="text-neutral-600 mt-1">간편 신청으로 일정 잡고, 사진 보고서로 품질을 확인하세요.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl bg-neutral-900 text-white px-5 py-3 text-sm font-semibold hover:bg-neutral-800">
            지자체 경로당 예약하기
          </button>
          <button className="rounded-xl bg-white border border-neutral-300 text-neutral-800 px-5 py-3 text-sm font-semibold hover:bg-neutral-50">
            청소기업 로그인
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 mb-3">
        {icon}
      </div>
      <div className="font-semibold text-neutral-900">{title}</div>
      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ order, title, desc }: { order: number; title: string; desc: string }) {
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-bold">
        {order}
      </div>
      <div className="mt-3 font-semibold text-neutral-900">{title}</div>
      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{desc}</p>
    </li>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
      <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">{value}</div>
      <div className="text-xs md:text-sm text-neutral-600 mt-1">{label}</div>
    </div>
  );
}
