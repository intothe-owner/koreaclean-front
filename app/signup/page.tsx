// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import { formatMobile, formContact, validateEmail } from '@/lib/function';
import { baseUrl } from '@/lib/variable';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { useSiteInfo } from '@/hooks/useSiteInfo'; // ✅ 추가
import { useSession } from 'next-auth/react';

type MemberRole = 'ADMIN' | 'CLIENT' | 'COMPANY';

interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  inst: string;
  contact: string;
  phone: string;
  role: MemberRole;
}

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isChange, setIsChange] = useState<boolean>(true);

  // ✅ 사이트 정책 불러오기
  const { data: site, isLoading: siteLoading } = useSiteInfo();

  const [form, setForm] = useState<SignUpForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    inst: '',
    contact: '',
    phone: '',
    role: 'COMPANY',
  });

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({ ...prev, email: session?.user.email }));
      setForm((prev) => ({ ...prev, name: session?.user?.name??'' }));
      setForm((prev) => ({ ...prev, inst: session?.user?.inst ? session?.user?.inst : '' }));
      setForm((prev) => ({ ...prev, contact: session?.user?.contact ? session?.user?.contact : '' }));
      setForm((prev) => ({ ...prev, phone: session?.user?.phone ? session?.user?.phone : '' }));
      setForm((prev) => ({ ...prev, role: session?.user?.role as MemberRole }));
      setIsChange(false);
    }
  }, [session?.user]);

  const [error, setError] = useState<string>('');
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [emailMsg, setEmailMsg] = useState<string>('');

  // ✅ 약관 동의 상태
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const emailCheck = async (email: string) => {
    const res = await fetch(`${baseUrl}/users/check?email=${email}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.is_success === false) {
        setIsCheck(false);
        setEmailMsg('이메일 중복 체크 때 오류가 발생하였습니다.');
      } else {
        if (data.exists) {
          setIsCheck(false);
          setEmailMsg('중복된 이메일 주소입니다.');
        } else {
          setIsCheck(true);
          setEmailMsg('사용할 수 있는 이메일 주소입니다.');
        }
      }
    }
  };

  const handleChange = (update: Partial<SignUpForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...update };

      if ('email' in update) {
        if (next.email.length > 0 && !validateEmail(next.email)) {
          setEmailMsg('올바른 이메일 주소를 입력해주세요.');
        } else {
          setEmailMsg('');
        }
      }

      if (next.password && next.confirmPassword && next.password !== next.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
      } else {
        setError('');
      }

      return next;
    });
  };

  const selectLevel = (lv: MemberRole) => {
    if (lv === 'COMPANY') {
      setForm((prev) => ({ ...prev, contact: '' }));
      setForm((prev) => ({ ...prev, inst: '' }));
    }
    setForm((prev) => ({ ...prev, role: lv }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setEmailMsg('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    if (isChange) {
      if (form.password.length < 8) {
        setError('비밀번호는 8자 이상이어야 합니다.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      // ✅ 가입 시 약관/개인정보 동의 필수
      if (!agreeTerms || !agreePrivacy) {
        Swal.fire({
          icon: 'warning',
          title: '약관 동의 필요',
          text: '이용약관과 개인정보처리방침에 동의해 주세요.'
        });
        return;
      }
    }

    if (!form.name.trim()) {
      Swal.fire({ icon: 'error', title: '이름 입력', text: '이름을 입력해주세요.' });
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/users/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: isChange ? 'insert' : 'update',
          email: form.email,
          password: form.password,
          name: form.name,
          inst: form.inst,
          contact: form.contact,
          phone: form.phone,
          role: form.role,
          provider: 'local',
        }),
      });

      const data = await res.json();

      if (res.ok && data?.is_success) {
        await Swal.fire({
          icon: 'success',
          title: isChange ? '회원가입 성공' : '회원수정 성공',
          text: isChange ? '회원가입이 완료되었습니다!' : '회원정보 수정이 완료되었습니다'
        });
        isChange ? router.push('/login') : (location.href = '/');
      } else {
        Swal.fire({ icon: 'error', title: '회원가입 실패', text: data?.message ?? '회원가입 실패' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: '서버 통신 오류', text: '서버와 통신 중 오류가 발생했습니다.' });
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />

      <div className="flex justify-center items-center py-12 w-full">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white shadow-md rounded-2xl p-8 space-y-5"
        >
          <h2 className="text-2xl font-bold text-center">회원가입</h2>

          {/* 회원 구분 탭 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                aria-pressed={form.role === 'COMPANY'}
                onClick={() => selectLevel('COMPANY')}
                disabled={!isChange}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition
                  ${form.role === 'COMPANY' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}
                `}
              >
                자활기업
              </button>
              <button
                type="button"
                aria-pressed={form.role === 'CLIENT'}
                onClick={() => selectLevel('CLIENT')}
                disabled={!isChange}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition
                  ${form.role === 'CLIENT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}
                `}
              >
                기관회원
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600 px-1">
              선택한 회원 구분에 따라 권한과 이용 메뉴가 달라질 수 있습니다.
            </p>
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange({ email: e.target.value })}
              onBlur={(e) => { isChange && emailCheck(e.target.value); }}
              readOnly={!isChange}
              required
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isCheck ? 'border-gray-300 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
              }`}
            />
            {emailMsg && (
              <p className={`mt-1 text-sm ${isCheck === false ? 'text-red-600' : 'text-blue-600'}`}>
                {emailMsg}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          {isChange && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange({ password: e.target.value })}
                  required
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>

              {/* 비밀번호 재확인 */}
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호 재확인</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange({ confirmPassword: e.target.value })}
                  required
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
            </>
          )}

          {/* 기관명(기관회원만) */}
          {form.role === 'CLIENT' && (
            <div>
              <label className="block text-sm font-medium mb-1">기관명</label>
              <input
                type="tel"
                value={form.inst}
                onChange={(e) => handleChange({ inst: e.target.value })}
                placeholder="서울 강남구 서초1동 주민센터"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {form.role === 'CLIENT' ? '담당자명' : '대표자명'}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange({ name: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 연락처 (기관회원만) */}
          {form.role === 'CLIENT' && (
            <div>
              <label className="block text-sm font-medium mb-1">연락처</label>
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => handleChange({ contact: formContact(e.target.value) })}
                placeholder="02-1234-1234"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 휴대폰 (phone) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {form.role === 'CLIENT' ? '담당자 휴대폰' : '대표자 휴대폰'}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange({ phone: formatMobile(e.target.value) })}
              placeholder="010-1234-5678"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ 약관/개인정보 동의 (가입 시에만 필수) */}
          {isChange && (
            <div className="space-y-3 pt-1">
              <details className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                  이용약관 보기
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-gray-700">
{siteLoading ? '불러오는 중...' : (site?.terms_text || '등록된 이용약관이 없습니다.')}
                </pre>
              </details>

              <details className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                  개인정보처리방침 보기
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-gray-700">
{siteLoading ? '불러오는 중...' : (site?.privacy_text || '등록된 개인정보처리방침이 없습니다.')}
                </pre>
              </details>

              <div className="flex items-center gap-2">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="agreeTerms" className="text-xs text-gray-700">
                  이용약관에 동의합니다.
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="agreePrivacy"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                />
                <label htmlFor="agreePrivacy" className="text-xs text-gray-700">
                  개인정보처리방침에 동의합니다.
                </label>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            disabled={isChange && (!agreeTerms || !agreePrivacy)}
          >
            {isChange ? '가입하기' : '수정하기'}
          </button>
          {!isChange ? '비밀번호 변경은 마이페이지 변경하셔야 합니다.' : ''}
        </form>
      </div>

      <Footer />
    </div>
  );
}
