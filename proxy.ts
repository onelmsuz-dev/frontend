import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

function isLocalOrIpHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.includes("vercel.app")) return true;
  // 127.0.0.1 va 172.20.10.2 kabi IP'lar subdomain deb o'qilmasin
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  if (hostname.includes(":")) return true; // IPv6
  return false;
}

function getHostname(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.hostname;
  return host.split(":")[0].toLowerCase();
}

function getSubdomainFromReq(req: NextRequest): string | null {
  const hostname = getHostname(req);
  if (isLocalOrIpHost(hostname)) return null;

  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }
  return null;
}

/**
 * Marketing (asosiy) domenmi — `oneroom.uz` yoki `www.oneroom.uz`.
 *
 * Bu tekshiruv `localhost` va `*.vercel.app` dan ATAYLAB farqlanadi: ularda
 * ham subdomen yo'q, lekin u yerda `/dashboard` ochilishi kerak (lokal
 * ishlab chiqish va preview deploy'lar buzilmasin).
 */
function isMarketingHost(req: NextRequest): boolean {
  const h = getHostname(req);
  return h === "oneroom.uz" || h === "www.oneroom.uz";
}

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const role       = (req.auth?.user as any)?.role ?? null;
  const { pathname } = req.nextUrl;

  const isApiAuth = pathname.startsWith("/api/auth");
  if (isApiAuth) return NextResponse.next();

  // `/ads` — reklama so'rovnomasi: har qanday hostda, login talab qilmasdan
  // ochiladi. Login qilgan odam ham ko'ra olishi kerak (masalan admin
  // reklamani tekshirayotgan bo'lishi mumkin), shu sabab shart yo'q.
  if (pathname === "/ads") return NextResponse.next();

  /**
   * BFF proxy — `/api/*` HECH QACHON sahifaga yo'naltirilmaydi.
   *
   * DIQQAT, bu jiddiy xato edi: quyidagi subdomen shoxobchasi `/api/*` ni ham
   * oddiy sahifa deb qarardi. Login qilgan O'QUVCHI uchun `isPanel` sharti
   * yo'l `/panel` bilan boshlanishini tekshiradi — `/api/panel/profile` esa
   * unga TO'G'RI KELMAYDI. Natijada o'quvchining har bir API chaqiruvi
   * `/panel` ga 302 qilinardi, brauzer `fetch` uni avtomatik kuzatib HTML
   * sahifani 200 status bilan olardi. `r.ok` true bo'lgani uchun hech qanday
   * xato ko'tarilmasdi, `r.json()` esa yiqilib `{}` qaytarardi — butun
   * o'quvchi paneli (profil, guruhlar, to'lovlar, davomat, jadval,
   * gamifikatsiya) jimgina bo'sh ko'rinardi.
   *
   * Xodim va o'qituvchida bu shart yonmaydi (99-qatordagi tekshiruv `isPanel`
   * bo'lishini talab qiladi), shuning uchun dashboard ishlab turgan va xato
   * faqat o'quvchi panelida yashiringan.
   *
   * Ruxsat baribir backendda tekshiriladi (JwtAuthGuard) — bu yerdagi
   * yo'naltirish faqat sahifalar uchun ma'noga ega.
   */
  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    // Pastdagi sahifa shoxobchasi bilan bir xil xatti-harakat saqlanadi.
    // DIQQAT: `res.headers.set` JAVOB headerini qo'yadi, so'rovnikini emas —
    // ya'ni bu qiymat BFF'ning `req.headers.get("x-org-subdomain")` iga
    // yetib bormaydi. Backend ham uni hech qayerda o'qimaydi (faqat CORS
    // ro'yxatida turibdi), tashkilot JWT'dagi `organizationId` dan
    // aniqlanadi. Shu sabab bu qator zararsiz, lekin ishonch qilib
    // bo'lmaydi — kelajakda subdomen konteksti kerak bo'lsa
    // `NextResponse.next({ request: { headers } })` ishlatilishi shart.
    const sub = getSubdomainFromReq(req);
    if (sub) res.headers.set("x-org-subdomain", sub);
    return res;
  }

  // ── /admode routes ──────────────────────────────────────────────────────
  if (pathname.startsWith("/admode")) {
    if (pathname === "/admode/login") {
      if (isLoggedIn && role === "PLATFORM_ADMIN")
        return Response.redirect(new URL("/admode", req.nextUrl));
      return NextResponse.next();
    }
    if (!isLoggedIn)
      return Response.redirect(new URL("/admode/login", req.nextUrl));
    if (role !== "PLATFORM_ADMIN")
      return Response.redirect(new URL("/dashboard", req.nextUrl));
    return NextResponse.next();
  }

  // ── Subdomain routing (demo.oneroom.uz, birnchi.oneroom.uz, ...) ─────────
  const subdomain = getSubdomainFromReq(req);
  const userSubdomain = (req.auth?.user as any)?.orgSubdomain ?? null;

  // O'quvchi → /panel, boshqalar → /dashboard
  const home = role === "STUDENT" ? "/panel" : "/dashboard";
  const isPanel = pathname === "/panel" || pathname.startsWith("/panel/");

  if (subdomain) {
    const origin = `https://${subdomain}.oneroom.uz`;

    // Login bo'lgan bo'lsa, bu subdomain'ga tegishli ekanini tekshir
    if (isLoggedIn && userSubdomain !== subdomain) {
      return Response.redirect(origin + "/login");
    }

    if (pathname === "/") {
      return Response.redirect(origin + (isLoggedIn ? home : "/login"));
    }
    if (pathname === "/login" && isLoggedIn) {
      return Response.redirect(origin + home);
    }
    if (pathname !== "/login" && !isLoggedIn) {
      return Response.redirect(origin + "/login");
    }
    // Rol bo'yicha panel ajratish
    if (isLoggedIn && role === "STUDENT" && !isPanel && pathname !== "/login") {
      return Response.redirect(origin + "/panel");
    }
    if (isLoggedIn && role !== "STUDENT" && isPanel) {
      return Response.redirect(origin + "/dashboard");
    }
    const res = NextResponse.next();
    res.headers.set("x-org-subdomain", subdomain);
    return res;
  }

  // ── Marketing domeni (oneroom.uz / www.oneroom.uz) ───────────────────────
  //
  // Bu yerda TASHKILOT KONTEKSTI YO'Q: `x-org-subdomain` header'i qo'yilmaydi,
  // shuning uchun backend qaysi markaz ekanini aniqlay olmaydi va /dashboard,
  // /students kabi sahifalar baribir bo'sh ishlaydi. Shu sababli ilova
  // sahifalari landingga yo'naltiriladi.
  //
  // Login qilgan foydalanuvchi bo'lsa — landingga emas, O'Z SUBDOMENIGA
  // yuboramiz: u haqiqatan ishlaydigan joy o'sha.
  if (isMarketingHost(req)) {
    // `/api/*` yuqorida, global istisnoda hal qilingan.
    if (pathname === "/") return NextResponse.next();

    if (pathname === "/login") {
      if (isLoggedIn && role === "PLATFORM_ADMIN") {
        return Response.redirect(new URL("/admode", req.nextUrl));
      }
      if (isLoggedIn && userSubdomain) {
        return Response.redirect(`https://${userSubdomain}.oneroom.uz${home}`);
      }
      return NextResponse.next();
    }

    // Qolgan barcha ilova sahifalari (/dashboard, /students, /panel, ...)
    if (isLoggedIn && role === "PLATFORM_ADMIN") {
      return Response.redirect(new URL("/admode", req.nextUrl));
    }
    if (isLoggedIn && userSubdomain) {
      return Response.redirect(`https://${userSubdomain}.oneroom.uz${pathname}`);
    }
    return Response.redirect(new URL("/", req.nextUrl));
  }

  // ── localhost / IP / *.vercel.app — ishlab chiqish va preview ────────────
  if (pathname === "/") return NextResponse.next();
  if (pathname === "/login") {
    if (isLoggedIn) return Response.redirect(new URL(home, req.nextUrl));
    return NextResponse.next();
  }
  if (!isLoggedIn) return Response.redirect(new URL("/login", req.nextUrl));
  if (role === "STUDENT" && !isPanel) return Response.redirect(new URL("/panel", req.nextUrl));
  if (role !== "STUDENT" && isPanel)  return Response.redirect(new URL("/dashboard", req.nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)",
  ],
};
