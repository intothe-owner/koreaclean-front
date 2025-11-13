// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useState } from 'react';

import HeroCard from '@/components/app/HeroCard';
import Achievements from '@/components/app/Achievements';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';

export default function Achieve() {
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
                <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                    <Achievements
                        totalCenters={1234}
                        monthlyCounts={[
                            { m: '01', cnt: 100 }, { m: '02', cnt: 120 }, { m: '03', cnt: 120 }
                        ]}
                        companyCount={82}
                        // 그래프 색상 커스터마이즈
                        areaStrokeColor="#0ea5e9"    // sky-500
                        areaFillColor="#0ea5e9"
                        areaStartOpacity={0.35}
                        areaEndOpacity={0}
                        gridStroke="#e5e7eb"         // neutral-200
                        axisTickColor="#6b7280"      // neutral-500
                        barColors={['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6']}
                    />

                </div>
            </section>

            <Footer />
        </div>
    );
}
