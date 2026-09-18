/**
 * One-time backfill for the unified Clientes/Equipes model (see the plan this implements:
 * ~/.claude/plans/twinkling-painting-ritchie.md):
 *
 * 1. Pulls the live Controle de SLA WhatsApp group roster and registers every group as a Client
 *    (matching an existing Client by normalized name first; creating one only when nothing
 *    matches), recording the exact group label on Client.slaGroupName.
 * 2. Matches every distinct client name in the Ekyte task snapshot against the same Client list
 *    (now including the ones just created from SLA), recording the match on
 *    Client.ekyteClientName. Unmatched Ekyte names are reported, not guessed at.
 * 3. Seeds the 9 known teammates (the SLA TEAM roster + Ekyte-only executors) as TeamMember rows.
 * 4. Links each TeamMember to every Client whose Ekyte tasks they actually appear on — a
 *    real, data-backed starting point for "quem cuida de quem" rather than an empty slate.
 *
 * Safe to re-run: matching/creation is idempotent (checks before creating), and step 4 upserts
 * links rather than duplicating them.
 */
import { PrismaClient } from "@prisma/client";
import raw from "../src/lib/data/ekyte-data.json";

const prisma = new PrismaClient();
const SLA_BASE_URL = process.env.NEXT_PUBLIC_SLA_DASHBOARD_URL ?? "http://86.48.18.68:8088";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^v4 company\s*\+\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(mdo|mo)\b/g, "") // "MDO X" / "MO - X" both used for the same client across systems
    .replace(/\s+/g, " ")
    .trim();
}

/** Exact match first; falls back to substring containment (either direction) as long as exactly
 *  one candidate qualifies — an ambiguous or too-short (<5 char) containment is left unmatched
 *  rather than guessed at. */
function findClientMatch<T extends { name: string; company: string }>(needle: string, candidates: T[]): T | null {
  const n = normalize(needle);
  const exact = candidates.filter((c) => normalize(c.name) === n || normalize(c.company) === n);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null; // ambiguous, don't guess

  if (n.length < 5) return null;
  const contains = candidates.filter((c) => {
    const cn = normalize(c.name);
    const cc = normalize(c.company);
    return (
      (cn.length >= 5 && (cn.includes(n) || n.includes(cn))) ||
      (cc.length >= 5 && (cc.includes(n) || n.includes(cc)))
    );
  });
  return contains.length === 1 ? contains[0] : null;
}

function stripSlaPrefix(name: string): string {
  return name.replace(/^V4 Company\s*\+\s*/, "").trim();
}

const TEAM_SEED: { name: string; role: string; colorVar: string }[] = [
  { name: "Mônica Betim", role: "Account", colorVar: "var(--c-monica)" },
  { name: "Camila", role: "Account", colorVar: "var(--c-camila)" },
  { name: "Pedro Vyctor", role: "Gestor de Tráfego", colorVar: "var(--c-pedro)" },
  { name: "Rafael Macêdo", role: "Analista de CRM", colorVar: "var(--c-rafael)" },
  // Ekyte-only executors — real role unknown from the data pulled so far, left generic on
  // purpose rather than guessed; editable from the Equipes page once this lands.
  { name: "Mateus Pereira", role: "Equipe", colorVar: "var(--c-mateus)" },
  { name: "Everton Matheus", role: "Equipe", colorVar: "var(--c-everton)" },
  { name: "Lucas Soares", role: "Equipe", colorVar: "var(--c-lucas)" },
  { name: "Flavia Almeida", role: "Equipe", colorVar: "var(--c-flavia)" },
  { name: "Anderson Matheus", role: "Equipe", colorVar: "var(--c-anderson)" },
];

// Ekyte spells a few of these differently from how TEAM_SEED (SLA's roster) does — same person.
const EKYTE_NAME_ALIAS: Record<string, string> = {
  "monica betim": "Mônica Betim",
  "pedro vytor": "Pedro Vyctor",
};

