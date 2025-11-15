// app/admin/service/page.tsx
"use client";

import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import DaumPostcodeFinder from "@/components/ui/DaumPostcodeFinder";

import { useSiteInfo } from "@/hooks/useSiteInfo";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { formatBizNo, formContact } from "@/lib/function";
import { baseUrl } from "@/lib/variable";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
function parseMetaTagsInput(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .flatMap(v => String(v).split(/[,\s]+/))
      .map(s => s.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10);
  }
  if (typeof input === "string") {
    const v = input.trim();
    if (!v) return [];
    // JSON 배열 우선
    if (v.startsWith("[") && v.endsWith("]")) {
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr)) return parseMetaTagsInput(arr);
      } catch {/* 무시 */ }
    }
    // 콤마/스페이스 분리
    return v
      .split(/[,\s]+/)
      .map(s => s.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
}
// --- 상단 타입/초기값 확장 ---
type FormState = {
  site_name: string;
  post_code: string;
  address: string;
  address_detail: string;
  biz_no: string;
  ceo_name: string;
  tel: string;
  fax: string;
  email: string;
  email_public: boolean;
  icon_file?: File | null;

  // ⬇️ 추가 필드
  site_description: string; // 사이트 설명
  meta_tags: string[];      // 메타 태그 칩
  terms_text: string;       // 이용약관
  privacy_text: string;     // 개인정보처리방침
};

const initialForm: FormState = {
  site_name: "",
  post_code: "",
  address: "",
  address_detail: "",
  biz_no: "",
  ceo_name: "",
  tel: "",
  fax: "",
  email: "",
  email_public: true,
  icon_file: null,

  // ⬇️ 추가 필드 초기값
  site_description: "",
  meta_tags: [],
  terms_text: "",
  privacy_text: "",
};


