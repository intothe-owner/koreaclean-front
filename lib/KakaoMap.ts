

/** Kakao Maps SDK 동적 로드 (services 포함) */
export async function ensureKakaoMaps(appKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.kakao?.maps?.services) return; // 이미 로드됨

  await new Promise<void>((resolve, reject) => {
    const scriptId = "kakao-maps-sdk";
    if (document.getElementById(scriptId)) {
      // 이미 로드 중인 스크립트가 있으면 onload만 기다림
      const s = document.getElementById(scriptId) as HTMLScriptElement;
      if (s?.getAttribute("data-loaded") === "true") return resolve();
      s?.addEventListener("load", () => resolve());
      s?.addEventListener("error", () => reject(new Error("Failed to load Kakao SDK")));
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    // autoload=false로 먼저 로드 → load 콜백에서 kakao.maps.load 호출
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      appKey
    )}&autoload=false&libraries=services`;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      if (!window.kakao?.maps) return reject(new Error("Kakao SDK missing maps"));
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("Failed to load Kakao SDK"));
    document.head.appendChild(script);
  });
}

/** 주소 → {lat,lng} 변환 (카카오 지오코딩) */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!window.kakao?.maps?.services) return null;
  return await new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (results: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !results?.length) {
        return resolve(null);
      }
      // Kakao는 x=경도(lng), y=위도(lat)
      const { x, y } = results[0];
      resolve({ lat: Number(y), lng: Number(x) });
    });
  });
}
