// app/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useState } from 'react';

import HeroCard from '@/components/app/HeroCard';
import FAQ from '@/components/app/customer/FAQ';
import MainBannerSwiper from '@/components/app/MainBannerSwiper';

export default function NoticeList() {
    const items: TabItem[] = [
        { label: '공지사항', href: '/customer/notice/list' },
        { label: '자주 묻는 질문', href: '/customer/faq' },
        { label: '문의하기', href: '/customer/qna' },
        { label: '다운로드', href: '/customer/download/list' },
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
                    <FAQ />
                </div>
            </section>
            <Footer />
        </div>
    );
}