/** 페이지 컴포넌트 */
export default function SiteBasiInfoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen((prev) => !prev);




  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-xl font-bold">홈페이지 관리 &gt;&gt; 사이트 기본정보</h1>
          <p className="mb-4 text-sm text-gray-600">사이트 기본정보를 입력하는 폼입니다.</p>

          {/* 본문 카드 */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <SiteBasicInfoForm />
          </section>
        </main>
      </div>
    </div>
  );
}
// --- SiteBasicInfoForm 교체 ---
function SiteBasicInfoForm() {
  const { data, isLoading, isError } = useSiteInfo(); // ⬅️ 여기서 조회
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showFinder, setShowFinder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 서버 응답(snake_case) -> 폼 매핑
  const fillFormFromResponse = (item: any) => {
    setForm(prev => ({
      ...prev,
      site_name: item?.site_name ?? "",
      post_code: item?.post_code ?? "",
      address: item?.address ?? "",
      address_detail: item?.address_detail ?? "",
      biz_no: item?.biz_no ?? "",
      ceo_name: item?.ceo_name ?? "",
      tel: item?.tel ?? "",
      fax: item?.fax ?? "",
      email: item?.email ?? "",
      email_public: Boolean(item?.email_public ?? true),
      icon_file: null,

      site_description: item?.site_description ?? "",
      meta_tags: parseMetaTagsInput(item?.meta_tags), // ✅ 견고 파서 적용
      terms_text: item?.terms_text ?? "",
      privacy_text: item?.privacy_text ?? "",
    }));

    // ✅ 아이콘 URL 안전 처리 (null/절대/상대 모두)
    const url = item?.icon_url;
    if (url) {
      setPreview(/^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`);
    } else {
      setPreview(null);
    }
  };

  // ⬇️ useSiteInfo()의 data가 바뀔 때마다 폼에 반영
  useEffect(() => {
    console.log(data);
    if (data) fillFormFromResponse(data);
  }, [data]);
  console.log(form);
  const isValid = useMemo(() => {
    const emailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const descOk = form.site_description.length <= 300;
    return form.site_name.trim().length > 0 && emailOk && descOk;
  }, [form]);

  const handleDaumSelect = (data: any) => {
    const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
    handleChange({ address: addr || "", post_code: data.zonecode || "" });
    setShowFinder(false);
  };
  const handleChange = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      handleChange({ icon_file: null });
      setPreview(null);
      return;
    }
    handleChange({ icon_file: f });
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    handleChange({ icon_file: null });
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- 태그 입력 로직 (그대로) ----
  const [tagDraft, setTagDraft] = useState("");
  const commitTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, "");
    if (!t) return;
    if (t.length > 40) return alert("태그는 최대 40자까지 가능합니다.");
    if (form.meta_tags.includes(t)) return;
    if (form.meta_tags.length >= 10) return alert("태그는 최대 10개까지 가능합니다.");
    handleChange({ meta_tags: [...form.meta_tags, t] });
    setTagDraft("");
  };
  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", "Tab"].includes(e.key) || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft) {
      handleChange({ meta_tags: form.meta_tags.slice(0, -1) });
    }
  };
  const removeTag = (t: string) => handleChange({ meta_tags: form.meta_tags.filter((v) => v !== t) });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      alert("필수 항목을 확인해 주세요. (사이트명/이메일 형식/설명 글자수)");
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("site_name", form.site_name);
      fd.append("post_code", form.post_code);
      fd.append("address", form.address);
      fd.append("address_detail", form.address_detail);
      fd.append("biz_no", form.biz_no);
      fd.append("ceo_name", form.ceo_name);
      fd.append("tel", form.tel);
      fd.append("fax", form.fax);
      fd.append("email", form.email);
      fd.append("email_public", form.email_public ? "1" : "0");
      if (form.icon_file) fd.append("icon_file", form.icon_file);

      fd.append("site_description", form.site_description);
      fd.append("meta_tags", JSON.stringify(form.meta_tags));
      fd.append("terms_text", form.terms_text);
      fd.append("privacy_text", form.privacy_text);

      const res = await fetchWithAuth(`${baseUrl}/site/save`, { method: "POST", body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.is_success === false) {
        throw new Error(payload?.message || "저장 중 오류가 발생했습니다.");
      }

      alert("저장되었습니다.");
      location.reload();

    } catch (err: any) {
      console.error(err);
      alert(err?.message || "저장 실패");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- 로딩/에러 UI ----
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-10 animate-pulse rounded bg-gray-200" />
          <div className="h-10 animate-pulse rounded bg-gray-200" />
          <div className="h-10 animate-pulse rounded bg-gray-200" />
          <div className="h-10 animate-pulse rounded bg-gray-200" />
          <div className="col-span-2 h-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }
  if (isError) {
    return <div className="p-6 text-sm text-red-600">사이트 정보를 불러오지 못했습니다.</div>;
  }

  return (
    <form onSubmit={onSubmit} className="p-6">
      {/* ====== 1) 기본 정보 ====== */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 사이트명 */}
        <div>
          <label className="mb-1 block text-sm font-medium">사이트명 *</label>
          <input
            type="text"
            value={form.site_name}
            onChange={(e) => handleChange({ site_name: e.target.value })}
            placeholder="예) 한국클린쿱"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 사업자번호 */}
        <div>
          <label className="mb-1 block text-sm font-medium">사업자번호</label>
          <input
            type="text"
            value={form.biz_no}
            onChange={(e) => handleChange({ biz_no: formatBizNo(e.target.value) })}
            placeholder="000-00-00000"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 대표명 */}
        <div>
          <label className="mb-1 block text-sm font-medium">대표명</label>
          <input
            type="text"
            value={form.ceo_name}
            onChange={(e) => handleChange({ ceo_name: e.target.value })}
            placeholder="홍길동"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="mb-1 block text-sm font-medium">전화번호</label>
          <input
            type="tel"
            value={form.tel}
            onChange={(e) => handleChange({ tel: formContact(e.target.value) })}
            placeholder="02-1234-5678"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 팩스번호 */}
        <div>
          <label className="mb-1 block text-sm font-medium">팩스번호</label>
          <input
            type="tel"
            value={form.fax}
            onChange={(e) => handleChange({ fax: formContact(e.target.value) })}
            placeholder="02-1234-5679"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 이메일 + 공개 여부 */}
        <div>
          <label className="mb-1 block text-sm font-medium">이메일주소</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange({ email: e.target.value })}
            placeholder="admin@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.email_public}
              onChange={(e) => handleChange({ email_public: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            이메일 주소 공개
          </label>
        </div>

        {/* 우편번호 */}
        <div>
          <label className="mb-1 block text-sm font-medium">우편번호</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.post_code}
              onChange={(e) => handleChange({ post_code: e.target.value })}
              placeholder="00000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowFinder(true)}
              className="shrink-0 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
            >
              주소검색
            </button>
          </div>
        </div>

        {/* 기본주소 */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">기본주소</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange({ address: e.target.value })}
            placeholder="도로명 주소"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 상세주소 */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">상세주소</label>
          <input
            type="text"
            value={form.address_detail}
            onChange={(e) => handleChange({ address_detail: e.target.value })}
            placeholder="상세 주소(동/호 등)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 사이트 아이콘 업로드 */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">사이트 아이콘</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="icon preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  미리보기
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
              />
              {preview && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  제거
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">권장: 정사각형 PNG/SVG, 512×512</p>
        </div>
      </div>

      {/* ====== 2) 메타 정보 ====== */}
      <div className="mt-8 grid grid-cols-1 gap-6">
        {/* 사이트 설명 */}
        <div>
          <label className="mb-1 block text-sm font-medium">사이트 설명</label>
          <textarea
            rows={4}
            value={form.site_description}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= 300) handleChange({ site_description: v });
            }}
            placeholder="검색엔진과 공유 미리보기(OG) 설명에 사용됩니다. (최대 300자 권장)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {form.site_description.length}/300
          </div>
        </div>

        {/* 사이트 메타태그 */}
        <div>
          <label className="mb-2 block text-sm font-medium">사이트 메타태그</label>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 p-2">
            {form.meta_tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="rounded p-0.5 text-blue-600 hover:bg-blue-100"
                  aria-label={`${t} 삭제`}
                  title="삭제"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder="태그 입력 후 Enter (최대 10개)"
              className="min-w-[160px] flex-1 border-0 px-1 py-1 text-sm focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            예) 클린쿱, 경로당청소, 전문소독 &nbsp;•&nbsp; Enter/쉼표/스페이스로 태그 추가 · 최대 10개
          </p>
        </div>
      </div>

      {/* ====== 3) 정책 문서 ====== */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 이용약관 */}
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium">이용약관</label>
          <textarea
            rows={14}
            value={form.terms_text}
            onChange={(e) => handleChange({ terms_text: e.target.value })}
            placeholder="서비스 이용에 관한 규정, 책임의 한계, 이용자 의무 등을 기입하세요."
            className="w-full whitespace-pre-wrap rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {form.terms_text.length}자
          </div>
        </div>

        {/* 개인정보처리방침 */}
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium">개인정보처리방침</label>
          <textarea
            rows={14}
            value={form.privacy_text}
            onChange={(e) => handleChange({ privacy_text: e.target.value })}
            placeholder="수집 항목, 이용 목적, 보관·파기, 제3자 제공, 처리위탁, 이용자 권리 등을 기입하세요."
            className="w-full whitespace-pre-wrap rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {form.privacy_text.length}자
          </div>
        </div>
      </div>

      {/* 우편번호 레이어 */}
      {showFinder && (
        <DaumPostcodeFinder
          open={showFinder}
          onClose={() => setShowFinder(false)}
          onSelect={handleDaumSelect}
          height={480}
          maxSuggestItems={5}
        />
      )}

      {/* 액션 버튼 */}
      <div className="mt-8 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setForm(initialForm);
            clearFile();
          }}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          초기화
        </button>
        <button
          type="submit"
          disabled={submitting || !isValid}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
