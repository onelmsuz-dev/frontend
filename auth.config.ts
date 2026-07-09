import type { NextAuthConfig } from "next-auth";

// Edge/Node-compatible config (no DB, no bcrypt). Node runtime'da fetch mavjud —
// access token muddati tugaganda backend `/api/auth/refresh` chaqiriladi.
const BACKEND_URL     = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function refreshAccessToken(token: any) {
  try {
    if (!token.refreshToken) return { ...token, error: "NoRefreshToken" };

    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTERNAL_SECRET ? { "x-internal-secret": INTERNAL_SECRET } : {}),
      },
      body:  JSON.stringify({ refreshToken: token.refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) return { ...token, error: "RefreshFailed" };

    const data = await res.json();
    const u = data.user;

    return {
      ...token,
      id:                 u.id,
      role:               u.role,
      phone:              u.phone,
      teacherId:          u.teacherId ?? null,
      organizationId:     u.organizationId ?? null,
      orgSubdomain:       u.orgSubdomain ?? null,
      accessToken:        data.accessToken,
      refreshToken:       data.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + (data.accessExpiresIn ?? 604800) * 1000,
      error:              undefined,
    };
  } catch {
    return { ...token, error: "RefreshError" };
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Login vaqti — foydalanuvchi va tokenlarni saqlaymiz
      if (user) {
        token.id             = user.id ?? "";
        token.role           = (user as any).role;
        token.phone          = (user as any).phone;
        token.teacherId      = (user as any).teacherId      ?? null;
        token.organizationId = (user as any).organizationId ?? null;
        token.orgSubdomain   = (user as any).orgSubdomain   ?? null;
        (token as any).accessToken        = (user as any).accessToken;
        (token as any).refreshToken       = (user as any).refreshToken;
        (token as any).accessTokenExpires =
          Date.now() + ((user as any).accessExpiresIn ?? 604800) * 1000;
        return token;
      }

      // Access token hali yaroqli (60s bufer bilan) — o'zini qaytaramiz
      const expires = (token as any).accessTokenExpires as number | undefined;
      if (expires && Date.now() < expires - 60_000) {
        return token;
      }

      // Muddati tugagan — refresh qilamiz
      return await refreshAccessToken(token);
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id             = token.id             as string;
        session.user.role           = token.role           as any;
        session.user.phone          = token.phone          as string;
        session.user.teacherId      = token.teacherId      as string | null;
        session.user.organizationId = token.organizationId as string | null;
        session.user.orgSubdomain   = token.orgSubdomain   as string | null;
      }
      // Access token brauzerga OSHKOR QILINMAYDI — faqat JWT (server) ichida.
      (session as any).error = (token as any).error;
      return session;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
};
