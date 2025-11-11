// 한 곳에서 라벨/DB/배지 클래스를 모두 관리
export const STATUS_LIST = [
  { db: "PENDING",  ko: "대기",  badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  { db: "APPROVED", ko: "승인",  badge: "bg-green-50 text-green-700 ring-green-200" },
  { db: "REJECTED", ko: "반려",  badge: "bg-rose-50 text-rose-700 ring-rose-200"  },
] as const;

export type DbStatus = (typeof STATUS_LIST)[number]["db"];
export type KoStatus = (typeof STATUS_LIST)[number]["ko"];

export const STATUS_BY_DB = Object.fromEntries(STATUS_LIST.map(s => [s.db, s])) as Record<DbStatus, typeof STATUS_LIST[number]>;
export const STATUS_BY_KO  = Object.fromEntries(STATUS_LIST.map(s => [s.ko, s])) as Record<KoStatus, typeof STATUS_LIST[number]>;

// 문구/공백/대소문자/언더스코어 무시해서 조회 (오타도 일부 커버)
export function getCompanyStatusLabel(key?: string): KoStatus {
  if (!key) return "대기";
  const norm = key.replace(/[\s_-]/g, "").toUpperCase();
  const fix: Record<string, KoStatus> = {
    PENDING: "대기", PEDDING: "대기", PENDDING: "대기",
    APPROVED: "승인", APROVED: "승인",
    REJECTED: "반려",
  };
  return (STATUS_BY_KO as any)[key] || fix[norm] || "대기";
}

// 상태 변경 전이 규칙
export function getNextStatusOptions(curr: DbStatus): { db: DbStatus; ko: KoStatus }[] {
  if (curr === "PENDING")  return [{ db: "APPROVED", ko: "승인" }, { db: "REJECTED", ko: "반려" }];
  if (curr === "REJECTED") return [{ db: "PENDING",  ko: "대기"  }, { db: "APPROVED", ko: "승인" }];
  return []; // APPROVED는 변경 불가
}