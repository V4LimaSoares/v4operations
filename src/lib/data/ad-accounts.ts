import "server-only";
import { prisma } from "@/lib/prisma";
import { GOOGLE_ACCOUNTS_SNAPSHOT, META_ACCOUNTS_SNAPSHOT } from "@/lib/data/real-ad-accounts-snapshot";

export type UnmatchedRealAccount = {
  platform: "GOOGLE_ADS" | "META_ADS";
  externalId: string;
  name: string;
  label: string;
};

/** Real Google/Meta accounts from the MCP snapshot that aren't linked to any Client yet — either
 *  because the name-matching backfill (prisma/link-real-ad-accounts.ts) found no safe match, or
 *  because the client it belongs to hasn't been reviewed. Surfaced on the Contas page so a staff
 *  member can link them by hand instead of needing another MCP-assisted script run. */
export async function listUnmatchedRealAccounts(): Promise<UnmatchedRealAccount[]> {
  const existing = await prisma.adAccount.findMany({ select: { platform: true, externalId: true } });
  const linked = new Set(existing.map((a) => `${a.platform}:${a.externalId}`));

  const google: UnmatchedRealAccount[] = GOOGLE_ACCOUNTS_SNAPSHOT.filter(
    (a) => !linked.has(`GOOGLE_ADS:${a.customer_id}`)
  ).map((a) => ({
    platform: "GOOGLE_ADS",
    externalId: a.customer_id,
    name: `${a.descriptive_name} — Google Ads`,
    label: a.descriptive_name,
  }));

  const meta: UnmatchedRealAccount[] = META_ACCOUNTS_SNAPSHOT.filter(
    (a) => !linked.has(`META_ADS:${a.ad_account_id}`)
  ).map((a) => ({
    platform: "META_ADS",
    externalId: a.ad_account_id,
    name: `${a.account_name} — Meta Ads`,
    label: a.business_name && a.business_name !== a.account_name ? `${a.account_name} (${a.business_name})` : a.account_name,
  }));

  return [...google, ...meta];
}
