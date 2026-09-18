import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth";
import { MODULES, hasModule, type ModuleKey } from "@/lib/permissions";

// `NODE_ENV=production` doesn't imply the deployment is actually served over HTTPS (e.g. this
// app is reachable over plain HTTP on a raw port while it awaits a proper TLS domain). A `Secure`
// cookie set from a plain-HTTP response is silently dropped by browsers, breaking login. So this
// is driven by an explicit env var instead, defaulting to on only when unset in production.
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Reads and verifies the session cookie. Does NOT check DB revocation — use getCurrentUser() for that. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Full user record from DB, re-validating sessionVersion so a password reset / deactivation revokes old sessions. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { client: true },
  });

  if (!user || !user.active) return null;
  if (user.sessionVersion !== session.sessionVersion) return null;

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect(fallbackPathFor(user));
  return user;
}

/** Where to send a user who just got bounced from a page they can't access — never a page that
 *  would immediately bounce them again, which is why this doesn't just always say "/dashboard". */
function fallbackPathFor(user: { role: string; modulePermissions: string[] }): string {
  if (user.role === "CLIENT") return "/dashboard";
  if (user.role === "ADMIN") return "/admin";
  const first = MODULES.find((m) => hasModule(user.modulePermissions, m.key));
  return first ? first.prefixes[0] : "/sem-permissao";
}

/**
 * Authoritative, request-fresh module gate for pages that are internal-team-only regardless of
 * permission (a CLIENT should never land here even by mistake) — /admin, /clientes, /account,
 * /contas, /sincronizacoes, /controle-sla, /equipes. ADMIN always passes; STAFF needs the module in
 * their (DB-backed) permission set; CLIENT is bounced to their own dashboard.
 *
 * This — not proxy.ts — is the real security boundary. proxy.ts does a coarse pre-check off the
 * JWT for a snappier redirect, but that snapshot can go stale if an admin edits a user's access
 * mid-session; this hits the database on every call, so it's always correct even before the JWT
 * catches up.
 */
export async function requireStaffModule(key: ModuleKey) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (user.role === "STAFF" && hasModule(user.modulePermissions, key)) return user;
  redirect(fallbackPathFor(user));
}

/**
 * Same authoritative DB-backed check, for pages CLIENT and STAFF both legitimately use (Dashboard,
 * Google Ads, Meta Ads, Campanhas, Anúncios, Insights, Faturamento, Relatório, Ajuda,
 * Configurações). ADMIN and CLIENT pass unconditionally (unchanged from before permissions
 * existed); STAFF needs the module permission.
 */
export async function requireModule(key: ModuleKey) {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "CLIENT") return user;
  if (user.role === "STAFF" && hasModule(user.modulePermissions, key)) return user;
  redirect(fallbackPathFor(user));
}
