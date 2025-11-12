// app/service-request/page.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { baseUrl, RequestForm, SeniorItem } from "@/lib/variable";
import { formatMobile, formContact } from "@/lib/function";
import SeniorRegisterModal from "./SeniorRegisterModal";
import { BulkSeniorUploadModal } from "./BulkSeniorUploadModal";
import { useSeniorCenters } from "@/hooks/useSeniorCenter";
import Swal from "sweetalert2";
import FileUpload, { UploadedFile } from "../ui/FileUpload";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import ReactDatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import 'react-datepicker/dist/react-datepicker.css';

// 날짜 헬퍼
const toDateOnly = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const parseDateOnly = (s?: string) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(dt.getTime()) ? null : dt;
};
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (base: Date, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

// ===== 메인: 서비스 신청 폼 =====
export default function ServiceRequestForm({
  saveEndpoint = `/backend/request/save`,
  uploadEndpoint = `${baseUrl}/upload/request-upload`,
  onCreated,
}: {
  saveEndpoint?: string;
  uploadEndpoint?: string;
  onCreated?: (created: any) => void;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [seniors, setSeniors] = useState<SeniorItem[]>([]);
  const [openSeniorModal, setOpenSeniorModal] = useState(false);
  // 기존 상태들 아래에 추가
  const [otherService, setOtherService] = useState<string>("");
  const [form, setForm] = useState<RequestForm>({
    org_name: session?.user?.inst ?? '',//기관명
    contact_name: session?.user?.name ?? '',//담당자명
    contact_tel: session?.user?.contact ?? '',//사무실연락처
    contact_phone: session?.user?.phone ?? '',//담당자 연락처
    contact_email: session?.user?.email ?? '',//담당자 이메일주소
    seniors: JSON.parse('[]'),//경로당 정보
    service_type: JSON.parse('[]'),//서비스타입
    hope_date: '',
    etc: '',
    files: JSON.parse('[]'),
    user_id: Number(session?.user?.id)
  });
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const toggleServiceType = (v: string) =>
    setServiceTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  // ▼▼▼ 추가 상태: DB 목록/선택/로딩 ▼▼▼
  // ▼ react-query 목록 불러오기
  const { data: centers = [], isLoading, isError, error, refetch, del } = useSeniorCenters();
  const [sel, setSel] = useState<Record<number, boolean>>({}); // id -> checked
  // ▼ 수정 코드
  // centers의 "아이디 목록"이 바뀔 때만 동작하도록 키를 만든다.
  const idsKey = useMemo(() => centers.map(c => c.id).join(','), [centers]);

  useEffect(() => {
    setSel((prev) => {
      // 기존 선택값 유지 + 새 항목은 false 로 초기화
      const next: Record<number, boolean> = {};
      for (const c of centers) {
        next[c.id] = prev[c.id] ?? false;
      }

      // 변화 없으면 상태 업데이트 생략 (무한 루프 차단)
      const sameLength = Object.keys(prev).length === Object.keys(next).length;
      const sameValues = centers.every(c => prev[c.id] === next[c.id]);
      if (sameLength && sameValues) return prev;

      return next;
    });
  }, [idsKey, centers]);
  const allChecked = useMemo(
    () => centers.length > 0 && centers.every((c) => sel[c.id]),
    [centers, sel]
  );

  const toggleAll = () => {
    const next: Record<number, boolean> = {};
    centers.forEach((c) => (next[c.id] = !allChecked));
    setSel(next);
  };
  const toggleOne = (id: number) => setSel((prev) => ({ ...prev, [id]: !prev[id] }));

  // 삭제
  const handleDelete = async (row: SeniorItem) => {

    Swal.fire({
      title: `${row.name} 삭제`,
      icon: 'question',
      html: `${row.name}을 삭제하시겠습니까?<br/>삭제하시면 복구는 불가능합니다.`,
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await del.mutateAsync(row.id);
          // invalidateQueries는 훅에서 이미 처리됨
        } catch (e: any) {
          alert(e?.message || String(e));
        }
      }
    })

  };

  const handleEdit = (row: SeniorItem) => {
    // 수정 모달/페이지로 연결
    alert(`수정 모달 열기: ${row.name}`);
  };


  const handleChange = (update: Partial<RequestForm>) => {
    try {
      setForm((prev) => {
        const next = { ...prev, ...update };
        return next;
      })
    } catch (error) {

    }

  }
  const handleAddSenior = (item: SeniorItem) => {
    setSeniors((prev) => [...prev, item]);
    // form.seniorInfo와 동기화 (배열 보장)
    const arr = Array.isArray((form as any).seniorInfo) ? ((form as any).seniorInfo as any[]) : [];
    handleChange({ seniors: [...arr, item] as any });
  };
  const onRefetch = () => {
    refetch();
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) 선택된 경로당 추출
    const selectedCenters = centers.filter((c) => sel[c.id]);
    if (selectedCenters.length === 0) {
      Swal.fire({ icon: "warning", title: "경로당 선택", text: "최소 1개 이상의 경로당을 선택하세요." });
      return;
    }

    // 2) 필수값 간단 검증
    if (!form.org_name?.trim() || !form.contact_name?.trim()) {
      Swal.fire({ icon: "warning", title: "필수 항목", text: "기관명/담당자명을 확인하세요." });
      return;
    }
    if (!form.contact_tel?.trim() || !form.contact_phone?.trim()) {
      Swal.fire({ icon: "warning", title: "연락처 확인", text: "사무실/담당자 연락처를 확인하세요." });
      return;
    }

    // 3) payload 구성
    const payload = {
      org_name: form.org_name,
      contact_name: form.contact_name,
      contact_tel: form.contact_tel,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      // 선택된 경로당 최소정보(백엔드에서 Join할거면 id만으로 충분)
      seniors: selectedCenters.map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        address_detail: c.address_detail,
        lat: c.lat,
        lng: c.lng,
      })),
      // 서비스 타입은 문자열 배열로
      service_types: serviceTypes, // ["토탈케어서비스","소독방역",...]
      service_types_other: serviceTypes.includes("기타") && otherService.trim() ? otherService.trim() : null,
      hope_date: form.hope_date || null,
      etc: form.etc || "",
      // 이미 업로드 끝난 파일 메타(응답 포맷: {id,url,name,size,type,name_original?})
      files: Array.isArray(form.files) ? (form.files as unknown as UploadedFile[]) : [],
      user_id: session?.user?.id ?? null,
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
      router.push('/request/thanks')

    } catch (e: any) {
      Swal.fire({ icon: "error", title: "저장 실패", text: e?.message || "요청에 실패했습니다." });
    }
  };
  const today = useMemo(() => startOfDay(new Date()), []);
