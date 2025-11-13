// app/forgot/page.tsx (또는 app/page.tsx)
'use client';

import { useState } from 'react';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import { baseUrl } from '@/lib/variable';

type Mode = 'id' | 'password';

export default function ForgotPage() {
  const [mode, setMode] = useState<Mode>('id');

  // 공통
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 아이디 찾기 필드 (이름 + 휴대폰)
  const [idName, setIdName] = useState('');
  const [idPhone, setIdPhone] = useState('');

  // 비밀번호 찾기 필드 (이메일 + 이름)
  const [pwEmail, setPwEmail] = useState('');
  const [pwName, setPwName] = useState('');

  const resetMessages = () => {
    setResultMessage(null);
    setErrorMessage(null);
  };

  // 휴대폰 번호 포맷팅 (010-1234-5678 형태)
  const formatPhone = (v: string) => {
    const num = v.replace(/\D/g, '');
    if (num.length < 4) return num;
    if (num.length < 8) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
  };

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!idName.trim() || !idPhone.trim()) {
      setErrorMessage('이름과 휴대폰 번호를 모두 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);

      // TODO: 실제 API 엔드포인트로 교체
      const res = await fetch(`${baseUrl}/find/find-id-by-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: idName, phone: idPhone }),
     });
      await new Promise((r) => setTimeout(r, 800)); // 데모용
      console.log(res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '아이디 찾기 실패');
      const userId = data.userId;
      setResultMessage(`가입하신 아이디는 "${userId}" 입니다.`);
    } catch (err: any) {
      setErrorMessage(err.message || '아이디 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!pwEmail.trim() || !pwName.trim()) {
      setErrorMessage('가입 이메일과 이름을 모두 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);

      // TODO: 실제 API 엔드포인트로 교체
      const res = await fetch(`${baseUrl}/find/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pwEmail, name: pwName }),
        });
     

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '비밀번호 재설정 메일 발송 실패');

      setResultMessage(
        '입력하신 이메일 주소로 비밀번호 재설정 링크를 발송했습니다. 메일함을 확인해 주세요.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || '비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <div className="flex justify-center items-center py-12 px-4 w-full">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-8">
          {/* 제목 */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              아이디 / 비밀번호 찾기
            </h1>
            <p className="text-sm text-gray-500">
              가입 시 등록하신 정보로 아이디 또는 비밀번호를 찾을 수 있습니다.
            </p>
          </div>

          {/* 탭 버튼 */}
          <div className="flex mb-6 rounded-full bg-gray-100 p-1">
            <button
              type="button"
              className={`flex-1 py-2 text-sm rounded-full transition
                ${mode === 'id' ? 'bg-white shadow text-gray-900 font-semibold' : 'text-gray-500'}
              `}
              onClick={() => {
                setMode('id');
                resetMessages();
              }}
            >
              아이디 찾기
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm rounded-full transition
                ${
                  mode === 'password'
                    ? 'bg-white shadow text-gray-900 font-semibold'
                    : 'text-gray-500'
                }
              `}
              onClick={() => {
                setMode('password');
                resetMessages();
              }}
            >
              비밀번호 찾기
            </button>
          </div>

          {/* 폼 영역 */}
          {mode === 'id' ? (
            <form onSubmit={handleFindId} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={idName}
                  onChange={(e) => setIdName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  placeholder="가입하신 이름을 입력해 주세요."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  휴대폰 번호
                </label>
                <input
                  type="tel"
                  value={idPhone}
                  onChange={(e) => setIdPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  placeholder="010-0000-0000"
                  maxLength={13}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  가입 시 등록하신 휴대폰 번호를 입력해 주세요.
                </p>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500 mt-1 whitespace-pre-line">{errorMessage}</p>
              )}
              {resultMessage && (
                <p className="text-xs text-emerald-600 mt-1 whitespace-pre-line">
                  {resultMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '조회 중...' : '아이디 찾기'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleFindPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가입 이메일
                </label>
                <input
                  type="email"
                  value={pwEmail}
                  onChange={(e) => setPwEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  placeholder="example@domain.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={pwName}
                  onChange={(e) => setPwName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  placeholder="가입하신 이름을 입력해 주세요."
                />
              </div>

              <p className="text-[11px] text-gray-400">
                ※ 비밀번호 재설정 링크는 이메일로 발송됩니다. 10분 이내에 사용하지 않으면 만료될 수
                있습니다.
              </p>

              {errorMessage && (
                <p className="text-xs text-red-500 mt-1 whitespace-pre-line">{errorMessage}</p>
              )}
              {resultMessage && (
                <p className="text-xs text-emerald-600 mt-1 whitespace-pre-line">
                  {resultMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '발송 중...' : '비밀번호 재설정 메일 보내기'}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
