"use client";

import { ensureKakaoMaps, geocodeAddress } from "@/lib/KakaoMap";
import { baseUrl, SeniorItem } from "@/lib/variable";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import DaumPostcodeFinder from "../ui/DaumPostcodeFinder";
import { useSession } from "next-auth/react";
import { fetchWithAuth } from "@/lib/fetchWitgAuth";
// import { SeniorItem } from "@/lib/variable"; // 실제 타입이 있으면 이 라인을 사용하세요.


declare global {
    interface Window {
        daum?: any;
        kakao?: any;
    }
}

/** -------- Daum 우편번호 스크립트 로더 (중복/이중마운트 안전) -------- */
let daumReadyPromise: Promise<void> | null = null;
async function ensureDaumPostcode(): Promise<void> {
    if (typeof window === "undefined") return;
    if (window.daum?.Postcode) return;

    if (daumReadyPromise) return daumReadyPromise;

    daumReadyPromise = new Promise<void>((resolve, reject) => {
        const scriptId = "daum-postcode-script";
        const exist = document.getElementById(scriptId) as HTMLScriptElement | null;

        const onOk = () => resolve();

        if (exist) {
            if (exist.getAttribute("data-loaded") === "true") return onOk();
            exist.addEventListener("load", onOk, { once: true });
            exist.addEventListener("error", () => reject(new Error("Failed to load Daum Postcode")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        script.onload = () => {
            script.setAttribute("data-loaded", "true");
            onOk();
        };
        script.onerror = () => reject(new Error("Failed to load Daum Postcode"));
        document.head.appendChild(script);
    });

    return daumReadyPromise.finally(() => {
        daumReadyPromise = null;
    });
}


function SeniorRegisterModal({
    open,
    onClose,
    onAdd,
    refetch,
}: {
    open: boolean;
    onClose: () => void;
    onAdd: (item: SeniorItem) => void;
    refetch: () => void
}) {
    const { data: session, status } = useSession();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [postcode, setPostcode] = useState("");
    const [lat, setLat] = useState<number | undefined>(11);
    const [lng, setLng] = useState<number | undefined>(22);

    // 우편번호 레이어
    const [showFinder, setShowFinder] = useState(false);
    const layerRef = useRef<HTMLDivElement | null>(null);

    // 지오코딩 제어
    const geocodeSeqRef = useRef(0);
    const debounceRef = useRef<number | null>(null);

    const canSubmit = !!name.trim() && !!address.trim();
    // (선로드는 선택) 모달 열릴 때 SDK 로드
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                await ensureDaumPostcode();
            } catch (e) {
                console.warn("Daum preload failed:", e);
            }
        })();
    }, [open]);

    // 선택 처리
    const handleDaumSelect = (data: any) => {
        const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        setAddress(addr || "");
        setPostcode(data.zonecode || "");
        if (!addressDetail && data.buildingName && data.apartment === "Y") {
            setAddressDetail(data.buildingName);
        }
    };
    // ESC로 닫기
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showFinder) setShowFinder(false);
                else onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, showFinder, onClose]);

    // 모달 열릴 때 SDK들 선로드
    useEffect(() => {
        if (!open) return;
        const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "";
        (async () => {
            try {
                await ensureDaumPostcode();
                if (KAKAO_KEY) await ensureKakaoMaps(KAKAO_KEY);
            } catch (e) {
                console.warn("SDK preload failed:", e);
            }
        })();
    }, [open]);
    // 주소가 바뀌면 자동 지오코딩
    useEffect(() => {
        const KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "";

        // 주소 없으면 좌표 초기화
        if (!address.trim()) {
            setLat(undefined);
            setLng(undefined);
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
            return;
        }

        // 너무 짧은 중간 입력은 스킵
        if (address.trim().length < 5) return;

        // 디바운스
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(async () => {
            try {
                await ensureKakaoMaps(KEY);

                const point = await geocodeAddress(address);
                if (point) {
                    setLat(point.lat);
                    setLng(point.lng);
                } else {
                    // 실패 시 초기화(선택)
                    setLat(undefined);
                    setLng(undefined);
                }
            } catch (err) {
                console.error("[Geocode] Kakao load or geocode failed:", err);
                setLat(undefined);
                setLng(undefined);
            }
        }, 400);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [address]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const item: SeniorItem = {
            id: Math.random(),
            uniq_id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
            name: name.trim(),
            address: address.trim(),
            address_detail: addressDetail.trim(),
            post_code: postcode.trim(),
            lat,
            lng,
            client_id: Number(session?.user?.id)
        };

        onAdd(item);
        try {
            const res = await fetchWithAuth(`/backend/senior/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            const data = await res.json();
            if (res.ok && data?.is_success) {
                await Swal.fire({
                    icon: 'success',
                    title: '경로당 등록',
                    text: '경로당이 등록되었습니다.'
                }).then((result) => {
                    refetch();
                });

            } else {
                // 서버가 unique 에러/검증 에러 시 message 반환
                Swal.fire({ icon: 'error', title: '경로당 등록 실패', text: data?.message ?? '등록 실패' });
            }
        } catch (error) {
            // 서버가 unique 에러/검증 에러 시 message 반환

        }
        setName("");
        setAddress("");
        setAddressDetail("");
        setPostcode("");
        setLat(undefined);
        setLng(undefined);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            {/* backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => (showFinder ? setShowFinder(false) : onClose())}
            />
            {lat}
            {/* dialog */}
            <div
                role="dialog"
                aria-modal="true"
                className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <h3 className="text-base font-semibold">경로당 등록</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-sm hover:bg-neutral-100"
                    >
                        닫기
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    {/* 경로당명 */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-neutral-700">
                            경로당명 <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: ○○동 제1 경로당"
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
                            required
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
                                    value={postcode}
                                    onChange={(e) => setPostcode(e.target.value)}
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
                    {/* 주소 */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-neutral-700">주소</label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="예: 부산광역시 해운대구 ○○로 123"
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
                            required
                        />

                    </div>
                    {/* 상세주소 */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-neutral-700">상세주소</label>
                        <input
                            value={addressDetail}
                            onChange={(e) => setAddressDetail(e.target.value)}
                            placeholder="예: 101동 1001호(경비실 옆)"
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2"
                        />
                    </div>



                    {/* 위도/경도 (자동) */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700">위도 (자동)</label>
                        {lat}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700">경도 (자동)</label>
                        {lng}
                    </div>

                    {/* 버튼 */}
                    <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2 border-t pt-4">
                        <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 hover:bg-neutral-50">
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
                        >
                            등록
                        </button>
                    </div>
                </form>

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
        </div>
    );
}

export default SeniorRegisterModal;

