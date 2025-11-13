// hooks/usePricing.ts
"use client";

import { fetchWithAuth } from "@/lib/fetchWitgAuth";
import { useCallback, useEffect, useMemo, useState } from "react";

export type RowKey = "airConditioner" | "kitchen" | "restroom" | "acDeepClean";

export const KEYS: RowKey[] = ["airConditioner", "kitchen", "restroom", "acDeepClean"];

// 숫자만 유지
const onlyDigits = (v: string) => v.replace(/[^\d]/g, "");

type RawState = Record<RowKey, string>;

export function usePricing(options?: {
  /** 기본값: "/admin/site/pricing" */
  fetchUrl?: string;
  /** 기본값: "/admin/site/save" */
  saveUrl?: string;
  /** 기본값: true (마운트 시 자동 로드) */
  autoLoad?: boolean;
}) {
  const fetchUrl = options?.fetchUrl ?? "/admin/site/pricing";
  const saveUrl = options?.saveUrl ?? "/admin/site/save";
  const autoLoad = options?.autoLoad ?? true;

  const [raw, setRaw] = useState<RawState>({
    airConditioner: "",
    kitchen: "",
    restroom: "",
    acDeepClean: ""
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 서버에서 현재 요금표 로드 → raw에 문자열로 세팅 */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchWithAuth(fetchUrl, {
        method: "GET",
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json?.is_success) {
        throw new Error(json?.message || "요금표 조회 실패");
      }

      // json.pricing: { totalCare: 120000, ... }
      const next: RawState = { ...raw };
      for (const k of KEYS) {
        const v = json?.pricing?.[k];
        next[k] = Number.isFinite(v) ? String(v) : "";
      }
      setRaw(next);
    } catch (e: any) {
      setError(e?.message || "서버 오류");
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  /** 단일 필드 입력 핸들러 (숫자만 유지) */
  const setField = useCallback((key: RowKey, input: string) => {
    setRaw((p) => ({ ...p, [key]: onlyDigits(input) }));
  }, []);

  /** 저장: raw → { pricing: { ...number } } 로 변환 후 POST */
  const save = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const pricing = Object.fromEntries(KEYS.map((k) => [k, raw[k] ? Number(raw[k]) : 0]));
      for (const [k, v] of Object.entries(pricing)) {
        if (!Number.isInteger(v as number) || (v as number) < 0) {
          throw new Error(`${k} 값이 올바르지 않습니다.`);
        }
      }

      const res = await fetchWithAuth(saveUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pricing }),
      });
      const json = await res.json();
      if (!res.ok || !json?.is_success) throw new Error(json?.message || "저장 실패");

      return true;
    } catch (e: any) {
      setError(e?.message || "서버 오류");
      return false;
    } finally {
      setSaving(false);
    }
  }, [raw, saveUrl]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  return { raw, setField, load, save, loading, saving, error };
}
