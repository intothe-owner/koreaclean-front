// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import 'swiper/css';
import 'swiper/css/effect-fade';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';

import { IoMdArrowRoundForward } from "react-icons/io";
import MainBannerSwiper from '@/components/app/MainBannerSwiper';

// ✅ framer-motion 추가
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
const BASE_VISIT = 2000;
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  const router = useRouter();

  // ✅ 방문자 수 (실제 값) & 애니메이션용 숫자
  const [visitCount, setVisitCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  // ✅ 카운팅 시작 여부 (섹션이 화면에 들어왔을 때 true)
  const [counterStarted, setCounterStarted] = useState(false);

  // ✅ 1) 서버에 카운트 증가 + 오늘 방문자 수 가져오기
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname || '/';

    fetch('/backend/visit/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then((res) => res.json())
      .then((data) => {
        const count = data?.stat?.view_count ?? 0;
        setVisitCount(count);
      })
      .catch(() => {
        // 에러 시 그냥 0 유지
      });
  }, []);

  // ✅ 2) 0 → visitCount 까지 부드러운 카운팅 애니메이션
  // ✅ 2) 0 → (2000 + visitCount) 까지 부드러운 카운팅 애니메이션
  useEffect(() => {
    // 화면에 카운터 섹션이 들어오기 전에는 애니메이션 X
    if (!counterStarted) return;

    let frameId: number;
    const duration = 1000; // 1초 동안 증가
    const start = 0;
    const end = BASE_VISIT + visitCount;   // ✅ 여기서 +2000 적용
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(start + (end - start) * progress);
      setDisplayCount(value);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (end > 0) {
      frameId = requestAnimationFrame(tick);
    } else {
      setDisplayCount(BASE_VISIT); // 이 경우는 거의 없지만, 안전하게 기본값
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [visitCount, counterStarted]);


  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      {/* 헤더 */}
      <Header />

      {/* 메인 배너 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <MainBannerSwiper
          src="/backend/banners/main-banners"
          height={560}
          rounded="rounded-3xl"
          autoplayDelayMs={5000}
          loop
          showDots
          showNav
        />
      </motion.div>



      {/* ③ 한국클린쿱 간단 소개 섹션 (텍스트 키움 + 스크롤 애니메이션) */}
      <motion.section
        className="relative z-10 bg-[#f9f5f2]"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-8 py-16 grid md:grid-cols-2 gap-10 items-start">
          {/* 왼쪽 타이틀 */}
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              최첨단 청소 업체<br />한국클린쿱
            </h2>
          </motion.div>

          {/* 오른쪽 본문 + 더 알아보기 */}
          <motion.div
            className="flex items-start gap-4"
            variants={fadeIn}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <div>
              <p className="mt-2 text-lg text-gray-800 leading-relaxed">
                어르신들의 건강 관리 <b>한국클린쿱</b>이 책임지겠습니다.
                <br />
                <b>AI와 IoT</b>를 통한 실시간 모니터링과
                <br />
                최첨단 청소 기술로 어르신들을 케어합니다.
              </p>

              <Button
                className="mt-6 rounded-lg bg-white border border-gray-400 text-base text-black px-6 py-2.5 hover:bg-gray-100"
                onClick={()=>{
                  router.push('/home/intro');
                }}
              >
                더 알아보기
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ④ 한국클린쿱과 함께 (카드 + hover 애니메이션) */}
      <motion.section
        className="relative z-10 bg-[#f9f5f2]"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-8 pt-4 pb-12">
          <h3 className="text-2xl md:text-3xl font-extrabold mb-4">한국클린쿱과 함께</h3>

          {/* 래퍼: 반응형 그리드. lg 이상에서는 데이터 갯수(arr.length)만큼 컬럼 생성 */}
          <div
            className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
            style={{ ['--cols' as any]: ([{}, {}].length) }}
          >
            {[
              {
                title: '지자체 경로당 예약하기',
                desc: '간편하게 예약을 해보세요.',
                img: '/images/main-request.png',
                url: '/request'
              },
              {
                title: '청소기업 로그인',
                desc: '다양한 혜택을 위한 로그인',
                img: '/images/main-login.png',
                url: '/login'
              },
            ].map((card, i, arr) => (
              <motion.div
                key={i}
                style={{ ['--cols' as any]: arr.length }}
                className="relative rounded-2xl bg-white shadow-sm border border-black/10 p-5"
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  boxShadow:
                    '0 18px 35px rgba(15, 23, 42, 0.12)',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                {/* 상단: 텍스트 + 버튼 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-lg md:text-xl font-bold">{card.title}</h4>
                    <p className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <motion.button
                    aria-label="자세히"
                    className="shrink-0 h-8 w-8 rounded-lg border border-black/30 flex items-center justify-center text-lg leading-none transition-colors duration-300 hover:bg-gray-50"
                    whileHover={{ rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    onClick={() => {
                      router.push(card.url);
                    }}
                  >
                    <IoMdArrowRoundForward />
                  </motion.button>
                </div>

                {/* 일러스트 */}
                <div className="mt-4 relative h-28 sm:h-32 lg:h-36 w-full">
                  <Image
                    src={card.img}
                    alt=""
                    fill
                    className="object-contain object-right-bottom pointer-events-none select-none"
                    sizes="(min-width:1024px) 40vw, (min-width:640px) 50vw, 90vw"
                    priority={i === 0}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ⑤ 한국클린쿱에 대한 상세 소개 섹션 (스크롤 애니메이션) */}
      <motion.section
        className="relative z-10 bg-white"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-8 py-16 grid lg:grid-cols-2 gap-12 items-start">
          {/* 왼쪽: 소개 텍스트 */}
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              한국클린쿱은
            </h3>
            <p className="mt-4 text-base md:text-lg text-gray-700 leading-relaxed">
              <b>사회적협동조합 한국클린쿱</b>은 전국 어르신 돌봄 공간과
              경로당, 취약계층 가구를 대상으로 전문 청소 서비스를 제공하는
              사회적 경제 조직입니다.
              <br />
              단순 청소를 넘어, <b>실내 공기질 관리</b>와 <b>감염병 예방</b>,
              <b>안전한 생활환경 조성</b>까지 함께 고민하며, 지자체·공공기관·
              민간기업과의 협력을 통해 지속 가능한 돌봄 모델을 만들어가고 있습니다.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <motion.div
                className="rounded-2xl border border-gray-100 bg-[#f9f5f2] px-5 py-4"
                variants={fadeIn}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  핵심 서비스
                </p>
                <p className="mt-2 text-sm md:text-base text-gray-800">
                  경로당·노인복지시설 청소, 에어컨 종합세척, 공기청정기 관리,
                  소독·방역, 저장강박·쓰레기집 특수청소 등 맞춤형 클린 케어.
                </p>
              </motion.div>
              <motion.div
                className="rounded-2xl border border-gray-100 bg-[#f9f5f2] px-5 py-4"
                variants={fadeIn}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  한국클린쿱의 강점
                </p>
                <p className="mt-2 text-sm md:text-base text-gray-800">
                  전국 네트워크 기반의 신속한 대응, 표준화된 매뉴얼, 전문 교육을
                  이수한 청소 전문가, 그리고 데이터 기반 운영 시스템을 갖추고 있습니다.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* 오른쪽: 포인트 카드들 */}
          <motion.div
            className="space-y-4"
            variants={fadeIn}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            {[
              {
                title: '어르신 맞춤형 청소·케어',
                desc: '이동 동선, 사용 빈도, 건강 상태를 고려한 동선 정리와 청소 방식으로 어르신이 안전하고 편안하게 생활할 수 있는 환경을 만듭니다.',
              },
              {
                title: 'AI · IoT 기반 모니터링',
                desc: '공기질·사용 패턴·청소 이력 등을 데이터로 기록하여, 사후관리와 정기 점검까지 한 번에 관리할 수 있는 시스템을 준비하고 있습니다.',
              },
              {
                title: '지자체·공공기관 파트너',
                desc: '지자체 경로당 청소, 공기청정기 유지관리, 취약계층 환경개선 사업 등 다양한 공공 프로젝트를 통해 지역 사회의 돌봄 인프라를 강화해 나갑니다.',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-black/5 bg-[#f9f5f2] px-5 py-4"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 * idx }}
              >
                <h4 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ⑥ 전국 자활기업에 대한 내용 섹션 */}
      <motion.section
        className="relative z-10 bg-[#f9f5f2]"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            전국 자활기업과 함께하는 파트너십
          </h3>
          <p className="mt-4 text-base md:text-lg text-gray-700 leading-relaxed">
            한국클린쿱은 전국 곳곳에서 활동하는 <b>자활기업</b>과 함께합니다.
            지역 주민이 스스로 일자리를 만들고, 돌봄과 청소 서비스를 제공하는
            자활기업과의 협력은 단순한 하청 관계가 아니라
            <b>상생을 위한 파트너십</b>입니다.
            <br />
            각 지역 자활센터·자활기업과 연계하여 경로당 청소, 공기청정기 관리,
            주거환경 개선 사업을 함께 수행하며, 지역의 일자리와 복지를 동시에
            키워가는 모델을 지향합니다.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <motion.div
              className="rounded-2xl bg-white border border-black/5 p-5"
              variants={fadeIn}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <p className="text-sm font-semibold text-blue-700">
                지역 기반 네트워크
              </p>
              <h4 className="mt-2 text-lg font-bold text-gray-900">
                전국 자활기업 연계
              </h4>
              <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed">
                각 지역 자활기업의 인력과 노하우를 활용해,
                한국클린쿱의 표준화된 청소 매뉴얼과 서비스 품질을
                전국 단위로 확장할 수 있습니다.
              </p>
            </motion.div>

            <motion.div
              className="rounded-2xl bg-white border border-black/5 p-5"
              variants={fadeIn}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <p className="text-sm font-semibold text-blue-700">
                공공·민간 프로젝트
              </p>
              <h4 className="mt-2 text-lg font-bold text-gray-900">
                지자체·기관과의 공동 사업
              </h4>
              <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed">
                지자체 환경개선 사업, 복지관·경로당 청소 지원, 취약계층 주거환경 개선 등
                공공사업을 자활기업과 함께 수행하여 지역 사회에 실질적인 변화를 만듭니다.
              </p>
            </motion.div>

            <motion.div
              className="rounded-2xl bg-white border border-black/5 p-5"
              variants={fadeIn}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <p className="text-sm font-semibold text-blue-700">
                교육 · 성장
              </p>
              <h4 className="mt-2 text-lg font-bold text-gray-900">
                전문 교육과 일자리 창출
              </h4>
              <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed">
                에어컨 종합세척, 방역·소독, 저장강박 특수청소 등
                전문 교육 프로그램을 통해 자활기업 구성원이
                <b>전문 청소 인력</b>으로 성장할 수 있도록 돕습니다.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>
      {/* ✅ 방문자 카운터 섹션 (풀 사이즈 + 큰 텍스트) */}
      <motion.div
        className="w-full mt-8 mb-6 bg-transparent"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}              // 👈 스크롤 시 페이드인
        viewport={{ once: true, amount: 0.4 }}          // 👈 화면에 40% 보이면 한 번만
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        onViewportEnter={() => {
          // 이미 시작했으면 다시 시작 안 함
          if (!counterStarted) {
            setCounterStarted(true);
          }
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="w-full rounded-3xl bg-white/90 border border-black/5 px-6 sm:px-10 py-6 sm:py-8 shadow-sm backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="block text-sm sm:text-base text-gray-500">
                오늘 경로당토탈케어 방문한 사람은
              </span>
            </div>

            <div className="flex items-baseline gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tabular-nums leading-none">
                {displayCount.toLocaleString()}
              </span>
              <span className="text-lg sm:text-xl text-gray-600 font-semibold">
                명
              </span>
            </div>
          </div>
        </div>
      </motion.div>


      {/* 푸터 */}
      <Footer />
    </div>
  );
}
