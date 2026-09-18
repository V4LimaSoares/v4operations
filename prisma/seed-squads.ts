/**
 * Seeds the initial squads (Vanguard, 02, 03) and staffs Squad Vanguard with its real roster.
 * Safe to re-run — squads/members are looked up by name first, so nothing is duplicated.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Same rotating palette POST /api/admin/team uses for a new hire without a named CSS var.
const NEW_MEMBER_PALETTE = ["#0ea5e9", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16", "#a855f7"];

async function ensureSquad(name: string) {
  const existing = await prisma.squad.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.squad.create({ data: { name } });
}

async function ensureTeamMember(name: string, role: string) {
  const existing = await prisma.teamMember.findFirst({ where: { name } });
  if (existing) return existing;
  const count = await prisma.teamMember.count();
  const colorVar = NEW_MEMBER_PALETTE[count % NEW_MEMBER_PALETTE.length];
  return prisma.teamMember.create({ data: { name, role, colorVar } });
}

async function ensureSquadMember(squadId: string, teamMemberId: string, role: string) {
  await prisma.squadMember.upsert({
    where: { squadId_teamMemberId: { squadId, teamMemberId } },
    create: { squadId, teamMemberId, role },
    update: { role },
  });
}

async function main() {
  const vanguard = await ensureSquad("Squad Vanguard");
  await ensureSquad("Squad 02");
  await ensureSquad("Squad 03");

  const monica = await prisma.teamMember.findFirst({ where: { name: "Mônica Betim" } });
  const anderson = await prisma.teamMember.findFirst({ where: { name: "Anderson Matheus" } });
  const pedro = await prisma.teamMember.findFirst({ where: { name: "Pedro Vyctor" } });
  const rafael = await prisma.teamMember.findFirst({ where: { name: "Rafael Macêdo" } });
  const mateus = await prisma.teamMember.findFirst({ where: { name: "Mateus Pereira" } });
  const matheusLima = await ensureTeamMember("Matheus Lima", "Designer");

  const vanguardRoster: { member: { id: string } | null; label: string; squadRole: string }[] = [
    { member: monica, label: "Mônica Betim", squadRole: "Account" },
    { member: anderson, label: "Anderson Matheus", squadRole: "Gestor de Projetos" },
    { member: pedro, label: "Pedro Vyctor", squadRole: "Gestor" },
    { member: rafael, label: "Rafael Macêdo", squadRole: "Analista de Marketing" },
    { member: mateus, label: "Mateus Pereira", squadRole: "Estrategista de Conteúdo" },
    { member: matheusLima, label: "Matheus Lima", squadRole: "Designer" },
  ];

  for (const { member, label, squadRole } of vanguardRoster) {
    if (!member) {
      console.warn(`Squad Vanguard: "${label}" não encontrado em TeamMember — pulando.`);
      continue;
    }
    await ensureSquadMember(vanguard.id, member.id, squadRole);
  }

  console.log("Seed de squads concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
