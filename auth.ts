import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";

const loginSchema = z.object({
  phone:     z.string().min(1),
  password:  z.string().min(1),
  subdomain: z.string().optional().default(""),
});

const BACKEND_URL     = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

/**
 * Auth endi backend (NestJS) tomonidan boshqariladi. NextAuth faqat brauzer
 * sessiyasi/cookie va proxy routingi uchun ishlatiladi. `authorize()` DB/bcrypt
 * o'rniga backend `/api/auth/login` ni chaqiradi va qaytgan access/refresh
 * tokenlarni JWT ichida saqlaydi (BFF proxy shulardan foydalanadi).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              ...(INTERNAL_SECRET ? { "x-internal-secret": INTERNAL_SECRET } : {}),
            },
            body: JSON.stringify(parsed.data),
            cache: "no-store",
          });

          if (!res.ok) return null;

          const data = await res.json();
          const u = data.user;
          if (!u?.id) return null;

          return {
            id:              u.id,
            name:            u.name,
            email:           u.email ?? "",
            phone:           u.phone,
            role:            u.role,
            teacherId:       u.teacherId ?? null,
            organizationId:  u.organizationId ?? null,
            orgSubdomain:    u.orgSubdomain ?? null,
            accessToken:     data.accessToken,
            refreshToken:    data.refreshToken,
            accessExpiresIn: data.accessExpiresIn ?? 604800,
          } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
});
