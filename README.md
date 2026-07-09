# OneLMS — Frontend (Next.js 16)

Multi-tenant o'quv markazlari CRM/LMS tizimining frontend qismi.
**Stack:** Next.js 16 (App Router) · Auth.js v5 (NextAuth) · SWR · Tailwind v4 · shadcn/base-ui · Recharts.

Dizayn, sahifalar, komponentlar va hooklar asl monolitdan **o'zgarmagan**. Farqi:
backend logikasi endi alohida NestJS xizmatida, frontend esa **BFF proxy** orqali unga murojaat qiladi.

## Qanday ishlaydi (BFF proxy)

```
Brauzer  ──►  /api/students  (Next.js, same-origin)
                   │  app/api/[...path]/route.ts
                   │  JWT'dan accessToken o'qiydi → Authorization: Bearer
                   ▼
             NestJS backend  /api/students  →  PostgreSQL
```

- 17 SWR hook va 24 sahifa hamon `/api/*` ni chaqiradi — **hech biri o'zgarmagan**.
- `app/api/[...path]/route.ts` — barcha `/api/*` (NextAuth `/api/auth/*` dan tashqari) ni backendga uzatadi.
- `auth.ts` login DB o'rniga backend `/api/auth/login` ni chaqiradi; access/refresh token JWT ichida (brauzerga oshkor emas).
- `proxy.ts` (Next.js 16 middleware) — subdomen routingi asl holicha.

## Lokal ishga tushirish

```bash
cp .env.example .env.local   # AUTH_SECRET, BACKEND_URL, INTERNAL_API_SECRET
npm install
npm run dev                  # http://localhost:3000  (backend :4000 ishlab turishi kerak)
```

`.env.local`:
```
AUTH_SECRET=...                 # openssl rand -base64 32
BACKEND_URL=http://localhost:4000
INTERNAL_API_SECRET=            # backend bilan bir xil
```

## Vercel deploy

1. Vercel'da yangi loyiha → root direktoriya `frontend/`.
2. Environment Variables:
   - `AUTH_SECRET` — kuchli tasodifiy qiymat.
   - `BACKEND_URL` — `https://api.oneroom.uz` (DigitalOcean backend).
   - `INTERNAL_API_SECRET` — backend bilan bir xil.
3. Wildcard domen: `*.oneroom.uz` va `oneroom.uz` ni Vercel loyihaga qo'shing (subdomenli tenantlar uchun).
4. Deploy.

> Eslatma: `BACKEND_URL` va `INTERNAL_API_SECRET` `NEXT_PUBLIC_` emas — ular faqat
> server (BFF proxy) tomonida o'qiladi va brauzerga chiqmaydi.
