/**
 * One-time link-up: matches the agency's real Google Ads / Meta Ads accounts (pulled live via
 * the v4-ads MCP — mcp__v4-ads__list_my_accounts / meta_list_my_ad_accounts — during a Claude
 * Code session on 2026-09-08) against the Client roster built from the active SLA WhatsApp
 * groups, and creates a real `AdAccount` row on every match. This is the "MCP-assisted sync"
 * pattern documented in import-real-data.ts's header: until server-side API credentials exist,
 * real account discovery happens by asking Claude (with the MCPs connected) to re-run an import
 * like this one.
 *
 * Only wires up the account shell (platform + externalId + name, dataSource REAL) — pulling
 * actual campaign/ad/metric performance for these accounts is a separate step
 * (prisma/import-real-performance.ts), run after this one so it has accounts to iterate over.
 *
 * Safe to re-run: skips any (platform, externalId) pair that's already linked to a Client.
 */
import { PrismaClient, type Platform } from "@prisma/client";
import { GOOGLE_ACCOUNTS_SNAPSHOT as GOOGLE_ACCOUNTS, META_ACCOUNTS_SNAPSHOT as META_ACCOUNTS } from "../src/lib/data/real-ad-accounts-snapshot";

const prisma = new PrismaClient();

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^v4 company\s*\+\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bmestre da obra\b/g, "mdo")
    .replace(/\b(mdo|mo)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Human-verified aliases for real accounts whose label doesn't share enough words with the SLA
// client name for the automatic matcher to find safely (e.g. a doctor's account under their own
// name vs. the clinic's SLA group name) — same pattern as EKYTE_NAME_ALIAS in unify-clients-team.ts.
const ACCOUNT_NAME_ALIAS: Record<string, string> = {
  "dr derick vinhas": "Goldenmed (Dr. Dérick)",
  "dra paula minchillo": "Gireli & Minchillo (Dra. Paula)",
  // "CA - MDO Goiânia" -> normalized "ca goiania" (mdo stripped as a token); its Meta business_name
  // ("Matheus De Souza", a person) carries no textual signal to the SLA client name, so this needs
  // a human-verified alias like the two above rather than a guess.
  "ca goiania": "MDO Goiânia (Setor Pedro Ludovico)",
};

type ClientCandidate = { id: string; name: string; company: string };

function findMatch(rawLabel: string, candidates: ClientCandidate[]): ClientCandidate | null {
  const n = normalize(rawLabel);
  const alias = ACCOUNT_NAME_ALIAS[n];
  if (alias) {
    const byAlias = candidates.find((c) => c.name === alias);
    if (byAlias) return byAlias;
  }

  const exact = candidates.filter((c) => normalize(c.name) === n || normalize(c.company) === n);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  if (n.length < 5) return null;
  const contains = candidates.filter((c) => {
    const cn = normalize(c.name);
    const cc = normalize(c.company);
    return (cn.length >= 5 && (cn.includes(n) || n.includes(cn))) || (cc.length >= 5 && (cc.includes(n) || n.includes(cc)));
  });
  return contains.length === 1 ? contains[0] : null;
}

async function ensureAdAccount(clientId: string, platform: Platform, externalId: string, name: string) {
  const existing = await prisma.adAccount.findUnique({ where: { platform_externalId: { platform, externalId } } });
  if (existing) {
    if (existing.clientId !== clientId) {
      console.log(`  AVISO  ${platform} ${externalId} já está linkada a outro cliente (id ${existing.clientId}) — não mexi.`);
    }
    return false;
  }
  await prisma.adAccount.create({ data: { clientId, platform, externalId, name, currency: "BRL", dataSource: "REAL" } });
  return true;
}

/** True if this externalId is already linked to some Client — used so a text-match miss on an
 *  account that's already correctly attached (e.g. via merge-duplicate-clients.ts) is reported
 *  accurately instead of as a false "sem match" alarm. */
async function alreadyLinkedElsewhere(platform: Platform, externalId: string): Promise<string | null> {
  const existing = await prisma.adAccount.findUnique({
    where: { platform_externalId: { platform, externalId } },
    include: { client: { select: { name: true } } },
  });
  return existing ? existing.client.name : null;
}

async function main() {
  const clients = await prisma.client.findMany({
    where: { slaGroupName: { not: null } },
    select: { id: true, name: true, company: true },
  });
  console.log(`${clients.length} clientes ativos do SLA disponíveis para casar.\n`);

  console.log("== Google Ads ==");
  let googleLinked = 0;
  for (const acc of GOOGLE_ACCOUNTS) {
    const match = findMatch(acc.descriptive_name, clients);
    if (!match) {
      const linkedTo = await alreadyLinkedElsewhere("GOOGLE_ADS", acc.customer_id);
      console.log(
        linkedTo
          ? `  JÁ EXISTIA (via outro fluxo)  "${acc.descriptive_name}" -> "${linkedTo}"`
          : `  SEM MATCH  "${acc.descriptive_name}" (${acc.customer_id})`
      );
      continue;
    }
    const created = await ensureAdAccount(match.id, "GOOGLE_ADS", acc.customer_id, `${acc.descriptive_name} — Google Ads`);
    console.log(`  ${created ? "LINKADO" : "JÁ EXISTIA"}  "${acc.descriptive_name}" -> "${match.name}"`);
    if (created) googleLinked++;
  }

  console.log("\n== Meta Ads ==");
  let metaLinked = 0;
  for (const acc of META_ACCOUNTS) {
    const match = findMatch(acc.account_name, clients) ?? (acc.business_name ? findMatch(acc.business_name, clients) : null);
    if (!match) {
      const linkedTo = await alreadyLinkedElsewhere("META_ADS", acc.ad_account_id);
      console.log(
        linkedTo
          ? `  JÁ EXISTIA (via outro fluxo)  "${acc.account_name}" -> "${linkedTo}"`
          : `  SEM MATCH  "${acc.account_name}" / business "${acc.business_name ?? "-"}" (${acc.ad_account_id})`
      );
      continue;
    }
    const created = await ensureAdAccount(match.id, "META_ADS", acc.ad_account_id, `${acc.account_name} — Meta Ads`);
    console.log(`  ${created ? "LINKADO" : "JÁ EXISTIA"}  "${acc.account_name}" -> "${match.name}"`);
    if (created) metaLinked++;
  }

  console.log(`\nConcluído. ${googleLinked} contas Google + ${metaLinked} contas Meta linkadas nesta execução.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
