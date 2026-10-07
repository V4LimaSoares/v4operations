import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Edit rights that depend on WHO the person is, on top of the module gates in session.ts (which
 * only decide what a user can open). Cargo comes from the roster profile (TeamMember.role) linked
 * to the login; ADMIN always passes. A STAFF user without a linked profile has no cargo, so no
 * cargo-gated edit rights — they can still view everything their modules allow.
 */

type Actor = { id: string; role: string };

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const CARGO_MATCH = {
  account: (r: string) => r.includes("account"),
  gestor_trafego: (r: string) => r.includes("gestor") && r.includes("trafego"),
} as const;

export type Cargo = keyof typeof CARGO_MATCH;

export async function getTeamProfile(actor: Actor) {
  return prisma.teamMember.findUnique({
    where: { userId: actor.id },
    select: { id: true, role: true, active: true },
  });
}

export async function hasCargo(actor: Actor, cargo: Cargo): Promise<boolean> {
  if (actor.role === "ADMIN") return true;
  if (actor.role !== "STAFF") return false;
  const profile = await getTeamProfile(actor);
  if (!profile || !profile.active) return false;
  return CARGO_MATCH[cargo](normalize(profile.role));
}

/** Own roster profile id (null if none). ADMIN is handled by callers. */
export async function ownTeamMemberId(actor: Actor): Promise<string | null> {
  return (await getTeamProfile(actor))?.id ?? null;
}

export async function canEditOwnProfile(actor: Actor, teamMemberId: string): Promise<boolean> {
  if (actor.role === "ADMIN") return true;
  return (await ownTeamMemberId(actor)) === teamMemberId;
}

export const canEditHealthScore = (actor: Actor) => hasCargo(actor, "account");
export const canEditPerformance = (actor: Actor) => hasCargo(actor, "gestor_trafego");
export const canEditSquad = (actor: Actor) => actor.role === "ADMIN";

export function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export const MSG = {
  squad: "Apenas administradores podem editar squads.",
  healthScore: "Apenas pessoas com o cargo Account (ou administradores) podem editar o Health Score.",
  performance: "Apenas pessoas com o cargo Gestor de Tráfego (ou administradores) podem editar Performance.",
  ownProfile: "Você só pode editar o seu próprio perfil.",
  adminOnly: "Apenas administradores podem fazer isso.",
} as const;
