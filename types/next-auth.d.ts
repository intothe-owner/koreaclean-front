// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number | string;
      email: string;
      name?: string | null;
      inst?: string | null;
      contact?: string | null;
      phone?: string | null;
      role?: "SUPER" | "ADMIN" | "CLIENT" | "COMPANY" | string | null;
      provider?: string | null;
    };
    accessToken?: string | null;
    refreshToken?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: Session["user"];
    accessToken?: string | null;
    refreshToken?: string | null;
  }
}
