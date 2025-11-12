// app/admin/service/page.tsx
"use client";

import React, { useMemo } from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Siderbar";
import FileUpload from "@/components/ui/FileUpload";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { useMainBanners, SlideItem } from "@/hooks/useMainBanners";
import { baseUrl } from "@/lib/variable";

/** 업로드/저장/목록 API */
const API_UPLOAD = `${baseUrl}/upload/banner-upload`;
const API_SAVE = `${baseUrl}/banners/save`;
const API_LIST = `${baseUrl}/banners/list`;

/** 폰트 옵션 */
const FONT_OPTIONS = [
  {
    label: "시스템 기본",
    value:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
  },
  {
    label: "Pretendard",
    value:
      'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", Roboto, "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  {
    label: "Noto Sans KR",
    value:
      '"Noto Sans KR", system-ui, -apple-system, "Segoe UI", Roboto, "Apple SD Gothic Neo", sans-serif',
  },
  {
    label: "SUIT",
    value:
      '"SUIT", "Noto Sans KR", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
] as const;

/** 애니 옵션 (라벨만 UI에서 사용) */
const ANIM_OPTIONS = [
  { label: "없음", value: "none" },
  { label: "페이드 인", value: "fade" },
  { label: "슬라이드 왼쪽→오른쪽", value: "slide-right" },
  { label: "슬라이드 오른쪽→왼쪽", value: "slide-left" },
  { label: "슬라이드 아래→위", value: "slide-up" },
  { label: "슬라이드 위→아래", value: "slide-down" },
  { label: "줌 인", value: "zoom-in" },
  { label: "줌 아웃", value: "zoom-out" },
  { label: "Ken Burns(서서히 확대)", value: "kenburns" },
] as const;

export default function ScreenSetPage() {


  const {
    items, setItems,
    uploads, setUploads,
    selected, setSelected,
    applyAll, setApplyAll,
    activeIdx, setActiveIdx,

    current,
    canSave,
    fetching,
    saving,

    reload,
    save,
    syncUploadsToSlides,
    move,
    remove,
    select,
    updateCurrent,
  } = useMainBanners({
    apiList: API_LIST,
    apiSave: API_SAVE,
    defaultFont: FONT_OPTIONS[0].value,
  });

  const sidebarOpen = false; // 레이아웃에서 쓰던 값 고정

  const onSave = save;
  const onReload = reload;

  // 안내 문구
  const topDesc = useMemo(
    () => (fetching ? "서버에서 불러오는 중…" : "업로드 후 왼쪽 목록에서 선택 → 오른쪽 에디터로 편집. 아래 미리보기에 즉시 반영됩니다."),
    [fetching]
  );



  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">홈페이지 관리 &gt;&gt; 메인 배너</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onReload}
                disabled={fetching}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {fetching ? "불러오는 중..." : "다시 불러오기"}
              </button>
              <button
                onClick={onSave}
                disabled={!canSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">{topDesc}</p>

          {/* 좌 우 2열 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            {/* 좌측: 업로드 + 목록 */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">이미지 업로드</h2>
              <FileUpload
                uploadEndpoint={API_UPLOAD}
                value={uploads}
                onChange={(files) => syncUploadsToSlides(files, FONT_OPTIONS[0].value)}
                accept="image/*"
                maxFiles={20}
                maxSizeMB={20}
                multiple
                label="배너 이미지"
              />
              <p className="mt-2 text-xs text-gray-500">권장 16:9 (예: 1920×1080), 2~3MB 이내 권장.</p>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">슬라이드 목록</h3>
                  <div className="text-xs text-gray-500">{items.length}개</div>
                </div>
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                    업로드한 이미지가 없습니다.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {items
                      .slice() // 안전 복사
                      .sort((a, b) => a.order_no - b.order_no)
                      .map((it, idx) => {
                        const realIdx = items.findIndex((x) => x.image_url === it.image_url);
                        const isActive = realIdx === selected;
                        return (
                          <li
                            key={`${it.image_url}-${idx}`}
                            className={`flex items-center gap-3 rounded-lg border p-2 ${isActive ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <div className="h-14 w-20 overflow-hidden rounded-md border bg-gray-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {it.title || `슬라이드 ${it.order_no}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                정렬 {it.order_no} • {it.is_active ? "노출" : "숨김"}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button onClick={() => move(realIdx, "up")} className="rounded border px-2 py-1 text-xs" title="위로">
                                ▲
                              </button>
                              <button onClick={() => move(realIdx, "down")} className="rounded border px-2 py-1 text-xs" title="아래로">
                                ▼
                              </button>
                              <button
                                onClick={() => select(realIdx)}
                                className={`rounded px-2 py-1 text-xs ${isActive ? "border-blue-600 text-blue-600 border" : "border"}`}
                              >
                                편집
                              </button>
                              <button
                                onClick={() => remove(realIdx)}
                                className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                              >
                                삭제
                              </button>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </section>

            {/* 우측: 단일 에디터 */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">에디터</h2>
                {current && (
                  <div className="text-sm text-gray-500">
                    선택: {selected + 1}/{items.length} (정렬 {current.order_no})
                  </div>
                )}
              </div>

              {!current ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                  편집할 슬라이드를 선택하세요.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* 전체 적용 */}
                  <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={applyAll}
                      onChange={(e) => setApplyAll(e.target.checked)}
                    />
                    <span className="text-sm font-medium">현재 에디터 설정을 모든 이미지에 적용</span>
                  </label>

                  {/* 미니 프리뷰 */}
                  <div className="overflow-hidden rounded-lg border bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={current.image_url} alt="" className="h-44 w-full object-cover" />
                  </div>

                  {/* 노출/링크 */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!current.is_active}
                        onChange={(e) => updateCurrent({ is_active: e.target.checked })}
                      />
                      <span className="text-sm">노출</span>
                    </label>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">링크 URL</label>
                      <input
                        value={current.link_url ?? ""}
                        onChange={(e) => updateCurrent({ link_url: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="/service/clean 또는 https://"
                      />
                    </div>
                  </div>

                  {/* 텍스트 */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">제목</label>
                      <input
                        value={current.title ?? ""}
                        onChange={(e) => updateCurrent({ title: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="예) 경로당 맞춤형 청소"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">부제목</label>
                      <input
                        value={current.subtitle ?? ""}
                        onChange={(e) => updateCurrent({ subtitle: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="예) 예약부터 사후관리까지 한 번에"
                      />
                    </div>
                  </div>

                  {/* 정렬 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">가로 위치</label>
                      <select
                        value={current.alignX ?? "left"}
                        onChange={(e) => updateCurrent({ alignX: e.target.value as SlideItem["alignX"] })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="left">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="right">오른쪽</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">세로 위치</label>
                      <select
                        value={current.alignY ?? "middle"}
                        onChange={(e) => updateCurrent({ alignY: e.target.value as SlideItem["alignY"] })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="top">위</option>
                        <option value="middle">가운데</option>
                        <option value="bottom">아래</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">텍스트 정렬</label>
                      <select
                        value={current.textAlign ?? "left"}
                        onChange={(e) => updateCurrent({ textAlign: e.target.value as SlideItem["textAlign"] })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="left">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="right">오른쪽</option>
                      </select>
                    </div>
                  </div>

                  {/* 폰트/색상 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">폰트 패밀리</label>
                      <select
                        value={current.fontFamily ?? FONT_OPTIONS[0].value}
                        onChange={(e) => updateCurrent({ fontFamily: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        {FONT_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">타이틀 크기(px)</label>
                        <input
                          type="number"
                          min={14}
                          max={120}
                          value={current.titleSize ?? 48}
                          onChange={(e) => updateCurrent({ titleSize: Number(e.target.value) })}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">굵기</label>
                        <select
                          value={current.titleWeight ?? 800}
                          onChange={(e) => updateCurrent({ titleWeight: Number(e.target.value) as any })}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                          {[400, 500, 600, 700, 800].map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">타이틀 색상</label>
                      <input
                        type="color"
                        value={current.titleColor ?? "#111827"}
                        onChange={(e) => updateCurrent({ titleColor: e.target.value })}
                        className="h-10 w-full rounded-md border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">부제 크기(px)</label>
                        <input
                          type="number"
                          min={12}
                          max={80}
                          value={current.subtitleSize ?? 18}
                          onChange={(e) => updateCurrent({ subtitleSize: Number(e.target.value) })}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">굵기</label>
                        <select
                          value={current.subtitleWeight ?? 400}
                          onChange={(e) => updateCurrent({ subtitleWeight: Number(e.target.value) as any })}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                          {[300, 400, 500, 600].map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">부제 색상</label>
                      <input
                        type="color"
                        value={current.subtitleColor ?? "#4B5563"}
                        onChange={(e) => updateCurrent({ subtitleColor: e.target.value })}
                        className="h-10 w-full rounded-md border"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">레이어(z-index)</label>
                      <input
                        type="number"
                        value={current.overlayZ ?? 10}
                        onChange={(e) => updateCurrent({ overlayZ: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* 카드 박스 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">박스 배경색</label>
                      <input
                        type="color"
                        value={current.boxBg ?? "#FFFFFF"}
                        onChange={(e) => updateCurrent({ boxBg: e.target.value })}
                        className="h-10 w-full rounded-md border"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">투명도(0~1)</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        max={1}
                        value={current.boxOpacity ?? 0.7}
                        onChange={(e) => updateCurrent({ boxOpacity: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <label className="flex items-end gap-2">
                      <input
                        type="checkbox"
                        checked={!!current.boxBlur}
                        onChange={(e) => updateCurrent({ boxBlur: e.target.checked })}
                      />
                      <span className="text-sm">블러</span>
                    </label>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">라운드(px)</label>
                      <input
                        type="number"
                        value={current.boxRounded ?? 20}
                        onChange={(e) => updateCurrent({ boxRounded: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">패딩X(px)</label>
                        <input
                          type="number"
                          value={current.boxPaddingX ?? 28}
                          onChange={(e) => updateCurrent({ boxPaddingX: Number(e.target.value) })}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">패딩Y(px)</label>
                        <input
                          type="number"
                          value={current.boxPaddingY ?? 24}
                          onChange={(e) => updateCurrent({ boxPaddingY: Number(e.target.value) })}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 애니메이션(텍스트/오버레이) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">애니메이션</label>
                      <select
                        value={current.animType ?? "fade"}
                        onChange={(e) => updateCurrent({ animType: e.target.value as SlideItem["animType"] })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        {ANIM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">지속 시간(ms)</label>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        value={current.animDurationMs ?? 900}
                        onChange={(e) => updateCurrent({ animDurationMs: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">지연(ms)</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={current.animDelayMs ?? 0}
                        onChange={(e) => updateCurrent({ animDelayMs: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* 배경 이미지 애니메이션 */}
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">배경 이미지 애니</label>
                      <select
                        value={current.bgAnimType ?? "kenburns"}
                        onChange={(e) => updateCurrent({ bgAnimType: e.target.value as SlideItem["bgAnimType"] })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        {ANIM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">지속 시간(ms)</label>
                      <input
                        type="number"
                        min={200}
                        step={100}
                        value={current.bgAnimDurationMs ?? 4000}
                        onChange={(e) => updateCurrent({ bgAnimDurationMs: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">지연(ms)</label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={current.bgAnimDelayMs ?? 0}
                        onChange={(e) => updateCurrent({ bgAnimDelayMs: Number(e.target.value) })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Swiper 미리보기 */}
          {items.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">미리보기 (Swiper)</h2>

              <Swiper
                modules={[Pagination, Autoplay, Navigation]}
                pagination={{ clickable: true }}
                navigation
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop
                onSlideChange={(s) => setActiveIdx(s.realIndex)}
                className="rounded-xl overflow-hidden border"
                style={{ width: "100%", height: "420px" }}
              >
                {items
                  .filter((s) => s.is_active)
                  .slice()
                  .sort((a, b) => a.order_no - b.order_no)
                  .map((s, i) => {
                    const justify =
                      s.alignX === "center" ? "justify-center" : s.alignX === "right" ? "justify-end" : "justify-start";
                    const align =
                      s.alignY === "middle" ? "items-center" : s.alignY === "bottom" ? "items-end" : "items-start";
                    const textAlign =
                      s.textAlign === "center" ? "text-center" : s.textAlign === "right" ? "text-right" : "text-left";

                    const boxStyle: React.CSSProperties = {
                      backgroundColor: s.boxBg || "#FFFFFF",
                      opacity: s.boxOpacity ?? 0.7,
                      borderRadius: (s.boxRounded ?? 20) + "px",
                      padding: `${s.boxPaddingY ?? 24}px ${s.boxPaddingX ?? 28}px`,
                      boxShadow: s.boxShadow !== false ? "0 10px 25px rgba(0,0,0,0.08)" : undefined,
                      zIndex: s.overlayZ ?? 10,
                      fontFamily: s.fontFamily,
                      backdropFilter: s.boxBlur ? "blur(6px)" : undefined,
                      ["--anim-duration" as any]: `${(s.animDurationMs ?? 900) / 1000}s`,
                      ["--anim-delay" as any]: `${(s.animDelayMs ?? 0) / 1000}s`,
                    };
                    const animClass = s.animType && s.animType !== "none" ? `kb-anim kb-${s.animType}` : "";

                    const titleStyle: React.CSSProperties = {
                      fontSize: (s.titleSize ?? 48) + "px",
                      fontWeight: s.titleWeight ?? 800,
                      color: s.titleColor ?? "#111827",
                      lineHeight: 1.1,
                    };
                    const subtitleStyle: React.CSSProperties = {
                      fontSize: (s.subtitleSize ?? 18) + "px",
                      fontWeight: s.subtitleWeight ?? 400,
                      color: s.subtitleColor ?? "#4B5563",
                    };

                    const imgAnimStyle: React.CSSProperties = {
                      ["--anim-duration" as any]: `${(s.bgAnimDurationMs ?? 4000) / 1000}s`,
                      ["--anim-delay" as any]: `${(s.bgAnimDelayMs ?? 0) / 1000}s`,
                    };
                    const imgAnimClass = s.bgAnimType && s.bgAnimType !== "none" ? `kb-anim kb-${s.bgAnimType}` : "";

                    const imageKey = `bg-${s.image_url}-${activeIdx}-${s.bgAnimType}-${s.bgAnimDurationMs}-${s.bgAnimDelayMs}`;
                    const overlayKey = `${s.image_url}-${activeIdx}-${s.animType}-${s.animDurationMs}-${s.animDelayMs}`;

                    return (
                      <SwiperSlide key={`${s.image_url}-${i}`}>
                        <div className="relative w-full h-full">
                          {/* 배경 이미지 */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            key={imageKey}
                            src={s.image_url}
                            alt={s.title}
                            className={`absolute inset-0 h-full w-full object-cover ${imgAnimClass}`}
                            style={imgAnimStyle}
                          />

                          {/* 오버레이 */}
                          <div className={`absolute inset-0 flex ${justify} ${align} p-6`}>
                            <div key={overlayKey} className={`${textAlign} ${animClass}`} style={boxStyle}>
                              {s.title && <div style={titleStyle}>{s.title}</div>}
                              {s.subtitle && <div className="mt-3" style={subtitleStyle}>{s.subtitle}</div>}
                              {s.link_url && (
                                <a
                                  href={s.link_url}
                                  className="mt-4 inline-block rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-white"
                                  style={{ boxShadow: "0 6px 14px rgba(0,0,0,0.08)" }}
                                >
                                  링크 이동
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
              </Swiper>
            </section>
          )}
        </main>
      </div>

      {/* 글로벌 애니메이션 CSS */}
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
    </div>
  );
}
