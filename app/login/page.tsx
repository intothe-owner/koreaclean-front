// app/page.tsx

import { Suspense } from 'react';
import LoginClient from './LoginClient';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>; // ✅ Promise로 받음
}) {
  const sp = await searchParams;
  const redirect =
    (typeof sp?.redirect === 'string' ? sp.redirect : undefined) ?? '/';
  
  return (
    <Suspense fallback={<div>로딩중…</div>}>
      <LoginClient redirect={redirect} />
    </Suspense>
  );
}
