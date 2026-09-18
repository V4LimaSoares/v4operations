/**
 * One-time cleanup: merges duplicate `Client` rows that represent the same real company.
 *
 * Two sources created Client rows independently and never cross-referenced each other:
 *  - `unify-clients-team.ts` registered every active SLA WhatsApp group as a Client
 *    (`slaGroupName` set), with no ad accounts.
 *  - `import-real-data.ts` manually imported real Google/Meta Ads data for a couple of pilot
 *    clients as their own Client rows ("Contato X"), with no `slaGroupName`.
 *
 * Where exactly one of each kind matches by normalized name/company, this merges the
 * non-SLA (real-data) row into the SLA-based one — which becomes canonical — reassigning every
 * FK'd child record, then deletes the now-empty duplicate. A real-data client with no SLA
 * counterpart is left alone and reported, not guessed at.
 *
 * Safe to re-run: once merged, the duplicate row no longer exists, so nothing to merge next time.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^v4 company\s*\+\s*/, "")
    .replace(/^contato\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bmestre da obra\b/g, "mdo")
    .replace(/\b(mdo|mo)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatch<T extends { name: string; company: string }>(needle: { name: string; company: string }, candidates: T[]): T | null {
  const names = [normalize(needle.name), normalize(needle.company)].filter((n) => n.length >= 4);
  const exact = candidates.filter((c) => names.includes(normalize(c.name)) || names.includes(normalize(c.company)));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  const contains = candidates.filter((c) => {
    const cn = normalize(c.name);
    const cc = normalize(c.company);
    return names.some((n) => (cn.length >= 5 && (cn.includes(n) || n.includes(cn))) || (cc.length >= 5 && (cc.includes(n) || n.includes(cc))));
  });
  return contains.length === 1 ? contains[0] : null;
}

async function main() {
  const clients = await prisma.client.findMany({
    include: { adAccounts: { select: { id: true, dataSource: true } } },
  });

  const slaClients = clients.filter((c) => c.slaGroupName);
  const realNonSlaClients = clients.filter((c) => !c.slaGroupName && c.adAccounts.some((a) => a.dataSource === "REAL"));

  console.log(`${slaClients.length} clientes com slaGroupName (candidatos a canônico).`);
  console.log(`${realNonSlaClients.length} clientes reais sem slaGroupName (candidatos a duplicata).\n`);

  let merged = 0;
  for (const dup of realNonSlaClients) {
    const canonical = findMatch(dup, slaClients);
    if (!canonical) {
      console.log(`SEM MATCH  "${dup.name}" / "${dup.company}" — fica como cliente real avulso, revisar manualmente.`);
      continue;
    }

    console.log(`MERGE  "${dup.name}" / "${dup.company}" -> "${canonical.name}" (canônico, tem slaGroupName)`);

    const [ad, users, revenue, insights, health] = await Promise.all([
      prisma.adAccount.updateMany({ where: { clientId: dup.id }, data: { clientId: canonical.id } }),
      prisma.user.updateMany({ where: { clientId: dup.id }, data: { clientId: canonical.id } }),
      prisma.revenueEntry.updateMany({ where: { clientId: dup.id }, data: { clientId: canonical.id } }),
      prisma.insight.updateMany({ where: { clientId: dup.id }, data: { clientId: canonical.id } }),
      prisma.healthScoreEntry.updateMany({ where: { clientId: dup.id }, data: { clientId: canonical.id } }),
    ]);
    console.log(
      `  reatribuído: ${ad.count} adAccount, ${users.count} user, ${revenue.count} revenueEntry, ${insights.count} insight, ${health.count} healthScoreEntry`
    );

    await prisma.client.delete({ where: { id: dup.id } });
    console.log(`  duplicata "${dup.name}" removida.\n`);
    merged++;
  }

  console.log(`Concluído. ${merged} cliente(s) mesclado(s).`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
