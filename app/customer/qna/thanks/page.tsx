// app/page.tsx
'use client';



import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import Link from 'next/link';
import { useSession } from 'next-auth/react';



export default function ThanksPage() {
    const { data: session, status } = useSession();
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

                            <h1 className="mb-2 text-center text-2xl font-bold">문의가 접수되었습니다</h1>
                            <p className="mb-6 text-center text-neutral-600">
                                문의가 정상적으로 접수되었습니다.<br/>
                                빠르게 확인 후 안내드리겠습니다.
                            </p>

                            

                            <div className="flex items-center justify-center gap-3">
                                <Link
                                    href="/customer/qna"
                                    className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                                >
                                    문의하기
                                </Link>
                                {
                                    session?.user?
                                    <Link
                                    href="/customer/qna/list"
                                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                                >
                                    내 문의 보기
                                </Link>:
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                                >
                                    메인으로 가기
                                </Link>
                                }
                                
                            </div>

                            
                        </div>
                    </main>
                </div>
            </section>

            <Footer />
        </div>
    );
}
