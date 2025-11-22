'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, ShieldCheck, Wind, Boxes } from 'lucide-react';

type Cat = {
  key: string;
  title: string;
  desc: string;
  points: string[];
  href: string;
  Icon: React.ComponentType<any>;
};

const CATEGORIES: Cat[] = [
  {
    key: 'total-care',
    title: '토탈케어서비스',
    desc: '진단 → 청소 → 정리정돈 → 소독까지 한 번에',
    points: ['현장 컨설팅', '맞춤 작업 플랜', '사후관리 리포트'],
    href: '/service/clean?cat=total-care',
    Icon: Sparkles,
  },
  {
    key: 'proxy-clean',
    title: '대행청소',
    desc: '일상/정기 청소를 전문팀이 대행',
    points: ['공용공간 집중', '바닥·창틀·유리', '정기구독 옵션'],
    href: '/service/clean?cat=proxy',
    Icon: Boxes,
  },
  {
    key: 'disinfection',
    title: '소독방역',
    desc: '감염병 예방을 위한 전문 소독',
    points: ['정부지침 준수', '안전 약제 사용', '체계적 기록'],
    href: '/service/clean?cat=disinfection',
    Icon: ShieldCheck,
  },
  {
    key: 'aircon',
    title: '에어컨종합세척',
    desc: '분해 세척으로 냉방 효율 및 위생 향상',
    points: ['실내기 분해세척', '열교환기·팬 케어', '곰팡이·먼지 제거'],
    href: '/service/clean?cat=aircon',
    Icon: Wind,
  },
  {
    key: 'etc',
    title: '기타',
    desc: '입주/이사, 특수청소 등 맞춤 서비스',
    points: ['입주·이사 청소', '특수/심화 청소', '요청형 커스텀'],
    href: '/service/clean?cat=etc',
    Icon: CheckCircle,
  },
];

export default function ServiceCategories() {
  return (
    <section className="relative z-10 bg-[#f9f5f2]">
      <div className="max-w-7xl mx-auto px-6 pt-2 pb-12">
        

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ key, title, desc, points, href, Icon }) => (
            <div
              key={key}
              className="group rounded-2xl border border-black/10 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 px-5 pt-5">
                <div className="rounded-xl border p-2">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>

              <div className="px-5 pt-3 pb-5">
                <p className="text-sm text-gray-700">{desc}</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                {/* <div className="mt-5">
                  <Button className="w-full">
                    <Link href={href}>자세히 보기</Link>
                  </Button>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
