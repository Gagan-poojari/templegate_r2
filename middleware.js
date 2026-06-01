import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-constants";
import { verifyTokenEdge } from "@/lib/auth-edge";

const publicPaths = ["/login", "/register"];
const publicApiPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const isPublicPage = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isPublicApi = publicApiPaths.some((p) => pathname === p);
  const isApi = pathname.startsWith("/api/");

  let session = null;
  if (token) {
    try {
      session = await verifyTokenEdge(token);
    } catch {
      session = null;
    }
  }

  if (isPublicPage || isPublicApi) {
    if (session && publicPaths.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/vendors/:path*",
    "/approvals/:path*",
    "/payments/:path*",
    "/reports/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};
