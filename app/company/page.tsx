// app/page.tsx (예시 경로: /company/page.tsx 인 경우에도 동일)
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CompanyRegisterForm from '@/components/app/ComponyRegisterForm';
import useAuthGuard from '@/hooks/useAuthGuard';
import { Suspense } from 'react';

export default function CompanyPage() {
  const { checked, authed } = useAuthGuard({
    requireRoles: ['COMPANY', 'ADMIN', 'SUPER'],
  });
  if (!checked) return null;
  if (!authed) return null; // 경고 후 /login 이동

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Suspense fallback={null}>
        {/* usePathname/useSearchParams 를 내부에서 쓸 수 있는 애들 */}
        <Header />
        <section className="relative z-10 bg-[#f9f5f2]">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
            <CompanyRegisterForm />
          </div>
        </section>
      </Suspense>
      <Footer />
    </div>
  );
}
