// components/SiteFooter.tsx
'use client';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { MENUS } from '@/lib/variable';
import Link from 'next/link';
export default function Footer() {
  const { data, isLoading, isError } = useSiteInfo();
  return (
    <footer className="bg-[#4a4a4a] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* 상단 메뉴 영역 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-bold">경로당 케어</div>
          </div>
          {MENUS.map((m,i) => (
            <div key={`footer${i}`}>
              <div className="font-semibold mb-2">
                <Link
                  href={m.href || '#'}
                  className="font-semibold mb-2"
                >{m.label}</Link>
              </div>
              {m.children && (
                <ul className="space-y-1 text-white/80">
                  {m.children.map((sub,i) => (
                    <li key={`footer${i}`}>
                      <Link
                        key={sub.label}
                        href={sub.href}
                      >
                       {sub.label}</Link></li>
                  ))}

                </ul>
              )}
            </div>
          ))}
          
        </div>

        {/* 구분선 */}
        <div className="my-5 h-px w-full bg-white/30" />

        {/* 사업자 정보 / 카피라이트 */}
        <div className="space-y-2 text-xs leading-relaxed text-white/85">
          <p>
            {data?.site_name??''} | 사업자등록번호 : {data?.biz_no??''} |
            {data?.ceoName??''}
          </p>
          <p>
            주소 : {data?.address??''} {data?.address_detail} |
            전화 : {data?.tel??''} / 팩스 : {data?.fax??''}
          </p>
          <p className="pt-1">
            Copyright© Into the
          </p>
        </div>
      </div>
    </footer>
  );
}
