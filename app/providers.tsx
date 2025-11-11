'use client';

import { SessionProvider } from 'next-auth/react';
import ReactQueryProvider from './providers/ReactQueryProvider';
import SiteInfoProvider from './providers/SiteInfoProvider';

type Props = {
  children: React.ReactNode;
  // NextAuth v4/v5 공통으로 session을 옵션으로 받게 해둠
  session?: any;
};

export default function Providers({ children, session }: Props) {
  return (
    <SessionProvider session={session}>
      <ReactQueryProvider>
        <SiteInfoProvider>{children}</SiteInfoProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
