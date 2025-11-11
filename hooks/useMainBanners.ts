// hooks/useMainBanners.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** 애니메이션 옵션 타입 */
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

/** 업로드 파일 타입 (FileUpload 컴포넌트와 호환) */
export type UploadedFile = {
  id?: string | number;
  url?: string;
  name: string;
  size: number;
  type?: string;
  previewUrl?: string;
};

/** 슬라이드(배너) 타입 */
export type SlideItem = {
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

  // 텍스트/오버레이 애니메이션
  animType?: AnimValue;
  animDurationMs?: number;
  animDelayMs?: number;

  // 배경 이미지 애니메이션
  bgAnimType?: AnimValue;
  bgAnimDurationMs?: number;
  bgAnimDelayMs?: number;
};

type UseMainBannersArgs = {
  /** 목록/저장 API */
  apiList: string; // ex) "/backend/banners/list"
  apiSave: string; // ex) "/backend/banners/save"
  /** 새 배너 추가 시 기본 폰트 */
  defaultFont: string;
};

export function useMainBanners({ apiList, apiSave, defaultFont }: UseMainBannersArgs) {
  const [items, setItems] = useState<SlideItem[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [applyAll, setApplyAll] = useState<boolean>(false);

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Swiper 활성 인덱스 (애니 재생을 위해 key에 섞음)
  const [activeIdx, setActiveIdx] = useState(0);

  /** 서버 레코드 → 슬라이드 매핑 */
  const mapRowToSlideItem = useCallback(
    (r: any, idx: number): SlideItem => ({
      id: r.id,
      image_url: r.image_url,
      title: r.title ?? "",
      subtitle: r.subtitle ?? "",
      link_url: r.link_url ?? "",

      order_no: typeof r.order_no === "number" ? r.order_no : idx + 1,
      is_active: typeof r.is_active === "boolean" ? r.is_active : true,

      alignX: (r.alignX as SlideItem["alignX"]) ?? "left",
      alignY: (r.alignY as SlideItem["alignY"]) ?? "middle",
      textAlign: (r.textAlign as SlideItem["textAlign"]) ?? "left",
      overlayZ: typeof r.overlayZ === "number" ? r.overlayZ : 10,

      titleSize: r.titleSize ?? 48,
      titleWeight: r.titleWeight ?? 800,
      titleColor: r.titleColor ?? "#111827",
      subtitleSize: r.subtitleSize ?? 18,
      subtitleWeight: r.subtitleWeight ?? 400,
      subtitleColor: r.subtitleColor ?? "#4B5563",
      fontFamily: r.fontFamily ?? defaultFont,

      boxBg: r.boxBg ?? "#FFFFFF",
      boxBlur: r.boxBlur ?? true,
      boxOpacity: r.boxOpacity ?? 0.7,
      boxRounded: r.boxRounded ?? 20,
      boxPaddingX: r.boxPaddingX ?? 28,
      boxPaddingY: r.boxPaddingY ?? 24,
      boxShadow: r.boxShadow ?? true,

      animType: (r.animType as AnimValue) ?? "fade",
      animDurationMs: r.animDurationMs ?? 900,
      animDelayMs: r.animDelayMs ?? 0,

      bgAnimType: (r.bgAnimType as AnimValue) ?? "kenburns",
      bgAnimDurationMs: r.bgAnimDurationMs ?? 4000,
      bgAnimDelayMs: r.bgAnimDelayMs ?? 0,
    }),
    [defaultFont]
  );

  /** 불러오기 */
  const reload = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch(`${apiList}?onlyActive=0&limit=200&offset=0&order=asc`);
      const json = await res.json();
      if (!res.ok || json?.is_success === false) throw new Error(json?.message || "목록 조회 실패");

      const rows = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
      const slides = rows
        .map((r: any, i: number) => mapRowToSlideItem(r, i))
        .sort((a:any, b:any) => a.order_no - b.order_no)
        .map((s:any, i:any) => ({ ...s, order_no: i + 1 }));

      setItems(slides);
      setSelected(0);

      const up: UploadedFile[] = slides.map((s:any, i:any) => ({
        id: s.id ?? i,
        url: s.image_url,
        name: s.title || `slide-${i + 1}`,
        size: 0,
        type: "image/*",
        previewUrl: s.image_url,
      }));
      setUploads(up);
    } catch (e: any) {
      console.error("[useMainBanners.reload]", e);
      alert(e?.message ?? "배너 불러오기 중 오류가 발생했습니다.");
    } finally {
      setFetching(false);
    }
  }, [apiList, mapRowToSlideItem]);

  /** 저장 */
  const save = useCallback(async () => {
    try {
      setSaving(true);
      const payload = { slides: items };
      const res = await fetch(apiSave, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.is_success === false) throw new Error(json?.message || "저장 실패");
      alert("메인 배너가 저장되었습니다.");
    } catch (e: any) {
      console.error("[useMainBanners.save]", e);
      alert(e?.message ?? "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [apiSave, items]);

  /** 최초 로드 */
  useEffect(() => {
    reload();
  }, [reload]);

  /** 업로드 → 슬라이드 동기화 (중복 URL 방지) */
  const syncUploadsToSlides = useCallback(
    (files: UploadedFile[], baseFont = defaultFont) => {
      setUploads(files);
      setItems((prev) => {
        const urlSet = new Set(prev.map((p) => p.image_url));
        const appends: SlideItem[] = [];

        files.forEach((f) => {
          const url = f.url || f.previewUrl || "";
          if (!url || urlSet.has(url)) return;
          urlSet.add(url);
          appends.push({
            image_url: url,
            title: "",
            subtitle: "",
            link_url: "",
            order_no: prev.length + appends.length + 1,
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
            fontFamily: baseFont,

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
          });
        });

        const merged = [...prev, ...appends];
        if (merged.length > 0) setSelected(merged.length - 1);
        return merged;
      });
    },
    [defaultFont]
  );

  /** 정렬 재번호 */
  const renumber = useCallback(
    (list: SlideItem[]) =>
      list
        .map((v, i) => ({ ...v, order_no: i + 1 }))
        .sort((a, b) => a.order_no - b.order_no),
    []
  );

  /** 이동/삭제/선택 */
  const move = useCallback((idx: number, dir: "up" | "down") => {
    setItems((prev) => {
      const next = [...prev];
      const j = dir === "up" ? idx - 1 : idx + 1;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      const after = renumber(next);
      setSelected(j);
      return after;
    });
  }, [renumber]);

  const remove = useCallback((idx: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const after = renumber(next);
      if (after.length === 0) {
        setSelected(0);
      } else if (idx <= selected) {
        setSelected(Math.max(0, selected - 1));
      }
      return after;
    });
    setUploads((prev) => prev.filter((_, i) => i !== idx));
  }, [renumber, selected]);

  const select = useCallback((idx: number) => setSelected(idx), []);

  /** 현재 선택 항목 */
  const current = items[selected];

  /** 전체 적용 대상 키 */
  const APPLY_KEYS: (keyof SlideItem)[] = useMemo(
    () => [
      "title", "subtitle", "link_url",
      "alignX", "alignY", "textAlign", "overlayZ",
      "titleSize", "titleWeight", "titleColor",
      "subtitleSize", "subtitleWeight", "subtitleColor",
      "fontFamily",
      "boxBg", "boxBlur", "boxOpacity", "boxRounded", "boxPaddingX", "boxPaddingY", "boxShadow",
      "animType", "animDurationMs", "animDelayMs",
      "bgAnimType", "bgAnimDurationMs", "bgAnimDelayMs",
    ],
    []
  );

  /** 현재 항목 업데이트 (applyAll 켜져있으면 전체에 반영) */
  const updateCurrent = useCallback((patch: Partial<SlideItem>) => {
    setItems((prev) => {
      if (!prev[selected]) return prev;
      if (applyAll) {
        const keys = Object.keys(patch) as (keyof SlideItem)[];
        const allowed = keys.filter((k) => APPLY_KEYS.includes(k));
        if (allowed.length) {
          return prev.map((s, i) =>
            i === selected
              ? { ...s, ...patch }
              : { ...s, ...allowed.reduce((acc, k) => ({ ...acc, [k]: patch[k] }), {}) }
          );
        }
      }
      const next = [...prev];
      next[selected] = { ...next[selected], ...patch };
      return next;
    });
  }, [APPLY_KEYS, applyAll, selected]);

  /** 저장 가능 여부 */
  const canSave = useMemo(() => items.length > 0 && !saving, [items.length, saving]);

  return {
    // 상태
    items, setItems,
    uploads, setUploads,
    selected, setSelected,
    applyAll, setApplyAll,
    activeIdx, setActiveIdx,

    // 파생
    current,
    canSave,
    fetching,
    saving,

    // 동작
    reload,
    save,
    syncUploadsToSlides,
    move,
    remove,
    select,
    updateCurrent,
  };
}
