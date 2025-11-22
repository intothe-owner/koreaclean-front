// app/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useState } from 'react';
import ServiceProcedureGuide from '@/components/app/ServiceProcedureGuide';
import HeroCard from '@/components/app/HeroCard';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';

export default function Step() {
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
            {/* 헤더 */}
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

            {/* ③ 텍스트 섹션 */}
            <section className="relative z-10 bg-[#f9f5f2]">
                <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                    
                    <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
                </div>
               
            </section>
            <section className="relative z-10 bg-[#f9f5f2]">
                <div className="max-w-7xl mx-auto px-6 pt-2 pb-12">
                    <ServiceProcedureGuide/>
                </div>
            </section>
            
            <Footer />
        </div>
    );
}
