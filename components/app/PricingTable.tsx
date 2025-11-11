// components/app/PricingTable.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export type PricingRow = {
  name: string;     // 서비스 종류
  base?: string;    // 기본 요금표(문자열 자유 입력)
};

const DEFAULT_ROWS: PricingRow[] = [
  { name: '토탈케어서비스', base: '' },
  { name: '대행청소', base: '' },
  { name: '소독방역', base: '' },
  { name: '에어컨종합세척', base: '' },
  { name: '기타', base: '' },
];

export default function PricingTable({
  rows = DEFAULT_ROWS,
  title = '기본 요금표',
  subtitle = '서비스종류별 기본 요금표입니다. (현장 여건에 따라 변동)'
}: {
  rows?: PricingRow[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
          {title}
        </h2>
        <p className="text-neutral-600 mt-1">{subtitle}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
      >
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-1/2" />
            <col className="w-1/2" />
          </colgroup>
          <thead>
            <tr className="bg-neutral-50">
              <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-semibold text-neutral-900">
                서비스종류
              </th>
              <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-semibold text-neutral-900">
                기본 요금표
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}-${i}`} className="odd:bg-white even:bg-neutral-50/40">
                <td className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-900">
                  {r.name}
                </td>
                <td className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-700">
                  {r.base ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <div className="mt-3 text-xs text-neutral-500 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5" />
        <span>표시 금액은 기준 안내이며, 실제 금액은 현장 여건·면적·오염도·일정에 따라 달라질 수 있습니다. 부가세 별도.</span>
      </div>
    </section>
  );
}