async function main() {
  console.log("== 1. Registrando clientes a partir dos grupos de SLA ==");
  const res = await fetch(`${SLA_BASE_URL}/live/groups.json`);
  if (!res.ok) throw new Error(`Não consegui buscar groups.json (${res.status})`);
  const groups = (await res.json()) as { name: string; jid: string }[];

  const existingClients = await prisma.client.findMany({
    select: { id: true, name: true, company: true, slaGroupName: true, ekyteClientName: true },
  });

  let slaCreated = 0;
  let slaMatched = 0;
  for (const g of groups) {
    const label = stripSlaPrefix(g.name);
    const already = existingClients.find((c) => c.slaGroupName === g.name);
    if (already) continue; // already registered from a previous run

    const match = findClientMatch(label, existingClients);
    if (match) {
      await prisma.client.update({ where: { id: match.id }, data: { slaGroupName: g.name } });
      match.slaGroupName = g.name;
      console.log(`  MATCH   "${label}" -> Client existente "${match.name}"`);
      slaMatched++;
    } else {
      const created = await prisma.client.create({
        data: { name: label, company: label, status: "ACTIVE", slaGroupName: g.name },
      });
      existingClients.push({
        id: created.id,
        name: created.name,
        company: created.company,
        slaGroupName: created.slaGroupName,
        ekyteClientName: created.ekyteClientName,
      });
      console.log(`  CRIADO  "${label}" (novo Client)`);
      slaCreated++;
    }
  }
  console.log(`Grupos de SLA: ${slaMatched} já vinculados a cliente existente, ${slaCreated} clientes novos criados.\n`);

  console.log("== 2. Casando nomes de cliente do Ekyte ==");
  const ekyteClients = [...new Set(raw.tasks.map((t) => t.client))].sort();
  let ekyteMatched = 0;
  const ekyteUnmatched: string[] = [];
  for (const name of ekyteClients) {
    const already = existingClients.find((c) => c.ekyteClientName === name);
    if (already) continue;
    const match = findClientMatch(name, existingClients);
    if (match) {
      await prisma.client.update({ where: { id: match.id }, data: { ekyteClientName: name } });
      match.ekyteClientName = name;
      console.log(`  MATCH   "${name}" -> Client "${match.name}"`);
      ekyteMatched++;
    } else {
      ekyteUnmatched.push(name);
    }
  }
  console.log(`Ekyte: ${ekyteMatched} casados. ${ekyteUnmatched.length} sem correspondência (revisar manualmente):`);
  for (const u of ekyteUnmatched) console.log(`  SEM MATCH  "${u}"`);
  console.log();

  console.log("== 3. Cadastrando a equipe ==");
  const teamByName = new Map<string, string>(); // name -> id
  for (const t of TEAM_SEED) {
    const existing = await prisma.teamMember.findFirst({ where: { name: t.name } });
    if (existing) {
      teamByName.set(t.name, existing.id);
      continue;
    }
    const created = await prisma.teamMember.create({ data: t });
    teamByName.set(t.name, created.id);
    console.log(`  CRIADO  ${t.name} (${t.role})`);
  }
  console.log();

  console.log("== 4. Vinculando equipe aos clientes, a partir da produção real no Ekyte ==");
  const clientsByEkyteName = new Map(existingClients.filter((c) => c.ekyteClientName).map((c) => [c.ekyteClientName!, c.id]));
  const pairs = new Set<string>(); // `${clientId}:${teamMemberId}`
  for (const t of raw.tasks) {
    const clientId = clientsByEkyteName.get(t.client);
    const personName = EKYTE_NAME_ALIAS[t.executor.toLowerCase()] ?? t.executor;
    const teamMemberId = teamByName.get(personName);
    if (!clientId || !teamMemberId) continue;
    pairs.add(`${clientId}:${teamMemberId}`);
  }
  let linked = 0;
  for (const pair of pairs) {
    const [clientId, teamMemberId] = pair.split(":");
    await prisma.clientTeamMember.upsert({
      where: { clientId_teamMemberId: { clientId, teamMemberId } },
      create: { clientId, teamMemberId },
      update: {},
    });
    linked++;
  }
  console.log(`${linked} vínculos cliente↔equipe criados a partir da produção Ekyte.\n`);

  console.log("Concluído.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
