import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { MODULES, moduleForPath, hasModule } from "@/lib/permissions";

const PUBLIC_PATHS = ["/login", "/esqueci-senha", "/redefinir-senha"];
// Internal-team-only regardless of STAFF permission — a CLIENT must never reach these, permission
// or not. (This mirrors requireStaffModule()'s page list in src/lib/session.ts.)
const STAFF_ONLY_PREFIXES = ["/clientes", "/account", "/contas", "/sincronizacoes", "/admin", "/controle-sla", "/equipes", "/usuarios", "/relatorios"];

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

  // ADMIN: unrestricted, always passes.
  if (session.role === "ADMIN") return NextResponse.next();

  // CLIENT: unchanged from before STAFF existed — blocked from every internal-team-only page,
  // otherwise allowed (the pages themselves scope data to their own clientId).
  if (session.role === "CLIENT") {
    if (STAFF_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // STAFF: coarse, JWT-snapshot pre-check for a fast redirect (avoids rendering a page just to
  // bounce). NOT the security boundary — every page also calls requireModule/requireStaffModule,
  // which re-reads permissions from the database, so a permission change takes effect immediately
  // there even if this snapshot is briefly stale (e.g. mid-session, before the user's next login).
  if (session.role === "STAFF") {
    const mod = moduleForPath(pathname);
    // Not a permission-gated page at all (e.g. /sem-permissao, /esqueci-senha handled above) —
    // let it through; nothing sensitive lives outside the module catalog.
    if (!mod) return NextResponse.next();
    if (!hasModule(session.modulePermissions ?? [], mod.key)) {
      const first = MODULES.find((m) => hasModule(session.modulePermissions ?? [], m.key));
      const dest = first ? first.prefixes[0] : "/sem-permissao";
      // Best-effort guess at a valid destination from the JWT snapshot alone; requireModule() on
      // whatever page this lands on will re-validate and redirect again if this guess is wrong.
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
