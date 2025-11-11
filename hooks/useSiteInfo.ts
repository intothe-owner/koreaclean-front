// hooks/useSiteInfo.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteInfoDto } from "@/lib/variable"; 
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

async function fetchSiteInfo(): Promise<SiteInfoDto> {
  const res = await fetchWithAuth("/backend/site/detail", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data?.is_success === false) {
    throw new Error(data?.message || "사이트 정보 조회 실패");
  }
  return data.item as SiteInfoDto;
}

/** anywhere: 읽기 훅 */
export function useSiteInfo() {
  return useQuery({
    queryKey: ["siteInfo"],
    queryFn: fetchSiteInfo,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/** 선택: 저장까지 함께 쓰고 싶을 때 (폼에서 사용) */
export function useSaveSiteInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fd: FormData) => {
      const res = await fetchWithAuth("/backend/site/save", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data?.is_success === false) {
        throw new Error(data?.message || "저장 실패");
      }
      return data.item as SiteInfoDto;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siteInfo"] });
    },
  });
}
