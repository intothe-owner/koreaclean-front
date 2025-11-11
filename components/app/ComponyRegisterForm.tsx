"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";


import { zodResolver } from "@hookform/resolvers/zod";
import RegionMultiSelect from "../ui/RegionMultiSelect";
import { formatBizNo, formatCorpNo, formatMobile, formContact } from "@/lib/function";
import { baseUrl, CompanyItem } from "@/lib/variable";

import { useRouter } from "next/navigation";
import DaumPostcodeFinder, { ensureDaumPostcode } from "../ui/DaumPostcodeFinder";
import { ensureKakaoMaps, geocodeAddress } from "@/lib/KakaoMap";
import FileUpload, { UploadedFile } from "../ui/FileUpload";
import Swal from "sweetalert2";
import { CompanyTypeRadio } from "../ui/ComponyTypeRadio";
import { useSession } from "next-auth/react";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";




// ====== Small Tag Input Component ======
function TagInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const t = input.trim();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  };
  const removeTag = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div className="w-full">
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      <div className="rounded-2xl border border-neutral-300 bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
            >
              {t}
              <button
                type="button"
                aria-label={`remove ${t}`}
                className="ml-1 rounded-full px-1 text-neutral-500 hover:bg-neutral-100"
                onClick={() => removeTag(t)}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            className="flex-1 min-w-[160px] outline-none px-2 py-1"
            placeholder={placeholder ?? "엔터로 추가"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button type="button" onClick={addTag} className="rounded-lg border px-2 py-1 text-xs">
            추가
          </button>
        </div>

      </div>
      <div className="text-[12px]">엔터를 누르거나 추가 버튼을 누르면 {label}이 추가됩니다.</div>
    </div>
  );
}
// ====== Main Form Component ======
export default function CompanyCreateForm({
  saveEndpoint = "/backend/company/save", // 실제 서버 엔드포인트로 교체하세요 (예: `${baseUrl}/company`)
  uploadEndpoint = `/backend/upload/company-upload`,
  onCreated,
}: {
  saveEndpoint?: string;
  uploadEndpoint?: string; // 파일 업로드 API가 따로 있을 경우 전달
  onCreated?: (created: any) => void;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  // 우편번호 레이어
  const [showFinder, setShowFinder] = useState(false);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<CompanyItem>({
    name: '',           // 기업명
    ceo: session?.user?.name ?? '',              //대표명
    biz_no: '',           //사업자번호
    corp_no: '',          //법인번호
    start_date: '',       //설립일
    company_type: '',     //회사형태
    post_code: '',        //우편번호
    address: '',          //주소
    address_detail: '',    //상세주소
    lat: 0,              //위도
    lng: 0,              //경도
    tel: '',              //연락처
    fax: '',              //팩스번호
    email: session?.user?.email,            //이메일
    homepage: '',        //홈페이지
    regions: [],            //주력 지역
    certs: [],              //자격증/경력
    documents: JSON.parse('[]'),          //첨부파일
  })
  const debounceRef = useRef<number | null>(null);
  const handleChange = (update: Partial<CompanyItem>) => {
    try {
      setForm((prev) => {
        const next = { ...prev, ...update };
        return next;
      })
    } catch (error) {

    }

  }
  // 선택 처리
  const handleDaumSelect = (data: any) => {
    const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
    handleChange({
      address: addr || "",
      post_code: data.zonecode || "",
    });
    setShowFinder(false); // 선택 후 모달 닫기(선택)
  };
  // 모달 열릴 때 SDK들 선로드
  useEffect(() => {

    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "";
    (async () => {
      try {
        await ensureDaumPostcode();
        if (KAKAO_KEY) await ensureKakaoMaps(KAKAO_KEY);
      } catch (e) {
        console.warn("SDK preload failed:", e);
      }
    })();
  }, []);
  const address = form.address; // 최소 의존성으로 꺼내기(객체 전체 X)
  // 주소가 바뀌면 자동 지오코딩
  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "";

    // 주소 없으면 좌표 초기화
    if (!address?.trim()) {
      handleChange({
        lat: 0,
        lng: 0,
      });
      return;
    }

    // 너무 짧은 중간 입력은 스킵
    if (address?.trim().length < 5) return;

    // 디바운스
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        await ensureKakaoMaps(KEY);

        const point = await geocodeAddress(form.address || '');
        if (point) {
          console.log(point);
          handleChange({
            lat: point.lat,
            lng: point.lng,
          });

        } else {
          // 실패 시 초기화(선택)
          handleChange({
            lat: 0,
            lng: 0,
          });
        }
      } catch (err) {
        console.error("[Geocode] Kakao load or geocode failed:", err);
        handleChange({
          lat: 0,
          lng: 0,
        });
      }
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [address]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    // 3) payload 구성
    const payload = {
      name: form.name,           // 기업명
      ceo: form.ceo,              //대표명
      biz_no: form.biz_no,           //사업자번호
      corp_no: form.corp_no,          //법인번호
      start_date: form.start_date,       //설립일
      company_type: form.company_type,     //회사형태
      post_code: form.post_code,        //우편번호
      address: form.address,          //주소
      address_detail: form.address_detail,    //상세주소
      lat: form.lat,              //위도
      lng: form.lng,              //경도
      tel: form.tel,              //연락처
      fax: form.fax,              //팩스번호
      email: form.email,            //이메일
      homepage: form.homepage,        //홈페이지
      regions: form.regions,            //주력 지역
      certs: form.certs,              //자격증/경력
      documents: Array.isArray(form.documents) ? (form.documents as unknown as UploadedFile[]) : [],          //첨부파일
      owner_user_id: session?.user?.id ?? null,
    };

    try {
      // 필요시 토큰 헤더(예: useAuth에 accessToken이 있다면)
      const token = (session?.user as any)?.accessToken || (session?.user as any)?.token;

      const res = await fetchWithAuth(saveEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: "include", // 쿠키 인증도 쓴다면
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `save failed (${res.status})`);
      }

      const json = await res.json();
      router.push('/company/thanks')

    } catch (e: any) {
      Swal.fire({ icon: "error", title: "저장 실패", text: e?.message || "요청에 실패했습니다." });
    }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">업체 등록</h1>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">업체명 *</label>
            <input
              value={form.name}
              required
              onChange={(e) => handleChange({ name: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="예: 제로브이"
            />

          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">대표명</label>
            <input
              value={form.ceo}
              required
              onChange={(e) => handleChange({ ceo: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="예: 김대표"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">사업자등록번호</label>

            <input
              value={form.biz_no}
              required
              onChange={(e) => handleChange({ biz_no: formatBizNo(e.target.value) })}
              inputMode="numeric"
              placeholder="예: 123-45-67890"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">법인번호</label>

            <input
              value={form.corp_no}
              required
              onChange={(e) => handleChange({ corp_no: formatCorpNo(e.target.value) })}
              inputMode="numeric"
              placeholder="예: 1111-22-333333-4"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">연락처</label>
            <input
              value={form.tel}
              required
              onChange={(e) => handleChange({ tel: formContact(e.target.value) })}
              inputMode="tel"
              placeholder="예: 02-1234-5678"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">팩스번호</label>
            <input
              value={form.fax}
              onChange={(e) => handleChange({ fax: formContact(e.target.value) })}
              inputMode="tel"
              placeholder="예: 02-1234-5678"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
         
        </div>
         <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">설립일</label>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={(e) => handleChange({ start_date: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="이메일 주소"
            />
          </div>
          <div>
            <CompanyTypeRadio
              value={form.company_type ?? ""}
              onChange={(v) => handleChange({ company_type: v })}
            />
          </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">이메일주소</label>
          <input
            inputMode="email"
            required
            value={form.email}
            onChange={(e) => handleChange({ email: e.target.value })}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            placeholder="이메일 주소"
          />
        </div>
        {/* 우편번호 */}
        <div className="md:col-span-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                우편번호 <span className="text-red-500">*</span>
              </label>
              <input
                value={form.post_code}
                required
                onChange={(e) => handleChange({ post_code: e.target.value })}
                placeholder="예: 48053"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFinder(true)}
              className="shrink-0 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
            >
              주소검색
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">주소</label>
          <input
            value={form.address}
            required
            onChange={(e) => handleChange({ address: e.target.value })}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            placeholder="도로명 주소"
          />
        </div>
        <div>
          <input
            value={form.address_detail}
            onChange={(e) => handleChange({ address_detail: e.target.value })}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            placeholder="상세 주소"
          />
        </div>


        {/* 태그 입력들 */}
        <RegionMultiSelect
          label="서비스 가능 지역"
          value={form.regions ?? []}
          onChange={(next) => handleChange({ regions: next })}
          className="mt-2"
        />
        <TagInput
          label="자격증/경력"
          value={form.certs ?? []}
          onChange={(next) => handleChange({ certs: next })}
        />
        {/* 5) 첨부파일 */}

        <div>

          <FileUpload
            label="첨부 파일"
            uploadEndpoint={uploadEndpoint}
            value={Array.isArray(form.documents) ? (form.documents as unknown as UploadedFile[]) : []}
            onChange={(files) => handleChange({ documents: files as unknown as JSON })}
            accept="사업자 등록증/자격증/경력증명서/건물위생관리업신고증 등 올려주세요"
            maxFiles={10}
            maxSizeMB={100}
            multiple
          />
        </div>


        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => { }}
            className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
          >
            초기화
          </button>
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            신청하기
          </button>
          {/* 레이어 우편번호 검색창 */}
          {showFinder && (
            <DaumPostcodeFinder
              open={showFinder}
              onClose={() => setShowFinder(false)}
              onSelect={handleDaumSelect}
              height={480}
              maxSuggestItems={5}
            // variant 생략 => 기본 'modal'
            />
          )}
        </div>
      </form>
    </div>
  );
}
