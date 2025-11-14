import { fetchWithAuth } from "./fetchWitgAuth";
import { baseUrl } from "./variable";


// 이메일 검증 함수
export const validateEmail = (value: string) => {
  // 간단한 RFC 5322 기반 패턴
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};
//전화번호 자동하이폰
export function formContact(raw: string) {
  // 숫자만 추출
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';

  // 지역번호 길이 결정
  let areaLen = 3;
  if (digits.startsWith('02')) areaLen = 2;     // 서울
  else if (digits.startsWith('0')) areaLen = 3; // 031/051/070 등

  // 입력 최대 길이 제한: 지역(2|3) + 가운데(최대 4) + 끝(4)
  const maxLen = areaLen + 8;
  const d = digits.slice(0, maxLen);

  // 길이별 하이픈 배치
  if (d.length <= areaLen) return d; // 지역번호만
  const area = d.slice(0, areaLen);
  const rest = d.slice(areaLen);

  // 아직 끝 4자리가 채워지기 전: 지역-가운데(진행중)
  if (rest.length <= 4) return `${area}-${rest}`;

  // 끝 4자리 확보되면: 지역-가운데(가변 1~4)-끝4
  const mid = rest.slice(0, rest.length - 4); // 3 또는 4도 자동 대응
  const tail = rest.slice(-4);
  return `${area}-${mid}-${tail}`;
}
// 휴대폰 번호
export function formatMobile(value: string) {
  // 숫자만 남기기
  const digits = value.replace(/\D/g, '');

  // 010, 011, 016, 017, 018, 019 지원
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
// 사업자 번호 자동 하이픈
export const formatBizNo = (value: string) => {
  const digits = value.replace(/\D/g, ""); // 숫자만
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
};

/** 법인번호: 13 digits -> xxxxxx-xxxxxxx (6-7) */
export function formatCorpNo(value: string) {
  const d = (value || "").replace(/\D/g, "").slice(0, 13); // 숫자만, 최대 13자리
  if (d.length <= 6) return d;
  return `${d.slice(0, 6)}-${d.slice(6)}`;
}

// ---- seniors 정규화: 배열/단일 모두 name/address 로 맞추기 ----
export function getSeniorRows(input: any): Array<{ id?: number; name: string; address?: string }> {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];

  return arr
    .map((v) => {
      // 문자열 JSON이면 파싱 시도
      if (typeof v === "string") {
        try { v = JSON.parse(v); } catch { return null; }
      }
      if (!v || typeof v !== "object") return null;

      const name = (v.name ?? v.title ?? v.label ?? "").toString().trim();
      const address = (v.address ?? v.addr ?? v.address1 ?? "").toString().trim();
      const lat = (v.lat ?? v.lat ?? v.lat ?? 0).toString().trim();
      const lng = (v.lng ?? v.lng ?? v.lng ?? 0).toString().trim();
      const work_date = (v.work_date ?? v.work_date ?? v.work_date ?? '').toString().trim();
      const work = (v.work ?? v.work ?? v.work ?? '').toString().trim();
      const status = (v.status ?? v.status ?? v.status ?? '').toString().trim();
      if (!name) return null;
      return { id: v.id, name, address,lat,lng,work_date,work,status };
    })
    .filter(Boolean) as Array<{ id?: number; name: string; address?: string }>;
}

// lib/server/site.ts  (서버 전용)
export async function getSiteInfoServer() {
  // 절대경로나 내부 API 호출 대신, DB直 또는 내부 함수 호출을 추천
  // 여기서는 서버에서 API 호출 예시(동일 호스트 기준)
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/backend/site/detail`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data?.item || null;
}

export async function generateMetadata() {
  const site = await getSiteInfoServer();
  const title = site?.site_name || "한국클린쿱";
  const description = site?.site_description || "전국 경로당 토탈 클리닝 서비스";
  const icon = `${baseUrl}${site?.icon_url}` || "/favicon.ico";
  console.log('icon',icon);

  return {
    title,
    description,
    icons: { icon },
    openGraph: {
      title,
      description,
      images: icon ? [{ url: icon }] : [],
    },
  };
}

// lib/server/site.ts
export async function fetchSiteInfoForMeta() {
  // 절대 URL 확보
  const base = "http://back.koreacleancoop.kr";

  const res = await fetchWithAuth(`${base}/site/detail`, {
    cache: "no-store", // 항상 최신 (원하면 revalidate로 바꿔도 됨)
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.item ?? null; // { site_name, site_description, icon_url, meta_tags, ... }
}
