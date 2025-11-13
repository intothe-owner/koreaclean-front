// app/reset-password/page.tsx
import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import ResetPasswordClient from './ResetPasswordClient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function ResetPasswordPage({ searchParams }: Props) {
  const tokenParam = searchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam || '';

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />
      <div className="flex justify-center items-center py-12 px-4 w-full">
        <ResetPasswordClient token={token} />
      </div>
      <Footer />
    </div>
  );
}
