import type { NextAuthConfig } from "next-auth";
import { SESSION_EXPIRED } from "@/lib/session-expiry";

// Edge/Node-compatible config (no DB, no bcrypt). Node runtime'da fetch mavjud —
// access token muddati tugaganda backend `/api/auth/refresh` chaqiriladi.
const BACKEND_URL     = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

/**
 * Access token muddati tugashidan qancha oldin yangilanadi (ms).
 * So'rov yo'lda ketayotganda token o'lib qolmasligi uchun zaxira.
 */
const REFRESH_BUFFER_MS = 60_000;

/**
 * Vaqtinchalik nosozlikdan keyin qayta urinishgacha kutish (ms).
 *
 * DIQQAT: bu qiymat {@link REFRESH_BUFFER_MS} dan KATTA bo'lishi SHART.
 * Teng bo'lsa, quyidagi `Date.now() < expires - REFRESH_BUFFER_MS` sharti
 * darhol yolg'on bo'ladi va backend yiqilgan paytda har bir so'rov yangi
 * refresh urinishini boshlab, serverni yana ko'proq uradi.
 */
const RETRY_MS = REFRESH_BUFFER_MS * 2;

async function refreshAccessToken(token: any) {
  try {
    if (!token.refreshToken) return { ...token, error: SESSION_EXPIRED };

    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTERNAL_SECRET ? { "x-internal-secret": INTERNAL_SECRET } : {}),
      },
      body:  JSON.stringify({ refreshToken: token.refreshToken }),
      cache: "no-store",
    });

    // MUHIM FARQ: "sessiya o'ldi" bilan "server hozir javob bermadi" —
    // butunlay boshqa narsa. Ilgari ikkalasi ham bir xil `RefreshFailed`
    // edi; endi faqat 401 sessiyani tugatadi. Backend bir daqiqaga
    // yiqilsa yoki rate-limit ursa, eski token saqlanadi va keyingi
    // so'rovda qayta urinamiz — aks holda qisqa uzilish BARCHA
    // foydalanuvchini login sahifasiga otib yuborardi.
    //
    // 403 ATAYLAB kirmaydi: `/api/auth/refresh` sessiya uchun HECH QACHON
    // 403 qaytarmaydi (u faqat 401 tashlaydi). 403 — `InternalSecretGuard`,
    // ya'ni `INTERNAL_API_SECRET` mos kelmagani. Bu infratuzilma nosozligi;
    // uni "muddat tugadi" deb sanasak, sir noto'g'ri qo'yilgan zahoti
    // BUTUN platforma bir vaqtda login sahifasiga otilib ketardi.
    if (!res.ok) {
      if (res.status === 401) return { ...token, error: SESSION_EXPIRED };
      return { ...token, error: undefined, accessTokenExpires: Date.now() + RETRY_MS };
    }

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
    // Tarmoq xatosi — vaqtinchalik. Sessiya tugadi deb hisoblamaymiz.
    return { ...token, error: undefined, accessTokenExpires: Date.now() + RETRY_MS };
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
      if (expires && Date.now() < expires - REFRESH_BUFFER_MS) {
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
  /**
   * Sessiya muddati — BIR OY.
   *
   * `maxAge` ilgari yozilmagan edi va NextAuth standartiga tayanardi.
   * Endi aniq yozilgan: foydalanuvchi bir oy davomida TEGMASA sessiya
   * tugaydi. Ishlatib turgan odam chiqarilmaydi — `updateAge` har kuni
   * muddatni yangilab turadi. Backenddagi refresh token muddati ham
   * shuncha (`JWT_REFRESH_TTL=30d`); ikkisi bir xil bo'lishi SHART, aks
   * holda biri tirik, ikkinchisi o'lik holat yuzaga keladi.
   */
  session: {
    strategy:  "jwt",
    maxAge:    30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
};
