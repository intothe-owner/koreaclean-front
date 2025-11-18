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
  saveEndpoint = "/backend/company/save",
  uploadEndpoint = `${baseUrl}/upload/company-upload`,
  onCreated,
}: {
  saveEndpoint?: string;
  uploadEndpoint?: string;
  onCreated?: (created: any) => void;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 업체 정보 로딩 & 수정 모드 여부
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // 우편번호 레이어
  const [showFinder, setShowFinder] = useState(false);
  const layerRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<CompanyItem>({
    name: "", // 기업명
    ceo: session?.user?.name ?? "", // 대표명
    biz_no: "", // 사업자번호
    corp_no: "", // 법인번호
    start_date: "", // 설립일
    company_type: "", // 회사형태
    post_code: "", // 우편번호
    address: "", // 주소
    address_detail: "", // 상세주소
    lat: 0, // 위도
    lng: 0, // 경도
    tel: "", // 연락처
    fax: "", // 팩스번호
    email: (session?.user as any)?.email ?? "", // 이메일
    homepage: "", // 홈페이지
    regions: [], // 주력 지역
    certs: [], // 자격증/경력
    documents: JSON.parse("[]"), // 첨부파일
  });

  const debounceRef = useRef<number | null>(null);

  const handleChange = (update: Partial<CompanyItem>) => {
    try {
      setForm((prev) => {
        const next = { ...prev, ...update };
        return next;
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 1) 로그인한 사용자가 업체 회원이면 내 업체 정보 자동 로딩
  // 1) 로그인한 사용자가 업체 회원이면 내 업체 정보 자동 로딩
  useEffect(() => {
    if (status !== "authenticated") return;
    const user: any = session?.user;
    if (!user?.is_company) return;

    (async () => {
      try {
        setLoadingCompany(true);

        const res = await fetchWithAuth(`${baseUrl}/company/my`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `업체 정보를 불러오지 못했습니다. (${res.status})`);
        }

        const data = await res.json();
        console.log("[company/my]", data); // 실제 응답 확인용

        const c: any = data?.company ?? data;

        // ✅ start_date를 YYYY-MM-DD 문자열로 정규화
        const normalizeDate = (v: any): string => {
          if (!v) return "";
          if (typeof v === "string") {
            return v.slice(0, 10); // "2024-11-18T..." → "2024-11-18"
          }
          if (v instanceof Date) {
            const yyyy = v.getFullYear();
            const mm = String(v.getMonth() + 1).padStart(2, "0");
            const dd = String(v.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
          }
          return String(v).slice(0, 10);
        };

        // ✅ documents 문자열/JSON/기타 형태 모두 대응 + UploadedFile 형태로 맞추기
        const normalizeDocs = (raw: any): UploadedFile[] => {
          let arr: any[] = [];

          if (Array.isArray(raw)) {
            arr = raw;
          } else if (typeof raw === "string" && raw.trim()) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) arr = parsed;
            } catch (err) {
              console.warn("[company/my] documents JSON 파싱 실패:", err, raw);
            }
          } else if (raw && typeof raw === "object") {
            // 혹시 객체 한 개만 오는 경우
            arr = [raw];
          }

          // FileUpload에서 기대하는 UploadedFile 형태로 살짝 보정
          return arr.map((d: any) => {
            // 이미 맞는 형태라고 가정되는 경우
            if (d.url || d.path || d.Location) {
              return {
                url: d.url ?? d.path ?? d.Location ?? "",
                key: d.key ?? d.Key ?? d.id ?? undefined,
                originalName: d.originalName ?? d.name ?? d.filename ?? "",
                size: d.size ?? 0,
                mimetype: d.mimetype ?? d.type ?? "",
                // 그 외 필드는 그대로 유지
                ...d,
              } as UploadedFile;
            }
            // 그래도 없으면 최대한 유지
            return d as UploadedFile;
          });
        };

        const docs = normalizeDocs(c.documents);
        
        console.log("[company/my] normalized docs:", docs);

        setForm((prev) => ({
          ...prev,
          ...c,
          id: c.id, // ← 중요: 수정 모드 위해 id도 저장
          start_date: normalizeDate(c.start_date),
          regions: Array.isArray(c.regions) ? c.regions : [],
          certs: Array.isArray(c.certs) ? c.certs : [],
          documents: docs,
        }));

        setIsEditMode(true);
      } catch (e: any) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "업체 정보 조회 실패",
          text: e?.message || "등록된 업체 정보를 불러오지 못했습니다.",
        });
      } finally {
        setLoadingCompany(false);
      }
    })();
  }, [status, session]);



  // 주소 검색 선택 처리
  const handleDaumSelect = (data: any) => {
    const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
    handleChange({
      address: addr || "",
      post_code: data.zonecode || "",
    });
    setShowFinder(false); // 선택 후 모달 닫기
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

  const address = form.address;

  // 주소가 바뀌면 자동 지오코딩
  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "";

    if (!address?.trim()) {
      handleChange({
        lat: 0,
        lng: 0,
      });
      return;
    }

    if (address.trim().length < 5) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        await ensureKakaoMaps(KEY);
        const point = await geocodeAddress(form.address || "");
        if (point) {
          console.log(point);
          handleChange({
            lat: point.lat,
            lng: point.lng,
          });
        } else {
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

    const payload = {
      id: (form as any).id,   // ✅ 있으면 수정, 없으면 신규
      name: form.name,
      ceo: form.ceo,
      biz_no: form.biz_no,
      corp_no: form.corp_no,
      start_date: form.start_date,
      company_type: form.company_type,
      post_code: form.post_code,
      address: form.address,
      address_detail: form.address_detail,
      lat: form.lat,
      lng: form.lng,
      tel: form.tel,
      fax: form.fax,
      email: form.email,
      homepage: form.homepage,
      regions: form.regions,
      certs: form.certs,
      documents: Array.isArray(form.documents)
        ? (form.documents as unknown as UploadedFile[])
        : [],
      owner_user_id: (session?.user as any)?.id ?? null,
      // 나중에 서버에서 "id가 있으면 수정, 없으면 신규" 로 처리하고 싶으면 여기에 id 추가
      // id: (form as any).id,
    };

    try {
      const token = (session?.user as any)?.accessToken || (session?.user as any)?.token;

      const res = await fetchWithAuth(saveEndpoint, {
        method: "POST", // 지금은 그대로 POST 유지 (서버에서 upsert 로직 처리 가능)
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `save failed (${res.status})`);
      }

      const json = await res.json();

      if (onCreated) onCreated(json);
      router.push("/company/thanks");
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "저장 실패", text: e?.message || "요청에 실패했습니다." });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">
        {isEditMode ? "업체 정보 수정" : "업체 등록"}
      </h1>
      {loadingCompany && (
        <p className="text-sm text-neutral-500">등록된 업체 정보를 불러오는 중입니다...</p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              업체명 *
            </label>
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
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              사업자등록번호
            </label>
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
              placeholder="예: 123456-1234567"
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

        {/* 첨부파일 */}
        <div>
          <FileUpload
  label="첨부 파일"
  uploadEndpoint={uploadEndpoint}
  value={
    Array.isArray(form.documents)
      ? (form.documents as unknown as UploadedFile[])
      : []
  }
  onChange={(files) => handleChange({ documents: files as unknown as JSON })}
  accept="사업자 등록증/자격증/경력증명서/건물위생관리업신고증 등 올려주세요"
  maxSizeMB={50}
  maxFiles={10}
  multiple
/>

        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              // 필요하면 초기화 로직 추가
            }}
            className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
          >
            초기화
          </button>
          <button
            type="submit"
            disabled={loadingCompany}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {isEditMode ? "정보 수정하기" : "신청하기"}
          </button>

          {showFinder && (
            <DaumPostcodeFinder
              open={showFinder}
              onClose={() => setShowFinder(false)}
              onSelect={handleDaumSelect}
              height={480}
              maxSuggestItems={5}
            />
          )}
        </div>
      </form>
    </div>
  );
}
