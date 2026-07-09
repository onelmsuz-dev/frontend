import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_URL     = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";
const AUTH_SECRET     = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

/**
 * BFF proxy — barcha `/api/*` so'rovlari (NextAuth `/api/auth/*` dan tashqari)
 * shu yerga tushadi va NestJS backendga uzatiladi. Server tomonida JWT'dan
 * access token o'qib, `Authorization: Bearer` bilan yuboradi. Access token
 * brauzerga oshkor qilinmaydi. Frontend hooklari/sahifalari o'zgarmaydi —
 * ular hamon `/api/students` kabi yo'llarni chaqiradi.
 */
async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = req.nextUrl.search;
  const target = `${BACKEND_URL}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  // JWT'dan backend access tokenini olamiz (faqat server tomonda)
  const token = await getToken({ req, secret: AUTH_SECRET, secureCookie: isSecure(req) });
  const accessToken = (token as any)?.accessToken as string | undefined;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  if (accessToken) headers["authorization"] = `Bearer ${accessToken}`;
  if (INTERNAL_SECRET) headers["x-internal-secret"] = INTERNAL_SECRET;
  const subdomain = req.headers.get("x-org-subdomain");
  if (subdomain) headers["x-org-subdomain"] = subdomain;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  let backendRes: Response;
  try {
    backendRes = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { error: "Backend bilan bog'lanib bo'lmadi" },
      { status: 502 },
    );
  }

  const resBody = await backendRes.arrayBuffer();
  const outHeaders = new Headers();
  const ct = backendRes.headers.get("content-type");
  if (ct) outHeaders.set("content-type", ct);

  return new NextResponse(resBody, {
    status: backendRes.status,
    headers: outHeaders,
  });
}

function isSecure(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return req.nextUrl.protocol === "https:";
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
export const HEAD   = handler;
