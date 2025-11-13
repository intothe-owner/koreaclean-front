// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useState } from 'react';

import HeroCard from '@/components/app/HeroCard';
import ContactLocation from '@/components/app/ContactLocation';
import { fetchSiteInfoForMeta } from '@/lib/function';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';

export default function Contact() {
    const items: TabItem[] = [
        { label: '서비스 개요 소개', href: '/home/intro' },
        { label: '주요 서비스 지역', href: '/home/area' },
        { label: '연락처 및 위치', href: '/home/contact' },
        { label: '성과 현황', href: '/home/achieve' },
        { label: '고객후기', href: '/home/review' },
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
                    <ContactLocation/>
                </div>
            </section>
            
            <Footer />
        </div>
    );
}
