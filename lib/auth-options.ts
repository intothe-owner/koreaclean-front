// lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { baseUrl } from "./variable";
import { fetchWithAuth } from "./fetchWitgAuth";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      id: "credentials", // ← signIn('credentials')와 일치
      name: "Email & Password",
      credentials: { email: {}, password: {}, rememberMe: {} },
      async authorize(credentials) {


        const res = await fetchWithAuth(`${baseUrl}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
            rememberMe: credentials?.rememberMe === "on" || credentials?.rememberMe === "true",
          }),
        });
        const data = await res.json();

        if (!res.ok || !data?.is_success || !data?.data?.user) {
          throw new Error(data?.message || "로그인 실패");
        }
        console.log(data.data.user);
        return {
          ...data.data.user,
          accessToken: data.data.accessToken ?? null,
          refreshToken: data.data.refreshToken ?? null,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 30 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: (user as any).id,
          email: (user as any).email,
          name: (user as any).name ?? null,
          inst: (user as any).inst ?? null,
          contact: (user as any).contact ?? null,
          phone: (user as any).phone ?? null,
          role: (user as any).role ?? null,
          is_company:(user as any).is_company??false,
          provider: (user as any).provider ?? "local",
        };
        token.accessToken = (user as any).accessToken ?? null;
        token.refreshToken = (user as any).refreshToken ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user = token.user;
      (session as any).accessToken = token.accessToken ?? null;
      (session as any).refreshToken = token.refreshToken ?? null;
      return session;
    },
  },
  pages: { signIn: "/login" },
  debug: process.env.NODE_ENV !== "production",
  secret: process.env.NEXTAUTH_SECRET,
};
