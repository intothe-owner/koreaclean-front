"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, A11y } from "swiper/modules";
import "swiper/css";

export type AnimValue =
  | "none"
  | "fade"
  | "slide-right"
  | "slide-left"
  | "slide-up"
  | "slide-down"
  | "zoom-in"
  | "zoom-out"
  | "kenburns";

export type BannerSlide = {
  id?: number;
  image_url: string;
  title?: string;
  subtitle?: string;
  link_url?: string;
  order_no: number;
  is_active: boolean;
  alignX?: "left" | "center" | "right";
  alignY?: "top" | "middle" | "bottom";
  textAlign?: "left" | "center" | "right";
  overlayZ?: number;
  titleSize?: number;
  titleWeight?: 400 | 500 | 600 | 700 | 800;
  titleColor?: string;
  subtitleSize?: number;
  subtitleWeight?: 300 | 400 | 500 | 600;
  subtitleColor?: string;
  fontFamily?: string;
  boxBg?: string;
  boxBlur?: boolean;
  boxOpacity?: number;
  boxRounded?: number;
  boxPaddingX?: number;
  boxPaddingY?: number;
  boxShadow?: boolean;
  animType?: AnimValue;
  animDurationMs?: number;
  animDelayMs?: number;
  bgAnimType?: AnimValue;
  bgAnimDurationMs?: number;
  bgAnimDelayMs?: number;
};

type Props = {
  items?: BannerSlide[];
  src?: string;

  autoplayDelayMs?: number; // 기본 5000
  loop?: boolean;           // 기본 true
  showNav?: boolean;        // (현재 미사용)
  showDots?: boolean;       // (현재 미사용)

  height?: number;          // px, 기본 520
  rounded?: string;         // tailwind class
  className?: string;

  injectGlobalKeyframes?: boolean; // 기본 true
  ariaLabel?: string;              // 기본 "메인 배너"

  /** 빈 데이터 처리 방법: 'box' = 큰 박스 플레이스홀더, 'null' = 컴포넌트 자체 미렌더 */
  whenEmpty?: "box" | "null"; // 기본 'box'
};

const DEFAULT_FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';

