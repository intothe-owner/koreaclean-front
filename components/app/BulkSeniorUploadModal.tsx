// BulkSeniorUploadModal.tsx (프리뷰 테이블 부분만 변경, 전체 컴포넌트 붙여써도 OK)
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { baseUrl } from "@/lib/variable";
import React, { ChangeEvent, DragEvent, useCallback, useMemo, useState } from "react";
import Swal from "sweetalert2";

type ParsedItem = {
    name: string;
    postcode: string;
    address: string;
    address_detail: string;
    _row?: number;
};
type EnrichedItem = ParsedItem & { lat?: number | null; lng?: number | null; _reason?: string; _cached?: boolean };

export function BulkSeniorUploadModal({
    open,
    onClose,
    parseEndpoint = `${baseUrl}/senior/excel/upload`,
    geocodeEndpoint = `${baseUrl}/geocode/bulk`,
    saveEndpoint = `${baseUrl}/senior/save-bulk`,   // ✅ 저장 엔드포인트 추가
    onConfirm,
    refetch,
}: {
    open: boolean;
    onClose: () => void;
    parseEndpoint?: string;
    geocodeEndpoint?: string;
    saveEndpoint?: string;
    onConfirm?: (items: ParsedItem[]) => void;
    refetch:()=>void
}) {
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [items, setItems] = useState<EnrichedItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);   // ✅ 저장 중 상태
    const [sendOnlyMatched, setSendOnlyMatched] = useState(true); // ✅ 매칭건만 보낼지
    const hasPreview = useMemo(() => Array.isArray(items) && items.length > 0, [items]);

    const reset = useCallback(() => {
        setFileNames([]); setItems(null); setErr(null); setLoading(false); setStep(1);
    }, []);

    const uploadAndParse = useCallback(async (files: File[]) => {
        setErr(null); setLoading(true);
        try {
            const fd = new FormData();
            files.forEach((f) => fd.append("file", f));
            const res = await fetchWithAuth(parseEndpoint, { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok || !json?.is_success) throw new Error(json?.message || "업로드/파싱 실패");
            setItems(json.items as EnrichedItem[]);
            setStep(2);
        } catch (e: any) {
            setErr(e?.message || String(e)); setItems(null); setStep(1);
        } finally { setLoading(false); }
    }, [parseEndpoint]);

    const geocodeNow = useCallback(async () => {
        if (!items?.length) return;
        setErr(null); setLoading(true);
        try {
            const res = await fetchWithAuth(geocodeEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            });
            const json = await res.json();
            if (!res.ok || !json?.is_success) throw new Error(json?.message || "지오코딩 실패");
            setItems(json.items as EnrichedItem[]);
        } catch (e: any) {
            setErr(e?.message || String(e));
        } finally { setLoading(false); }
    }, [items, geocodeEndpoint]);

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        if (!list.length) return;
        setFileNames(list.map((f) => f.name));
        uploadAndParse(list);
    };
    const onDragOver = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragOver(false); };
    const onDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault(); setIsDragOver(false);
        const list = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
        if (!list.length) return;
        setFileNames(list.map((f) => f.name));
        uploadAndParse(list);
    };
    const submitItems = useCallback(async () => {
        if (!items?.length) return;

        // 보낼 대상 결정: 매칭만 or 전체
        const target = sendOnlyMatched
            ? items.filter(v => typeof v.lat === "number" && typeof v.lng === "number")
            : items;

        if (target.length === 0) {
            alert(sendOnlyMatched ? "좌표 매칭된 항목이 없습니다." : "보낼 항목이 없습니다.");
            return;
        }

        setSubmitting(true);
        setErr(null);
        try {
            const res = await fetchWithAuth(saveEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: target }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.is_success === false) {
                Swal.fire({ icon: 'error', title: '저장 실패', text: '등록하기에 실패하였습니다.' });
                throw new Error(json?.message || "저장에 실패했습니다.");
            }

            // 성공 UX: 알림 + 모달 닫기 or 초기화
            
            if (onConfirm) onConfirm(target); // 부모에 전달하고 싶으면
            setStep(3);
            Swal.fire({ icon: 'success', title: '등록 성공', text: '등록하기에 성공하였습니다.' })
            .then((result)=>{
                if(result.isConfirmed){
                    setStep(1);
                    onClose();
                    refetch();
                }
            });
            // onClose(); // 원하면 저장 후 닫기
        } catch (e: any) {
            setErr(e?.message || String(e));
        } finally {
            setSubmitting(false);
        }
    }, [items, saveEndpoint, sendOnlyMatched, onConfirm, setStep]);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
            <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
                {/* 헤더 */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">엑셀로 경로당 일괄 등록</h3>
                    <button className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100" onClick={onClose}>
                        닫기
                    </button>
                </div>

                {/* 가이드 */}
                <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <ol className="list-decimal pl-5 text-sm text-neutral-700">
                        <li className="mb-1">엑셀 템플릿(경로당명/우편번호/주소/상세주소) 작성</li>
                        <li className="mb-1">업로드하면 미리보기 표시</li>
                        <li>필요 시 <b>주소 → 좌표 변환</b> 버튼으로 위도/경도 계산</li>
                    </ol>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <a className="rounded-lg border px-3 py-2 text-sm hover:bg-white" href="/excel/경로당 업로드 샘플.xlsx">
                            ⬇ 엑셀 템플릿 다운로드
                        </a>
                        {items && (
                            <button type="button" className="rounded-lg border px-3 py-2 text-sm hover:bg-white" onClick={reset}>
                                새 파일 선택
                            </button>
                        )}
                    </div>
                </div>

                {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div>}

                <div className="space-y-4">
                    {/* Step */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-1 ${step === 1 ? "bg-black text-white" : "bg-neutral-200"}`}>1. 파일 선택</span>
                        <span className={`rounded-full px-2 py-1 ${step === 2 ? "bg-black text-white" : "bg-neutral-200"}`}>2. 미리보기</span>
                        <span className={`rounded-full px-2 py-1 ${step === 3 ? "bg-black text-white" : "bg-neutral-200"}`}>3. 등록</span>
                    </div>

                    {/* 업로더 */}
                    {step === 1 && (
                        <label
                            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition
                ${isDragOver ? "border-black bg-neutral-50" : "border-neutral-300 hover:bg-neutral-50"}`}
                        >
                            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={onPickFile} multiple />
                            <div className="text-sm text-neutral-600">여기로 끌어놓거나 <span className="font-medium underline">파일 선택</span></div>
                            {fileNames.length > 0 && <div className="mt-2 text-xs text-neutral-500">선택: {fileNames.join(", ")}</div>}
                        </label>
                    )}

                    {/* 로딩 */}
                    {loading && <div className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-600">처리 중…</div>}

                    {/* 미리보기 */}
                    {!loading && hasPreview && step >= 2 && (
                        <div className="rounded-xl border border-neutral-200">
                            <div className="flex items-center justify-between border-b p-3 text-sm">
                                <div className="font-medium">미리보기</div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs text-neutral-600">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={sendOnlyMatched}
                                            onChange={(e) => setSendOnlyMatched(e.target.checked)}
                                        />
                                        매칭된 항목만 전송
                                    </label>
                                    <div className="text-neutral-500">총 {items!.length}건</div>
                                    <button
                                        type="button"
                                        className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50"
                                        onClick={geocodeNow}
                                        disabled={loading}
                                        title="주소/상세주소를 카카오로 지오코딩"
                                    >
                                        주소 → 좌표 변환
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-64 overflow-auto p-3">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-white text-neutral-500">
                                        <tr>
                                            <th className="px-3 py-2">경로당명</th>
                                            <th className="px-3 py-2">우편번호</th>
                                            <th className="px-3 py-2">주소</th>
                                            <th className="px-3 py-2">상세주소</th>
                                            {/* 위치 컬럼: 항상 노출 */}
                                            <th className="px-3 py-2">위치</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-neutral-800">
                                        {items!.map((row, i) => {
                                            const attempted = "lat" in row || "lng" in row; // 지오코딩 시도 여부
                                            const matched = typeof row.lat === "number" && typeof row.lng === "number";
                                            const title = row._reason ? `사유: ${row._reason}` : matched ? (row._cached ? "캐시 매칭" : "정상 매칭") : (attempted ? "매칭 실패" : "좌표 변환 대기");

                                            return (
                                                <tr key={i} className="border-t">
                                                    <td className="px-3 py-2">{row.name}</td>
                                                    <td className="px-3 py-2">{row.postcode}</td>
                                                    <td className="px-3 py-2">{row.address}</td>
                                                    <td className="px-3 py-2">{row.address_detail}</td>
                                                    <td className="px-3 py-2" title={title}>
                                                        {/* 매칭: 초록 체크박스, 실패: 붉은 X, 대기: 회색 '대기' */}
                                                        {matched ? (
                                                            <span className="inline-flex items-center gap-2 text-green-600">
                                                                <input
                                                                    type="checkbox"
                                                                    checked
                                                                    readOnly
                                                                    className="h-4 w-4 accent-green-600"
                                                                />
                                                                <span className="text-xs">매칭</span>
                                                            </span>
                                                        ) : attempted ? (
                                                            <span className="inline-flex items-center gap-2 text-rose-600">
                                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-rose-300">
                                                                    {/* X 표시 */}
                                                                    <span className="leading-none">×</span>
                                                                </span>
                                                                <span className="text-xs">실패</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-2 text-neutral-400">
                                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-neutral-300">
                                                                    {/* 빈 체크박스 느낌 */}
                                                                </span>
                                                                <span className="text-xs">대기</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t p-3 text-xs text-neutral-500">
                                * 매칭 실패 시 주소 표기를 수정해 다시 변환해 보세요. (예: 도로명 + 건물번호 + 상세주소)
                            </div>
                        </div>
                    )}

                    {/* 액션 */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            disabled={!hasPreview || loading || submitting}
                            onClick={submitItems}                            // ✅ 여기!
                            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                            title={!hasPreview ? "먼저 파일을 업로드하세요" : undefined}
                        >
                            {submitting ? "전송 중…" : "등록하기"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
