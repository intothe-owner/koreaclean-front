// components/app/ServiceOverviewIntro.tsx
'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowDown,
  ArrowLeft,   // ⬅ 추가
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Fragment } from 'react';

export default function ServiceOverviewIntro() {
  const router = useRouter();
  return (
    <div className="space-y-16">
      {/* 1) 헤드라인 + 리드문 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
            서비스 개요
          </h2>
          <p className="text-neutral-600 leading-relaxed">
            경로당 특화 청소를 중심으로 예약 → 배정 → 작업 → 보고서 → 사후관리까지 전 과정을 한 곳에서
            관리합니다. 깔끔한 UI와 표준화된 프로세스로 지자체 담당자와 수행업체 모두가 편리하게 이용할 수
            있도록 설계했습니다.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-300 text-neutral-700 text-xs md:text-sm px-4 py-2">
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

        {/* 이미지 */}
        <div className="relative aspect-[16/10] w-full rounded-2xl border border-dashed border-neutral-300 bg-white/60 overflow-hidden">
          <Image src="/images/service.png" fill alt="서비스 개요" className="object-cover" />
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

        {(() => {
          const steps = [
            { order: 1, title: '온라인 신청', desc: '기관/담당자·주소·일정 입력' },
            { order: 2, title: '업체 배정', desc: '관리자 검토 후 적정 업체 배정' },
            { order: 3, title: '현장 수행', desc: '체크리스트 기준 작업 및 기록' },
            { order: 4, title: '결과 보고', desc: '사진 포함 보고서 업로드' },
            { order: 5, title: '사후관리', desc: '만족도 조사·A/S 대응' },
          ];

          // PC 위치 지정: 1(1,1) 2(1,2) 3(1,3) / 5(2,2) 4(2,3)
          const mdPos: Record<number, string> = {
            1: 'md:row-start-1 md:col-start-1',
            2: 'md:row-start-1 md:col-start-2',
            3: 'md:row-start-1 md:col-start-3',
            4: 'md:row-start-2 md:col-start-3', // ⬅ 4번을 오른쪽 아래
            5: 'md:row-start-2 md:col-start-2', // ⬅ 5번은 가운데 아래
          };

          return (
            <ol className="grid grid-cols-1 md:grid-cols-3 md:auto-rows-[1fr] gap-4 md:gap-x-6 md:gap-y-10">
              {steps.map((s, idx) => (
                <Fragment key={s.order}>
                  <Step
                    order={s.order}
                    title={s.title}
                    desc={s.desc}
                    isLast={idx === steps.length - 1}
                    className={mdPos[s.order] ?? ''}
                  />

                  {/* 모바일 전용 ↓ : 카드 바깥, 카드와 카드 사이에 */}
                  {idx !== steps.length - 1 && (
                    <li className="md:hidden flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-neutral-900" />
                    </li>
                  )}
                </Fragment>
              ))}
            </ol>
          );
        })()}
      </section>
      {/* 5) 콜투액션 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h4 className="text-lg md:text-xl font-semibold text-neutral-900">
            지자체 경로당 예약부터 결과보고까지, 한 곳에서.
          </h4>
          <p className="text-neutral-600 mt-1">간편 신청으로 일정 잡고, 사진 보고서로 품질을 확인하세요.</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="rounded-xl bg-white border border-neutral-300 text-neutral-800 px-5 py-3 text-sm font-semibold hover:bg-neutral-50"
            onClick={()=>{router.push('/request')}}
            >
            지자체 경로당 예약하기
          </button>
          <button 
            className="rounded-xl bg-white border border-neutral-300 text-neutral-800 px-5 py-3 text-sm font-semibold hover:bg-neutral-50"
            onClick={()=>{router.push('/login')}}
            >
            청소기업 로그인
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
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

function Step({
  order,
  title,
  desc,
  isLast = false,
  className = '',
}: {
  order: number;
  title: string;
  desc: string;
  isLast?: boolean;
  className?: string;
}) {
  return (
    <li
      className={`relative rounded-2xl border border-neutral-200 bg-white p-5 ${className}`}
    >
      {/* 번호 원 */}
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-bold">
        {order}
      </div>

      <div className="mt-3 font-semibold text-neutral-900">{title}</div>
      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{desc}</p>

      {/* 데스크탑용 화살표 (PC에서만 보임) */}
      {!isLast && (
        <div className="hidden md:block">
          {order === 3 ? (
            // 3번: 아래로 (3 → 4)
            <div className="absolute left-1/2 -bottom-6 -translate-x-1/2">
              <ArrowDown className="w-6 h-6 text-neutral-900" />
            </div>
          ) : order === 4 ? (
            // 4번: 왼쪽으로 (4 → 5)
            <div className="absolute -left-6 top-1/2 -translate-y-1/2">
              <ArrowLeft className="w-6 h-6 text-neutral-900" />
            </div>
          ) : (
            // 1,2: 오른쪽으로
            <div className="absolute -right-6 top-1/2 -translate-y-1/2">
              <ArrowRight className="w-6 h-6 text-neutral-900" />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
      <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
        {value}
      </div>
      <div className="text-xs md:text-sm text-neutral-600 mt-1">{label}</div>
    </div>
  );
}
