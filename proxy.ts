import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

function getSubdomainFromReq(req: NextRequest): string | null {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.hostname;
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (
    parts.length >= 3 &&
    parts[0] !== "www" &&
    !hostname.includes("vercel.app") &&
    !hostname.includes("localhost")
  ) {
    return parts[0];
  }
  return null;
}

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const role       = (req.auth?.user as any)?.role ?? null;
  const { pathname } = req.nextUrl;

  const isApiAuth = pathname.startsWith("/api/auth");
  if (isApiAuth) return NextResponse.next();

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

  // O'quvchi → /panel, boshqalar → /dashboard
  const home = role === "STUDENT" ? "/panel" : "/dashboard";
  const isPanel = pathname === "/panel" || pathname.startsWith("/panel/");

  if (subdomain) {
    const origin = `https://${subdomain}.oneroom.uz`;
    const userSubdomain = (req.auth?.user as any)?.orgSubdomain ?? null;

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

  // ── Asosiy domen (oneroom.uz) ────────────────────────────────────────────
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
