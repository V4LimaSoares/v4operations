import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/esqueci-senha", "/redefinir-senha"];
const ADMIN_ONLY_PREFIXES = ["/clientes", "/contas", "/sincronizacoes", "/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(session ? "/dashboard" : "/login", req.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    session.role !== "ADMIN" &&
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
