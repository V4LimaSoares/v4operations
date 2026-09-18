/**
 * Single source of truth for the app's permission "modules" — one entry per grantable page/route.
 * Used to: (1) filter the sidebar for STAFF users, (2) drive the checkbox list in the user-editor
 * dialog, and (3) authorize every page/API route server-side via requireModule().
 *
 * Deliberately NOT stored in the database: the set of pages is defined by the codebase itself
 * (adding a new page means adding a nav entry, so it belongs next to that, not in a table that
 * could drift from what actually exists).
 */

export type ModuleKey =
  | "admin_overview"
  | "dashboard"
  | "clientes"
  | "contas"
  | "google_ads"
  | "meta_ads"
  | "campanhas"
  | "anuncios"
  | "insights"
  | "faturamento"
  | "relatorio"
  | "sincronizacoes"
  | "configuracoes"
  | "ajuda"
  | "controle_sla"
  | "equipes"
  | "ekyte"
  | "materiais"
  | "financeiro";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  group: string;
  /** Route prefixes this module covers — a request matches if its pathname starts with any of these. */
  prefixes: string[];
};

export const MODULES: ModuleDef[] = [
  { key: "admin_overview", label: "Visão Geral", group: "Visão Geral", prefixes: ["/admin"] },
  { key: "dashboard", label: "Dashboard", group: "Performance", prefixes: ["/dashboard"] },
  { key: "clientes", label: "Clientes & Health Score", group: "Clientes", prefixes: ["/clientes", "/account"] },
  { key: "contas", label: "Contas", group: "Performance", prefixes: ["/contas"] },
  { key: "google_ads", label: "Google Ads", group: "Performance", prefixes: ["/google-ads"] },
  { key: "meta_ads", label: "Meta Ads", group: "Performance", prefixes: ["/meta-ads"] },
  { key: "campanhas", label: "Campanhas", group: "Performance", prefixes: ["/campanhas"] },
  { key: "anuncios", label: "Anúncios", group: "Performance", prefixes: ["/anuncios"] },
  { key: "insights", label: "Insights", group: "Performance", prefixes: ["/insights"] },
  { key: "faturamento", label: "Faturamento", group: "Performance", prefixes: ["/faturamento"] },
  { key: "relatorio", label: "Relatório", group: "Performance", prefixes: ["/relatorio", "/relatorios"] },
  { key: "sincronizacoes", label: "Sincronizações", group: "Performance", prefixes: ["/sincronizacoes"] },
  { key: "configuracoes", label: "Configurações", group: "Performance", prefixes: ["/configuracoes"] },
  { key: "ajuda", label: "Ajuda", group: "Performance", prefixes: ["/ajuda"] },
  { key: "controle_sla", label: "SLA", group: "SLA", prefixes: ["/controle-sla"] },
  { key: "equipes", label: "Equipes", group: "Equipes", prefixes: ["/equipes"] },
  { key: "ekyte", label: "Operação", group: "Operação", prefixes: ["/ekyte"] },
  { key: "materiais", label: "Materiais Operacionais", group: "Materiais Operacionais", prefixes: ["/materiais"] },
  { key: "financeiro", label: "Financeiro", group: "Financeiro", prefixes: ["/financeiro"] },
];

export const MODULE_KEYS: ModuleKey[] = MODULES.map((m) => m.key);

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as string[]).includes(value);
}

/** Which module (if any) a request path belongs to — used by proxy.ts and requireModule(). */
export function moduleForPath(pathname: string): ModuleDef | null {
  // Longest-prefix match first so a more specific module always wins over a shorter one.
  let best: ModuleDef | null = null;
  let bestLen = -1;
  for (const mod of MODULES) {
    for (const prefix of mod.prefixes) {
      const matches = pathname === prefix || pathname.startsWith(prefix + "/");
      if (matches && prefix.length > bestLen) {
        best = mod;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

/** True if the given effective permission set grants access to a module. */
export function hasModule(modulePermissions: string[], key: ModuleKey): boolean {
  return modulePermissions.includes(key);
}
