// app/page.tsx
'use client';



import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import Link from 'next/link';



export default function ThanksPage() {

    return (
        <div className="relative w-full min-h-screen bg-[#f9f5f2]">
            <Header />

            <section className="relative z-10 bg-[#f9f5f2]">
                <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                    <main className="min-h-[70vh] grid place-items-center bg-neutral-50 px-4 py-16">
                        <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-7 w-7 text-emerald-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>

                            <h1 className="mb-2 text-center text-2xl font-bold">신청이 접수되었습니다</h1>
                            <p className="mb-6 text-center text-neutral-600">
                                서비스 신청이 정상적으로 접수되었습니다.<br/>
                                빠르게 확인 후 안내드리겠습니다.
                            </p>

                            

                            <div className="flex items-center justify-center gap-3">
                                <Link
                                    href="/request"
                                    className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                                >
                                    새 신청하기
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                                >
                                    메인으로
                                </Link>
                            </div>

                            {/* (선택) 몇 초 후 자동 이동 문구 */}
                            <p className="mt-6 text-center text-xs text-neutral-400">
                                3초 후 자동으로 새 신청 화면으로 이동합니다…
                            </p>

                            {/* 자동 이동: 순수 HTML 메타리프레시 (JS 의존 X) */}
                            <meta httpEquiv="refresh" content="3;url=/request" />
                        </div>
                    </main>
                </div>
            </section>

            <Footer />
        </div>
    );
}
