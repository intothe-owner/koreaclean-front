"use client";
import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    daum?: any;
  }
}

let daumReadyPromise: Promise<void> | null = null;
export async function ensureDaumPostcode(): Promise<void> {
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

export type DaumResult = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  buildingName?: string;
  apartment?: "Y" | "N";
  [k: string]: any;
};

type CommonProps = {
  onSelect: (data: DaumResult) => void;
  height?: number | string;
  maxSuggestItems?: number;
};

type ModalProps = CommonProps & {
  variant?: "modal";        // 모달(기본)
  open: boolean;
  onClose: () => void;
  title?: string;
};

type InlineProps = CommonProps & {
  variant: "inline";        // 인라인 고정
  className?: string;
  style?: React.CSSProperties;
};

type Props = ModalProps | InlineProps;

// (선택) 타입 가드
function isInlineProps(p: Props): p is InlineProps {
  return (p as any).variant === "inline";
}

export default function DaumPostcodeFinder(props: Props) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  // ✅ variant 정규화 (런타임 기본값: 'modal')
  const variant: "modal" | "inline" = isInlineProps(props)
    ? "inline"
    : (props.variant ?? "modal");

  const isInline = variant === "inline";
  const { onSelect, height = 480, maxSuggestItems = 5 } = props;

  // 임베드/언마운트
  useEffect(() => {
    const shouldMount = isInline ? true : (props as ModalProps).open;
    if (!shouldMount) return;

    let pc: any;
    let cancelled = false;

    (async () => {
      try {
        await ensureDaumPostcode();
        if (!layerRef.current || cancelled) return;

        pc = new window.daum.Postcode({
          oncomplete: (data: DaumResult) => {
            onSelect?.(data);
            if (!isInline) {
              (props as ModalProps).onClose?.();
            }
          },
          width: "100%",
          height: "100%",
          maxSuggestItems,
        });

        pc.embed(layerRef.current);
        layerRef.current.style.height = typeof height === "number" ? `${height}px` : String(height);
      } catch (e) {
        console.warn("Daum Postcode load/embed failed:", e);
        if (!isInline) (props as ModalProps).onClose?.();
      }
    })();

    return () => {
      cancelled = true;
      if (layerRef.current) layerRef.current.innerHTML = "";
      pc = null;
    };
  // ✅ 의존성에서 ‘겹치는 리터럴 비교’ 제거
  }, [isInline, (isInline ? undefined : (props as ModalProps).open), height, maxSuggestItems, onSelect]);

  // ----- 모달 렌더 -----
  if (!isInline) {
    const { open, onClose, title = "주소 검색" } = props as ModalProps;
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-[80]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute left-1/2 top-1/2 w-[min(560px,92%)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-medium">{title}</span>
            <button onClick={onClose} className="rounded px-2 py-1 text-sm hover:bg-neutral-100">
              닫기
            </button>
          </div>
          <div ref={layerRef} className="w-full" />
        </div>
      </div>
    );
  }

  // ----- 인라인 렌더 -----
  const { className, style } = props as InlineProps;
  return <div ref={layerRef} className={className} style={style} />;
}
