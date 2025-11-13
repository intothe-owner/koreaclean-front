// app/reset-password/page.tsx
import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import ResetPasswordClient from "./ResetPasswordClient";

type SearchParamsType = {
  [key: string]: string | string[] | undefined;
};

// 여기서 searchParams를 Promise로 타입 지정
type Props = {
  searchParams: Promise<SearchParamsType>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  // Next가 넘겨주는 Promise를 여기서 해제
  const resolved = await searchParams;

  const tokenParam = resolved.token;
  const token =
    Array.isArray(tokenParam) ? tokenParam[0] : tokenParam || "";

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
