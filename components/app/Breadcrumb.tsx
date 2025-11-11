// components/common/Breadcrumb.tsx
'use client';
import Link from 'next/link';

export default function Breadcrumb({
  items,
  className = '',
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="breadcrumb" className={`text-sm text-gray-800 ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.label} className="flex items-center gap-2">
              {it.href && !last ? (
                <Link href={it.href} className="font-medium hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span className="font-semibold">{it.label}</span>
              )}
              {!last && <span className="text-gray-500">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
