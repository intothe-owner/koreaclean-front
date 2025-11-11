// app/page.tsx
'use client';



import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';





import ServiceRequestForm from '@/components/app/ServiceRequestForm';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';

export default function Request() {
  const { data: session, status } = useSession();
  const { checked, authed } = useAuthGuard({
    requireRoles: ['CLIENT', 'ADMIN', 'SUPER'],
  });
  if (!checked) return null;
  if (!authed) return null; // 경고 후 /login 으로 이동 처리됨

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />
      
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <ServiceRequestForm/>
        </div>
      </section>

      <Footer />
    </div>
  );
}
