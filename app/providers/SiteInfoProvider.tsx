// components/common/SiteInfoProvider.tsx
"use client";
import { ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SiteInfoDto } from "@/lib/variable"; 
import { fetchWithAuth } from "@/lib/fetchWitgAuth";

export default function SiteInfoProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  useEffect(() => {
    // 앱 진입 시 미리 가져와 캐시에 보관
    qc.prefetchQuery({
      queryKey: ["siteInfo"],
      queryFn: async () => {
        const res = await fetchWithAuth("/backend/site/detail", { cache: "no-store" });
        const data = await res.json();
        return (data?.item || null) as SiteInfoDto | null;
      },
    });
  }, [qc]);

  return <>{children}</>;
}
