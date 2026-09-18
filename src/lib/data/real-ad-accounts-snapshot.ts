// Snapshot of the agency's real Google Ads / Meta Ads accounts, pulled live via the v4-ads MCP
// (mcp__v4-ads__list_my_accounts / meta_list_my_ad_accounts) during a Claude Code session on
// 2026-09-08. Shared by prisma/link-real-ad-accounts.ts (the one-off name-matching backfill) and
// by listUnmatchedRealAccounts() (src/lib/data/ad-accounts.ts), which surfaces whatever that
// backfill couldn't safely auto-match so a staff member can link it manually from the Contas page.
//
// Static on purpose: there's no server-side Google/Meta API credential configured yet (see
// prisma/import-real-data.ts's header), so refreshing this list means re-running the MCP pull in
// a Claude Code session and updating the arrays below — same "MCP-assisted sync" pattern used
// everywhere else real data enters this app.

export type GoogleAccountSnapshot = { customer_id: string; descriptive_name: string };
export type MetaAccountSnapshot = { ad_account_id: string; account_name: string; business_name: string | null };

// Excludes "Conta Interna - 02" — the agency's own internal/test MCC account, not a client.
export const GOOGLE_ACCOUNTS_SNAPSHOT: GoogleAccountSnapshot[] = [
  { customer_id: "3237459217", descriptive_name: "3 Lagoas Locações" },
  { customer_id: "2640486995", descriptive_name: "Alumínios Veneza" },
  { customer_id: "3542818676", descriptive_name: "Destak Materiais" },
  { customer_id: "4493906974", descriptive_name: "DR DÉRICK VINHAS" },
  { customer_id: "9450567241", descriptive_name: "Dra. Paula Minchillo" },
  { customer_id: "9409785962", descriptive_name: "Fardim Tintas" },
  { customer_id: "9485459729", descriptive_name: "Hust App" },
  { customer_id: "4226457109", descriptive_name: "Icser Indústria Comércio" },
  { customer_id: "8726746966", descriptive_name: "Imperial Alimentos" },
  { customer_id: "9403656466", descriptive_name: "LocaPalmas - Tocantins" },
  { customer_id: "8720262560", descriptive_name: "LocaSim - Feira de Santana" },
  { customer_id: "6438421811", descriptive_name: "LoqObra - Fortaleza" },
  { customer_id: "2260121598", descriptive_name: "Mestre da Obra - Cachoeiro" },
  { customer_id: "4432986150", descriptive_name: "Mestre da Obra - Camaçari" },
  { customer_id: "8621075294", descriptive_name: "Mestre da Obra - Carambeí" },
  { customer_id: "9807750309", descriptive_name: "Mestre da Obra - Chapecó" },
  { customer_id: "5894449831", descriptive_name: "Mestre da Obra - Cotia" },
  { customer_id: "7621086021", descriptive_name: "Mestre da Obra - Goiania" },
  { customer_id: "7862230676", descriptive_name: "Mestre da Obra - João Pessoa" },
  { customer_id: "1171969590", descriptive_name: "Mestre da Obra - Montes Claros - MG" },
  { customer_id: "4879014084", descriptive_name: "Mestre da Obra - Rolândia" },
  { customer_id: "8302336654", descriptive_name: "Mestre da Obra - Rondonópolis" },
  { customer_id: "1163862076", descriptive_name: "Rayane Ribeiro - Nutry" },
  { customer_id: "2330543488", descriptive_name: "SedLoc - Manaus" },
  { customer_id: "5729053147", descriptive_name: "Seu João Locações" },
];

// Excludes the agency's own account ("CA - V4 Lima Soares") and the "DD BM SHEIK" business-manager
// family, which are not V4's own end clients.
export const META_ACCOUNTS_SNAPSHOT: MetaAccountSnapshot[] = [
  { ad_account_id: "act_2337133646484970", account_name: "[Cotia] MDO", business_name: "Mestre da obra - Cotia - SP" },
  { ad_account_id: "act_1470682461507188", account_name: "3 Lagoas Locações", business_name: "3 Lagoas Locações" },
  { ad_account_id: "act_760944201482985", account_name: "CA - Destak Materiais", business_name: "destakmateriais" },
  { ad_account_id: "act_1292624998332379", account_name: "CA - MDO Goiânia", business_name: "Matheus De Souza" },
  { ad_account_id: "act_27798855556414269", account_name: "CA - MDO João Pessoa", business_name: "Mestre Da Obra - João Pessoa" },
  { ad_account_id: "act_1662777044536224", account_name: "CA - Seu João Locações", business_name: "Seu João Locações" },
  { ad_account_id: "act_1128439142303593", account_name: "CONTA 01", business_name: "SedLoc Manaus" },
  { ad_account_id: "act_4051924171730156", account_name: "Dr. Dérick Vinhas", business_name: "Dr. Dérick Vinhas - Cirurgião Torácico" },
  { ad_account_id: "act_1479232423809572", account_name: "Dra. Paula Minchillo", business_name: "Dra. Paula Minchillo - Radiologista" },
  { ad_account_id: "act_1742450026462797", account_name: "Fardim Tintas", business_name: "fardimtintas" },
  { ad_account_id: "act_1489398022911451", account_name: "ICSER", business_name: "ICSER" },
  { ad_account_id: "act_1648706246292124", account_name: "Imperial Alimentos", business_name: "Imperial Alimentos" },
  { ad_account_id: "act_1518876029767347", account_name: "MDO Montes Claros", business_name: "Mestre da Obra Montes Claros-MG" },
  { ad_account_id: "act_1633821681199707", account_name: "MDO Rondonópolis", business_name: "Mestre da Obra - Rondonópolis" },
  { ad_account_id: "act_24879253358328154", account_name: "Mestre da Obra - Cotia", business_name: "Mestre da obra - Cotia - SP" },
  { ad_account_id: "act_4222737191315302", account_name: "Mestre da Obra - Palmas", business_name: "LocaPalmas - Tocantins" },
  { ad_account_id: "act_561651589590879", account_name: "Mestre da Obra Carambeí", business_name: "Mestre da Obra Carambeí" },
  { ad_account_id: "act_374213944466235", account_name: "Panelas Veneza", business_name: "Aluminios Veneza" },
];
