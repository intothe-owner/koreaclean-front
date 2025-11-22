'use client';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useState } from 'react';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';
import PricingPublic from '@/components/app/PricingPublic';

export default function Pricing() {
  const items: TabItem[] = [
    { label: '경로당 청소 서비스', href: '/service/clean' },
    { label: '서비스 절차 안내', href: '/service/step' },
    { label: '요금표', href: '/service/pricing' },
    { label: '이용 안내', href: '/service/guide' },
    { label: '품질 보증 정책', href: '/service/quality' },
  ];
  const [tab, setTab] = useState<string>('reserve');

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
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

      {/* 탭 영역 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* 요금표 섹션 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-16">
          <PricingPublic fetchUrl="/backend/pricing/pricing" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