const oneWeekLater = useMemo(() => startOfDay(addDays(today, 7)), [today]);

useEffect(() => {
  if (!form.hope_date) {
    setForm(prev => ({ ...prev, hope_date: toDateOnly(oneWeekLater) }));
  }
}, [oneWeekLater]); // 최초 진입 시 기본값  + 오프바이원 방지
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">서비스 신청</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 1) 기본 정보 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              기관명 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.org_name}
              required
              onChange={(e) => handleChange({ org_name: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="예: ○○시 노인복지관"
            />

          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              담당자명 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.contact_name}
              required
              onChange={(e) => handleChange({ contact_name: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="예: 홍길동"
            />

          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              사무실 전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              inputMode="tel"
              required
              value={form.contact_tel}
              onChange={(e) => handleChange({ contact_tel: formContact(e.target.value) })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="예: 010-0000-0000"
            />

          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              담당자 휴대폰번호 <span className="text-red-500">*</span>
            </label>
            <input
              inputMode="tel"
              required
              value={form.contact_phone}
              onChange={(e) => handleChange({ contact_phone: formatMobile(e.target.value) })}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              placeholder="예: 010-0000-0000"
            />

          </div>


        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">이메일</label>
          <input
            type="email"
            required
            value={form.contact_email}
            onChange={(e) => handleChange({ contact_email: e.target.value })}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            placeholder="you@example.com"
          />

        </div>
        {/* 경로당*/}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            경로당 선택 <span className="text-red-500">*</span>
          </label>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              등록된 경로당 수:{' '}
              <span className="font-medium">
                {isLoading ? '로딩중' : centers.length}
              </span>
              건
            </p>
            <div>
              <button
                type="button"
                onClick={() => setOpenSeniorModal(true)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
              >
                경로당 등록하기
              </button>
              <button
                type="button"
                onClick={() => setOpenBulkModal(true)}
                className="rounded-xl border mx-1 px-3 py-2 text-sm hover:bg-neutral-50"
              >
                엑셀로 등록
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                title="목록 새로고침"
              >
                새로고침
              </button>
            </div>

            <BulkSeniorUploadModal
              open={openBulkModal}
              onClose={() => setOpenBulkModal(false)}
              refetch={() => onRefetch()}
            />
          </div>

          {/* 목록 테이블 */}
          <div className="mt-3 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between border-b p-3 text-sm">
              <div className="font-medium">경로당 목록</div>
              <div className="text-neutral-500">
                {isLoading ? '불러오는 중…' : `총 ${centers.length}건`}
              </div>
            </div>

            {isError ? (
              <div className="p-4 text-sm text-rose-600">
                {(error as Error)?.message || '목록 조회 실패'}
              </div>
            ) : (
              <div className="max-h-72 overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white text-neutral-500">
                    <tr>
                      <th className="px-3 py-2 w-[44px]">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={allChecked}
                          onChange={toggleAll}
                          aria-label="전체 선택"
                        />
                      </th>
                      <th className="px-3 py-2">경로당명</th>
                      <th className="px-3 py-2">기본주소</th>
                      <th className="px-3 py-2 w-[140px]">설정</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-800">
                    {!isLoading && centers.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-neutral-400" colSpan={4}>
                          등록된 경로당이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      centers.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={!!sel[row.id]}
                              onChange={() => toggleOne(row.id)}
                              aria-label={`${row.name} 선택`}
                            />
                          </td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">
                            <div className="truncate">{row.address} {row.address_detail && `• ${row.address_detail}`}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {/* <button
                                type="button"
                                className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
                                onClick={() => handleEdit(row)}
                              >
                                수정
                              </button> */}
                              <button
                                type="button"
                                className="rounded-md border px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDelete(row)}
                                disabled={del.isPending}
                              >
                                {del.isPending ? '삭제중…' : '삭제'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t p-3 text-xs text-neutral-500">
              선택됨: {Object.values(sel).filter(Boolean).length}건
            </div>
          </div>
        </div>



        {/* 서비스 종류: 체크박스 컨트롤드로 변경 */}
        {/* 서비스 종류: 체크박스 컨트롤드 + 기타 입력 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              서비스 종류 <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap gap-4 text-sm">
              {["에어컨청소", "주방", "화장실", "방역소독", "기타"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serviceTypes.includes(opt)}
                    onChange={() => {
                      const next = serviceTypes.includes(opt)
                        ? serviceTypes.filter((x) => x !== opt)
                        : [...serviceTypes, opt];
                      setServiceTypes(next);

                      // "기타" 해제하면 입력값도 같이 비움
                      if (opt === "기타" && serviceTypes.includes("기타")) {
                        setOtherService("");
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* "기타" 체크 시에만 입력창 노출 */}
            {serviceTypes.includes("기타") && (
              <div className="mt-3">
                <input
                  type="text"
                  value={otherService}
                  onChange={(e) => setOtherService(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="ex)공기청정기 청소"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  구체적인 서비스를 입력해 주세요.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
  <div>
    <label className="mb-1 block text-sm font-medium text-neutral-700">희망 일정</label>

    <div className="flex items-center gap-3">
      <ReactDatePicker
      wrapperClassName="w-full" 
  locale={ko}
  dateFormat="yyyy-MM-dd"
  selected={parseDateOnly(form.hope_date) ?? undefined}
  onChange={(d: Date | null) =>
    setForm(prev => ({ ...prev, hope_date: d ? toDateOnly(startOfDay(d)) : "" }))
  }

  // ✅ 11일이면 18일부터 선택 가능
  minDate={oneWeekLater}

  // (보강) 혹시 브라우저/타임존 엣지 케이스 방지
  filterDate={(d) => startOfDay(d).getTime() >= oneWeekLater.getTime()}

  placeholderText="희망 일자를 선택하세요"
  className="w-full rounded-xl border border-neutral-300 px-3 py-2"
  showPopperArrow={false}
  isClearable
  popperPlacement="bottom-start"
/>


      
    </div>

    <p className="mt-1 text-xs text-neutral-500">
      기본값은 “오늘로부터 1주일 뒤”입니다. 필요 시 달력에서 변경하세요.
    </p>
  </div>
</div>


        {/* 4) 특이사항 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">특이사항</label>
          <textarea
            value={form.etc}
            onChange={(e) => handleChange({ etc: e.target.value })}
            rows={4}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            placeholder="현장 접근, 엘리베이터 유무, 주차, 민원 이슈 등"
          />
        </div>

        {/* 5) 첨부파일 */}

        <div>

          <FileUpload
            label="첨부 파일"
            uploadEndpoint={uploadEndpoint}
            value={Array.isArray(form.files) ? (form.files as unknown as UploadedFile[]) : []}
            onChange={(files) => handleChange({ files: files as unknown as JSON })}
            accept="image/*,.pdf,.xlsx,.xls,.doc,.docx"
           maxSizeMB={50}
  maxFiles={10}
            multiple
          />
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
            onClick={() => {
              // 간단 초기화
              setServiceTypes([]);
              setOtherService(""); // <- 추가
              setForm((prev) => ({
                ...prev,
                org_name: "",
                contact_name: "",
                contact_tel: "",
                contact_phone: "",
                contact_email: "",
                hope_date: "",
                etc: "",
                files: JSON.parse("[]"),
              }));
              setSel({});
            }}
          >
            초기화
          </button>
          <button type="submit" className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
            신청하기
          </button>
        </div>
      </form>
      {/* 모달 */}
      <SeniorRegisterModal
        open={openSeniorModal}
        onClose={() => setOpenSeniorModal(false)}
        onAdd={handleAddSenior}
        refetch={() => onRefetch()}
      />
    </div>
  );
}
