// app/LoginClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function LoginClient({ redirect = '/' }: { redirect?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(()=>{
    if(session){
      router.push('/');
    }
  },[session])
 
  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateEmail(email)) {
      setEmailError('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    setEmailError('');
    if (!password) {
      setFormError('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', {
        redirect: false, // 수동 라우팅
        email,
        password,
        rememberMe: String(rememberMe),
      });

      if (!result || result.error) {
        setFormError(result?.error || '로그인에 실패했습니다.');
        return;
      }

      // ✅ 여기서 바로 이동. 컴포넌트가 곧 언마운트되므로 가드 알림이 뜨지 않음.
      router.replace(redirect);
    } catch (err) {
      console.error(err);
      setFormError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      // 보수적으로 약간 늦게 false로 바꾸고 싶다면 setTimeout(() => setIsSubmitting(false), 200)
      setIsSubmitting(false);
    }
  };

  const canSubmit = validateEmail(email) && password.length > 0 && !isSubmitting;

  return (
    <div>
      {!session?
        <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <div className="flex justify-center items-center py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white shadow-md rounded-2xl p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center">로그인</h1>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="you@example.com"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                {showPwd ? '숨기기' : '표시'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            
            <Link href="/forgot" className="text-sm text-blue-600 hover:underline">
              아이디/비밀번호 찾기
            </Link>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-2 rounded-md font-semibold transition ${
              !canSubmit ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-gray-700">
            아직 회원이 아니신가요?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>

      <Footer />
    </div>
      :<div>로그인 중입니다.</div>}
      
    </div>
    
  );
}