export default function MainBannerSwiper({
  items,
  src,
  autoplayDelayMs = 5000,
  loop = true,
  showNav = true,
  showDots = true,
  height = 520,
  rounded = "rounded-2xl",
  className = "",
  injectGlobalKeyframes = true,
  ariaLabel = "메인 배너",
  whenEmpty = "box",
}: Props) {
  const [data, setData] = useState<BannerSlide[]>(Array.isArray(items) ? items : []);
  const [loading, setLoading] = useState(!items && !!src);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerStyle: React.CSSProperties = { height: `${height}px` };

  // API fetch
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!src || items) return;
      try {
        setLoading(true);
        const res = await fetch(src, { method: "GET", cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // json?.items가 배열이면 사용, 아니면 전체 json이 배열이면 사용, 그 외는 빈 배열
        const rows = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json)
          ? json
          : [];

        if (!ignore) {
          const slides: BannerSlide[] = rows
            .filter((r: any) => r?.is_active !== false)
            .map((r: any, i: number) => mapRow(r, i))
            .sort((a: any, b: any) => a.order_no - b.order_no);

          setData(Array.isArray(slides) ? slides : []);
        }
      } catch (e) {
        console.error("[MainBannerSwiper] fetch error:", e);
        if (!ignore) setData([]); // 에러 시에도 안전하게 빈 배열
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [src, items]);

  // items prop 변경 반영
  useEffect(() => {
    if (items) setData(items.slice().sort((a, b) => a.order_no - b.order_no));
  }, [items]);

  const slides = useMemo(
    () =>
      (data ?? [])
        .filter((s) => s?.is_active)
        .slice()
        .sort((a, b) => a.order_no - b.order_no),
    [data]
  );

  const hasSlides = slides.length > 0;

  // --- empty 처리: 로딩 중이 아니고, 슬라이드가 없을 때 ---
  // --- empty 처리: 로딩 중이 아니고, 슬라이드가 없을 때 ---
if (!loading && !hasSlides) {
  if (whenEmpty === "null") return null;

  // whenEmpty === 'box' → 큰 네모 박스(아이콘 + 안내문구)
  return (
    <section aria-label={ariaLabel} className={`relative ${className}`}>
      <div
        className={`w-full overflow-hidden bg-gray-50 border border-gray-300 ${rounded}`}
        style={containerStyle}
        aria-hidden="true"
      >
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center px-6">
            {/* 아이콘 (사진/배너 플레이스홀더) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-3 h-12 w-12 text-gray-400"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25V6.75z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 14.25l2.25-2.25 3 3 3-3 2.25 2.25M9 8.25h.008v.008H9V8.25z"
              />
            </svg>

            <p className="text-gray-700 font-medium">
              관리자 모드에서 설정을 해주세요
            </p>
            <p className="text-gray-500 text-sm mt-1">
              메인 배너가 아직 등록되지 않았습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


  return (
    <section aria-label={ariaLabel} className={`relative ${className}`}>
      {/* 로딩 스켈레톤 */}
      {!hasSlides && loading && (
        <div
          className={`w-full overflow-hidden border bg-gray-100 animate-pulse ${rounded}`}
          style={containerStyle}
        />
      )}

      {hasSlides && (
        <Swiper
          modules={[Autoplay, A11y]}
          pagination={false}
          autoplay={{ delay: autoplayDelayMs, disableOnInteraction: false }}
          loop={loop}
          onSlideChange={(s) => setActiveIdx(s.realIndex)}
          className={`overflow-hidden ${rounded}`}
          style={containerStyle}
        >
          {slides.map((s, i) => {
            const justify =
              s.alignX === "center" ? "justify-center" : s.alignX === "right" ? "justify-end" : "justify-start";
            const align =
              s.alignY === "middle" ? "items-center" : s.alignY === "bottom" ? "items-end" : "items-start";
            const textAlign =
              s.textAlign === "center" ? "text-center" : s.textAlign === "right" ? "text-right" : "text-left";

            // BG animation
            const imgAnimStyle: React.CSSProperties = {
              ["--anim-duration" as any]: `${(s.bgAnimDurationMs ?? 4000) / 1000}s`,
              ["--anim-delay" as any]: `${(s.bgAnimDelayMs ?? 0) / 1000}s`,
            };
            const imgAnimClass = s.bgAnimType && s.bgAnimType !== "none" ? `kb-anim kb-${s.bgAnimType}` : "";
            const imageKey = `bg-${s.image_url}-${activeIdx}-${s.bgAnimType}-${s.bgAnimDurationMs}-${s.bgAnimDelayMs}`;

            // Overlay (text box)
            const boxStyle: React.CSSProperties = {
              backgroundColor: s.boxBg || "#FFFFFF",
              opacity: clamp0to1(s.boxOpacity, 0.7),
              borderRadius: px(s.boxRounded, 20),
              padding: `${pxNum(s.boxPaddingY, 24)} ${pxNum(s.boxPaddingX, 28)}`,
              boxShadow: s.boxShadow !== false ? "0 10px 25px rgba(0,0,0,0.08)" : undefined,
              zIndex: s.overlayZ ?? 10,
              fontFamily: s.fontFamily || DEFAULT_FONT,
              backdropFilter: s.boxBlur ? "blur(6px)" : undefined,
              ["--anim-duration" as any]: `${(s.animDurationMs ?? 900) / 1000}s`,
              ["--anim-delay" as any]: `${(s.animDelayMs ?? 0) / 1000}s`,
            };
            const animClass = s.animType && s.animType !== "none" ? `kb-anim kb-${s.animType}` : "";
            const overlayKey = `${s.image_url}-${activeIdx}-${s.animType}-${s.animDurationMs}-${s.animDelayMs}`;

            const titleStyle: React.CSSProperties = {
              fontSize: pxNum(s.titleSize, 48),
              fontWeight: s.titleWeight ?? 800,
              color: s.titleColor ?? "#111827",
              lineHeight: 1.1,
            };
            const subtitleStyle: React.CSSProperties = {
              fontSize: pxNum(s.subtitleSize, 18),
              fontWeight: s.subtitleWeight ?? 400,
              color: s.subtitleColor ?? "#4B5563",
            };

            const content = (
              <div className={`absolute inset-0 flex ${justify} ${align} p-6`}>
                <div key={overlayKey} className={`${textAlign} ${animClass}`} style={boxStyle}>
                  {s.title && <div style={titleStyle}>{s.title}</div>}
                  {s.subtitle && (
                    <div className="mt-3" style={subtitleStyle}>
                      {s.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <SwiperSlide key={`${s.image_url}-${i}`}>
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={imageKey}
                    src={s.image_url}
                    alt={s.title || `banner-${i + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover ${imgAnimClass}`}
                    style={imgAnimStyle}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                  {s.link_url ? (
                    <a href={s.link_url} aria-label={s.title || s.link_url}>
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}

      {injectGlobalKeyframes && (
        <style jsx global>{`
          .kb-anim {
            animation-duration: var(--anim-duration, 0.9s);
            animation-delay: var(--anim-delay, 0s);
            animation-fill-mode: both;
          }
          .kb-fade { animation-name: kbFadeIn; }
          @keyframes kbFadeIn { from { opacity: 0 } to { opacity: 1 } }

          .kb-slide-right { animation-name: kbSlideRight; }
          .kb-slide-left  { animation-name: kbSlideLeft;  }
          .kb-slide-up    { animation-name: kbSlideUp;    }
          .kb-slide-down  { animation-name: kbSlideDown;  }
          @keyframes kbSlideRight { from { transform: translateX(-24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
          @keyframes kbSlideLeft  { from { transform: translateX(24px);  opacity: 0 } to { transform: translateX(0); opacity: 1 } }
          @keyframes kbSlideUp    { from { transform: translateY(24px);  opacity: 0 } to { transform: translateY(0); opacity: 1 } }
          @keyframes kbSlideDown  { from { transform: translateY(-24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

          .kb-zoom-in  { animation-name: kbZoomIn; }
          .kb-zoom-out { animation-name: kbZoomOut; }
          @keyframes kbZoomIn  { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
          @keyframes kbZoomOut { from { transform: scale(1.04); opacity: 0 } to { transform: scale(1); opacity: 1 } }

          .kb-kenburns { animation-name: kbKenBurns; }
          @keyframes kbKenBurns { from { transform: scale(1.05); opacity: 0.9 } 50% { opacity: 1 } to { transform: scale(1.12); opacity: 1 } }
        `}</style>
      )}
    </section>
  );
}

/* ---------- helpers ---------- */
function mapRow(r: any, idx: number): BannerSlide {
  const DEFAULTS: Partial<BannerSlide> = {
    is_active: true,
    alignX: "left",
    alignY: "middle",
    textAlign: "left",
    overlayZ: 10,
    titleSize: 48,
    titleWeight: 800,
    titleColor: "#111827",
    subtitleSize: 18,
    subtitleWeight: 400,
    subtitleColor: "#4B5563",
    fontFamily: DEFAULT_FONT,
    boxBg: "#FFFFFF",
    boxBlur: true,
    boxOpacity: 0.7,
    boxRounded: 20,
    boxPaddingX: 28,
    boxPaddingY: 24,
    boxShadow: true,
    animType: "fade",
    animDurationMs: 900,
    animDelayMs: 0,
    bgAnimType: "kenburns",
    bgAnimDurationMs: 4000,
    bgAnimDelayMs: 0,
  };
  return {
    id: r?.id,
    image_url: r?.image_url ?? "",
    title: r?.title ?? "",
    subtitle: r?.subtitle ?? "",
    link_url: r?.link_url ?? "",
    order_no: typeof r?.order_no === "number" ? r.order_no : idx + 1,
    is_active: r?.is_active ?? DEFAULTS.is_active!,
    alignX: r?.alignX ?? DEFAULTS.alignX,
    alignY: r?.alignY ?? DEFAULTS.alignY,
    textAlign: r?.textAlign ?? DEFAULTS.textAlign,
    overlayZ: r?.overlayZ ?? DEFAULTS.overlayZ,
    titleSize: r?.titleSize ?? DEFAULTS.titleSize,
    titleWeight: r?.titleWeight ?? DEFAULTS.titleWeight,
    titleColor: r?.titleColor ?? DEFAULTS.titleColor,
    subtitleSize: r?.subtitleSize ?? DEFAULTS.subtitleSize,
    subtitleWeight: r?.subtitleWeight ?? DEFAULTS.subtitleWeight,
    subtitleColor: r?.subtitleColor ?? DEFAULTS.subtitleColor,
    fontFamily: r?.fontFamily ?? DEFAULTS.fontFamily,
    boxBg: r?.boxBg ?? DEFAULTS.boxBg,
    boxBlur: r?.boxBlur ?? DEFAULTS.boxBlur,
    boxOpacity: r?.boxOpacity ?? DEFAULTS.boxOpacity,
    boxRounded: r?.boxRounded ?? DEFAULTS.boxRounded,
    boxPaddingX: r?.boxPaddingX ?? DEFAULTS.boxPaddingX,
    boxPaddingY: r?.boxPaddingY ?? DEFAULTS.boxPaddingY,
    boxShadow: r?.boxShadow ?? DEFAULTS.boxShadow,
    animType: r?.animType ?? DEFAULTS.animType,
    animDurationMs: r?.animDurationMs ?? DEFAULTS.animDurationMs,
    animDelayMs: r?.animDelayMs ?? DEFAULTS.animDelayMs,
    bgAnimType: r?.bgAnimType ?? DEFAULTS.bgAnimType,
    bgAnimDurationMs: r?.bgAnimDurationMs ?? DEFAULTS.bgAnimDurationMs,
    bgAnimDelayMs: r?.bgAnimDelayMs ?? DEFAULTS.bgAnimDelayMs,
  };
}

function px(val?: number | string, fallback = 0) {
  if (val == null) return `${fallback}px`;
  return typeof val === "number" ? `${val}px` : val;
}
function pxNum(val?: number, fallback = 0) {
  return (val ?? fallback) + "px";
}
function clamp0to1(v: any, fallback = 1) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(0, Math.min(1, n));
  return fallback;
}
