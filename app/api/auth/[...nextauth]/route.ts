// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);

// ✅ App Router에선 GET/POST로 export
export { handler as GET, handler as POST };

// (선택) 캐시 방지
export const dynamic = "force-dynamic";
