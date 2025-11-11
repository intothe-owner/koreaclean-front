import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SwBoot from "./SwBoot";
import { fetchSiteInfoForMeta } from "@/lib/function";
import { baseUrl } from "@/lib/variable";
import Providers from "./providers";
// ✅ (선택) NextAuth v5 쓰면 서버에서 세션을 미리 가져와 초기값으로 넘길 수 있음
// import { auth } from "@/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// 안전 파서: 배열/JSON 문자열/콤마 구분 대응
function parseMetaTags(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(String).map(s => s.trim()).filter(Boolean).slice(0, 20);
  }
  if (typeof input === "string") {
    const v = input.trim();
    if (!v) return [];
    if (v.startsWith("[") && v.endsWith("]")) {
      try { const arr = JSON.parse(v); if (Array.isArray(arr)) return parseMetaTags(arr); } catch {}
    }
    return v.split(/[,\s]+/).map(s => s.trim()).filter(Boolean).slice(0, 20);
  }
  return [];
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSiteInfoForMeta();
  const defaultTitle = "경로당 케어 닷컴";
  const title = site?.site_name || defaultTitle;
  const description = site?.site_description || "경로당 맞춤형 청소";

  const rawIcon = site?.icon_url
    ? (/^https?:\/\//i.test(site.icon_url) ? site.icon_url : `${baseUrl}${site.icon_url}`)
    : "/favicon.png";

  const v = site?.updatedAt ? new Date(site.updatedAt).getTime() : Date.now();
  const iconUrl = `${rawIcon}${rawIcon.includes("?") ? "&" : "?"}v=${v}`;

  const keywords = parseMetaTags(site?.meta_tags);
  const metadataBase =
    process.env.NEXT_PUBLIC_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
      : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : undefined;

  return {
    metadataBase,
    title: { default: title, template: `%s | ${title}` },
    description,
    keywords,
    icons: {
      icon: [{ url: iconUrl, type: "image/png", sizes: "any" }],
      shortcut: [{ url: iconUrl, type: "image/png" }],
      apple: [{ url: iconUrl }],
    },
    openGraph: { type: "website", title, description, images: iconUrl ? [{ url: iconUrl }] : [] },
    twitter: { card: "summary_large_image", title, description, images: iconUrl ? [iconUrl] : [] },
    alternates: { canonical: "/" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // (선택) v5 사용 시 서버에서 미리 세션 주입
  // let session: any = null;
  // try { session = await auth(); } catch {}

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SwBoot />
        {/* session={session} 도입 시 위 주석 해제 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
