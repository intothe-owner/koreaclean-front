// components/common/TabsBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState, useMemo } from 'react';
import clsx from 'clsx';

export type TabItem = {
    label: string;
    value?: string;   // 상태 기반일 때 active 판별 키
    href?: string;    // 라우팅 기반일 때 링크
};

type Props = {
    items: TabItem[];
    /** href 기반(active = 현재 경로) or state 기반(onChange로 제어) */
    mode?: 'route' | 'state';
    /** mode==='state' 일 때 현재 값 */
    value?: string;
    /** mode==='state' 일 때 변경 핸들러 */
    onChange?: (v: string) => void;
    /** 스타일 옵션 */
    className?: string;
};

export default function TabsBar({
    items,
    mode = 'route',
    value,
    onChange,
    className,
}: Props) {
    const path = usePathname();
    const uid = useId();

    // state 모드에서 초기값
    const [internal, setInternal] = useState(items[0]?.value ?? '');

    const cur = mode === 'state' ? (value ?? internal) : path;

    const isActive = (it: TabItem) => {
        if (mode === 'route') {
            // pathname이 href와 완전히 일치하거나 하위 경로여도 활성화
            return it.href && (cur === it.href || cur?.startsWith(it.href + '/'));
        }
        return it.value === cur;
    };

    const handleClick = (it: TabItem) => {
        if (mode === 'state') {
            const v = it.value ?? it.label;
            setInternal(v);
            onChange?.(v);
        }
    };

    const tabRole = useMemo(() => `${uid}-tablist`, [uid]);

    // components/common/TabsBar.tsx (일부 수정)
    return (
        <div className={clsx('overflow-x-auto hidden md:block', className)}> {/* 모바일 숨김 */}
            <div
                role="tablist"
                aria-label={tabRole}
                className="flex w-full rounded-md p-1"
            >
                {items.map((it) => {
                    const active = isActive(it);
                    const commonClass =
                        'flex-1 text-center whitespace-nowrap px-5 py-3 text-sm font-semibold transition';
                    const activeClass =
                        'bg-white text-gray-900 rounded-md shadow-sm border border-gray-200';
                    const idleClass = 'text-white/95 hover:text-white bg-blue-600';

                    if (mode === 'route' && it.href) {
                        return (
                            <Link
                                key={it.label}
                                href={it.href}
                                role="tab"
                                aria-selected={!!active}
                                className={clsx(commonClass, active ? activeClass : idleClass)}
                            >
                                {it.label}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={it.label}
                            type="button"
                            role="tab"
                            aria-selected={!!active}
                            onClick={() => handleClick(it)}
                            className={clsx(commonClass, active ? activeClass : idleClass)}
                        >
                            {it.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

}
