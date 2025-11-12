// app/customer/qna/page.tsx
'use client';

import Footer from '@/components/app/Footer';
import Header from '@/components/app/Header';
import CenterSwiper from '@/components/app/CenterSwiper';
import TabsBar, { TabItem } from '@/components/app/TabMenu';
import { useMemo, useRef, useState } from 'react';
import HeroCard from '@/components/app/HeroCard';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// ⬇️ FileUpload 경로는 프로젝트 구조에 맞게 조정하세요.
// service-request에서 쓰던 컴포넌트를 그대로 재사용합니다.
import FileUpload, { UploadedFile } from '@/components/ui/FileUpload'; 

import { formContact } from '@/lib/function';
import Link from 'next/link';

import { useSession } from 'next-auth/react';
import { fetchWithAuth } from '@/lib/fetchWitgAuth';
import { baseUrl } from '@/lib/variable';
type QnaType = '서비스 신청' | '변경' | '취소' | '불만사항' | '제안';
const MAX_CONTENT = 1000;

export default function QnaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 탭
  const items: TabItem[] = [
    { label: '공지사항', href: '/customer/notice/list' },
    { label: '자주 묻는 질문', href: '/customer/faq' },
    { label: '문의하기', href: '/customer/qna' },
    { label: '다운로드', href: '/customer/download/list' },
  ];
  const [tab, setTab] = useState<string>('reserve');

  // ----- 상태 -----
  const [type, setType] = useState<QnaType>('서비스 신청');
  const [org, setOrg] = useState(session?.user.inst?? '');
  const [manager, setManager] = useState(session?.user.name ?? '');
  const [tel, setTel] = useState(session?.user.contact ?? '');
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const requiredOk = useMemo(
    () => org.trim() && manager.trim() && tel.trim() && emailValid && title.trim(),
    [org, manager, tel, emailValid, title]
  );
  const contentLeft = MAX_CONTENT - content.length;
  const contentTooLong = content.length > MAX_CONTENT;

  const resetForm = () => {
    setType('서비스 신청');
    setOrg(session?.user?.inst ?? '');
    setManager(session?.user?.name ?? '');
    setTel(session?.user?.contact ?? '');
    setEmail(session?.user?.email ?? '');
    setTitle('');
    setContent('');
    setFiles([]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredOk || contentTooLong) return;

    try {
      setSubmitting(true);

      // ✅ service-request와 동일한 패턴: JSON 전송 + token 헤더 + credentials
      const payload = {
        type,
        org_name: org.trim(),
        manager_name: manager.trim(),
        tel: tel.trim(),
        email: email.trim(),
        title: title.trim(),
        content,
        files, // FileUpload에서 받은 업로드 완료 메타 [{id,url,name,size,type,...}]
        user_id: session?.user?.id ?? null,
      };

      const token = (session?.user as any)?.accessToken || (session?.user as any)?.token;

      const res = await fetchWithAuth('/backend/qna/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `save failed (${res.status})`);
      }

      const json = await res.json();
      if (!json?.is_success) throw new Error(json?.message || '등록 실패');

      // ✅ 동일: 완료 후 thanks 페이지 이동
      router.push('/customer/qna/thanks');
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: '등록 실패', text: err?.message || '요청에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  
  return (
    <div className="relative w-full min-h-screen bg-[#f9f5f2]">
      <Header />
      <CenterSwiper />
      <HeroCard title="경로당 맞춤형 청소" content="예약부터 사후관리까지 한번에" />

      {/* 탭 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
          <TabsBar items={items} mode="route" value={tab} onChange={setTab} />
        </div>
      </section>

      {/* QnA 폼 */}
      <section className="relative z-10 bg-[#f9f5f2]">
        <div className="max-w-7xl mx-auto px-6 pt-0 pb-12">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-black/10">
              <div className="flex items-center justify-between">
    <h1 className="text-xl font-semibold text-gray-900">문의 등록</h1>
    <Link
      href="/customer/qna/list" // ← 내 문의 목록 라우트에 맞게 조정 가능
      className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
    >
      내 문의 보기
    </Link>
  </div>
             
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                {/* 문의 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">문의 유형</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as QnaType)}
                    className="h-10 w-56 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="서비스 신청">서비스 신청</option>
                    <option value="변경">변경</option>
                    <option value="취소">취소</option>
                    <option value="불만사항">불만사항</option>
                    <option value="제안">제안</option>
                  </select>
                </div>

                {/* 기관명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {
                      session?.user?.role==='COMPANY'?'회사명':'기관명'
                    } <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder={`${session?.user?.role==='COMPANY'?'회사명':'기관명'}을 입력하세요`}
                    className={`w-full h-11 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      org.trim() ? 'border-gray-300 focus:ring-indigo-500' : 'border-red-400 focus:ring-red-300'
                    }`}
                  />
                  {!org.trim() && <p className="mt-1 text-xs text-red-500">필수 입력 항목입니다.</p>}
                </div>

                {/* 담당자명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="담당자명을 입력하세요"
                    className={`w-full h-11 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      manager.trim() ? 'border-gray-300 focus:ring-indigo-500' : 'border-red-400 focus:ring-red-300'
                    }`}
                  />
                  {!manager.trim() && <p className="mt-1 text-xs text-red-500">필수 입력 항목입니다.</p>}
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={tel}
                    onChange={(e) => setTel(formContact(e.target.value))}
                    placeholder="02-123-4567 / 02-1234-5678 / 070-123-4567 / 010-1234-5678"
                    className={`w-full h-11 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      tel.trim() ? 'border-gray-300 focus:ring-indigo-500' : 'border-red-400 focus:ring-red-300'
                    }`}
                  />
                  {!tel.trim() && <p className="mt-1 text-xs text-red-500">필수 입력 항목입니다.</p>}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full h-11 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      email ? (emailValid ? 'border-gray-300 focus:ring-indigo-500' : 'border-red-400 focus:ring-red-300') : 'border-red-400 focus:ring-red-300'
                    }`}
                  />
                  {!email && <p className="mt-1 text-xs text-red-500">필수 입력 항목입니다.</p>}
                  {email && !emailValid && <p className="mt-1 text-xs text-red-500">이메일 형식이 올바르지 않습니다.</p>}
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문의 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="문의 제목을 입력하세요"
                    className={`w-full h-11 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      title.trim() ? 'border-gray-300 focus:ring-indigo-500' : 'border-red-400 focus:ring-red-300'
                    }`}
                  />
                  {!title.trim() && <p className="mt-1 text-xs text-red-500">필수 입력 항목입니다.</p>}
                </div>

                {/* 내용 */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-1">문의 내용</label>
                    <span className={`text-xs ${contentTooLong ? 'text-red-500' : 'text-gray-400'}`}>
                      {Math.max(0, contentLeft)}자 남음
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="문의 내용을 입력하세요 (선택)"
                    className={`w-full min-h-[180px] rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      contentTooLong ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />
                  {contentTooLong && (
                    <p className="mt-1 text-xs text-red-500">문의 내용은 최대 {MAX_CONTENT}자까지 입력할 수 있습니다.</p>
                  )}
                </div>

                {/* 첨부 파일: service-request와 동일한 FileUpload 메타 사용 */}
                <div>
                  <FileUpload
                    label="첨부 파일"
                    uploadEndpoint={`${baseUrl}/upload/qna-upload`}
                    value={files}
                    onChange={(list) => setFiles(list)}
                    accept="image/*,.pdf,.xlsx,.xls,.doc,.docx"
                    maxSizeMB={50}
  maxFiles={10}
                    multiple
                  />
                </div>

                {/* 액션 */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-50"
                  >
                    초기화
                  </button>
                  <button
                    type="submit"
                    disabled={!requiredOk || contentTooLong || submitting}
                    className="h-10 rounded-lg bg-gray-900 text-white px-5 text-sm hover:bg-black/90 disabled:opacity-50"
                  >
                    {submitting ? '등록 중…' : '등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
