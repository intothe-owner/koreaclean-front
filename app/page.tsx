// app/page.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

import 'swiper/css';
import 'swiper/css/effect-fade';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';

import { IoMdArrowRoundForward } from "react-icons/io";
import MainBannerSwiper from '@/components/app/MainBannerSwiper';
export default function Home() {
  
  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      {/* 헤더 */}
      <Header />
      {/* 배경 스와이퍼 */}
      {/* <CenterSwiper /> */}
      


      {/* 히어로 카드 */}
      {/* <HeroCard title='경로당 맞춤형 청소' content='예약부터 사후관리까지 한번에' /> */}
      <MainBannerSwiper
        src="/backend/banners/main-banners"
        height={560}
        rounded="rounded-3xl"
        autoplayDelayMs={5000}
        loop
        showDots
        showNav
      />
      {/* ③ 텍스트 섹션 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-8 py-16 grid md:grid-cols-2 gap-10 items-start">
          {/* 왼쪽 타이틀 */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
              최첨단 청소 업체<br />한국클린쿱
            </h2>
          </div>

          {/* 오른쪽 본문 + 더 알아보기 */}
          <div className="flex items-start gap-4">
            <div>
              <p className="text-gray-800 leading-relaxed">
                어르신들의 건강 관리 <b>한국클린쿱</b>이 책임지겠습니다.
                <br />
                <b>AI와 IoT</b>를 통한 실시간 모니터링과
                <br />
                최첨단 청소 기술로 어르신들을 케어합니다.
              </p>

              <Button
                className="mt-5 rounded-lg bg-white border border-gray-400 text-black hover:bg-gray-100"
              >
                더 알아보기
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* ④ 한국클린쿱과 함께 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-8 pt-4 pb-12">
          <h3 className="text-xl md:text-2xl font-extrabold mb-4">한국클린쿱과 함께</h3>

          {/* 래퍼: 반응형 그리드. lg 이상에서는 데이터 갯수(arr.length)만큼 컬럼 생성 */}
          <div
            className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
            style={{ ['--cols' as any]: ([{}, {}].length) }} // ← 런타임에서 arr.length로 덮어씀(아래 map에서)
          >
            {[
              {
                title: '지자체 경로당 예약하기',
                desc: '간편하게 예약을 해보세요.',
                img: '/images/main-request.png',
              },
              {
                title: '청소기업 로그인',
                desc: '다양한 혜택을 위한 로그인',
                img: '/images/main-login.png',
              },
            ].map((card, i, arr) => (
              <div
                key={i}
                // lg 구간에서 컬럼 수를 동적으로 결정하기 위해 CSS 변수 주입
                style={{ ['--cols' as any]: arr.length }}
                className="relative rounded-2xl bg-white shadow-sm border border-black/10 p-5"
              >
                {/* 상단: 텍스트 + 버튼 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-bold">{card.title}</h4>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                  </div>
                  <button
                    aria-label="자세히"
                    className="shrink-0 h-8 w-8 rounded-lg border border-black/30 flex items-center justify-center text-lg leading-none transition-colors duration-300 hover:bg-gray-50"
                  >
                    <IoMdArrowRoundForward />
                  </button>
                </div>

                {/* 일러스트: 오른쪽 하단 고정 + 반응형 높이 */}
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
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ⑤ 뉴스에 나온 한국클린쿱 */}
      {/* <section className="relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-10"> */}
      {/* <h3 className="text-xl md:text-2xl font-extrabold mb-6">뉴스에 나온 한국클린쿱</h3> */}

      {/* <div className="divide-y divide-black/10">
            {[
              {
                title: '“한국클린쿱 경기도 지역 100여개 무료 봉사”',
                src: '경기일보',
                date: '2025-07-31',
                href: '#',
              },
              {
                title: '“한국클린쿱 경기도 지역 100여개 무료 봉사”',
                src: '경기일보',
                date: '2025-07-31',
                href: '#',
              },
            ].map((news, i) => (
              <a
                key={i}
                href={news.href}
                className="block py-6 hover:bg-black/[0.02] transition"
              >
                <p className="text-lg md:text-xl font-semibold">{news.title}</p>
                <div className="mt-2 flex items-center gap-4 text-blue-600">
                  <span className="font-bold">{news.src}</span>
                  <span className="text-gray-700">{news.date}</span>
                </div>
              </a>
            ))}
          </div> */}

      {/* 기사 더보기 */}
      {/* <div className="mt-6 flex items-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-base font-semibold hover:underline"
            >
              기사 더보기
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/40">
                →
              </span>
            </a>
          </div> */}
      {/* </div>
      </section> */}
      <Footer />
    </div>
  );
}
