// 파일 최상단 import 아래에 추가
export const uuid = (() => {
  const hasCrypto = typeof globalThis !== "undefined" &&
                    globalThis.crypto &&
                    typeof globalThis.crypto.getRandomValues === "function";
  const hasRandomUUID = hasCrypto &&
                        typeof (globalThis.crypto as any).randomUUID === "function";

  function v4(): string {
    // 최신 브라우저 & HTTPS 환경
    if (hasRandomUUID) return (globalThis.crypto as any).randomUUID();

    // 대부분 브라우저에서 동작 (HTTP에서도 대개 가능)
    if (hasCrypto) {
      const bytes = new Uint8Array(16);
      globalThis.crypto!.getRandomValues(bytes);
      // RFC4122 version 4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }

    // 최후의 폴백 (충분히 랜덤하지 않음 → 키 용도 정도로만 사용)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  return v4;
})();