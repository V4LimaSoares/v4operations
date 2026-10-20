import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Megaphone,
  Image as ImageIcon,
  Lightbulb,
  RefreshCw,
  Building2,
  Search,
  AtSign,
  HelpCircle,
  FileText,
  Gauge,
  ShieldCheck,
  UserRound,
  UserCog,
  KanbanSquare,
  History,
  FolderOpen,
  Landmark,
  LibraryBig,
  Briefcase,
  Plug,
  Settings,
} from "lucide-react";
import { MODULES } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Render as a single flat link (to the first visible item) instead of an expandable dropdown,
   *  even though it has several items — those items still show up, as tabs on the target page
   *  itself (see performanceTabItems / PerformanceTabs), same pattern as Equipes/Squad. */
  flatten?: boolean;
};

// lucide-react ships no brand marks; Search/AtSign stand in as neutral icons for Google/Meta.
const GoogleIcon = Search;
const MetaIcon = AtSign;

export const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    label: "Performance",
    icon: Gauge,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/google-ads", label: "Google Ads", icon: GoogleIcon },
      { href: "/meta-ads", label: "Meta Ads", icon: MetaIcon },
      { href: "/anuncios", label: "Anúncios", icon: ImageIcon },
      { href: "/campanhas", label: "Campanhas", icon: Megaphone },
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/faturamento", label: "Faturamento", icon: Wallet },
      { href: "/relatorio", label: "Relatório", icon: FileText },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
    ],
  },
];

// Sidebar enxuta (plano de reestruturação, etapa 1): 6 destinos + "Gestão interna" + Configurações.
// Só rótulos e agrupamento mudaram — nenhuma rota foi renomeada ou removida, e os módulos de
// permissão (src/lib/permissions.ts) são os mesmos, então o acesso de cada usuário não muda.
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    items: [{ href: "/admin", label: "Visão Geral", icon: LayoutDashboard }],
  },
  {
    label: "Clientes",
    icon: Users,
    items: [{ href: "/clientes", label: "Clientes", icon: Users }],
  },
  {
    label: "Performance",
    icon: Gauge,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/google-ads", label: "Google Ads", icon: GoogleIcon },
      { href: "/meta-ads", label: "Meta Ads", icon: MetaIcon },
      { href: "/campanhas", label: "Campanhas", icon: Megaphone },
      { href: "/anuncios", label: "Anúncios", icon: ImageIcon },
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/faturamento", label: "Faturamento", icon: Wallet },
      { href: "/relatorio", label: "Relatório", icon: FileText },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
    ],
  },
  {
    // Plumbing técnico (contas de anúncio e sincronização) fora da análise de Performance. Continua
    // liberado pelos mesmos módulos (contas, sincronizacoes) — só mudou de lugar no menu.
    label: "Integrações",
    icon: Plug,
    flatten: true,
    items: [
      { href: "/contas", label: "Contas", icon: Building2 },
      { href: "/sincronizacoes", label: "Sincronizações", icon: RefreshCw },
    ],
  },
  {
    label: "Atendimento",
    icon: ShieldCheck,
    items: [{ href: "/controle-sla", label: "Atendimento", icon: ShieldCheck }],
  },
  {
    label: "Operação",
    icon: KanbanSquare,
    items: [{ href: "/ekyte", label: "Operação", icon: KanbanSquare }],
  },
  {
    label: "Equipe",
    icon: UserRound,
    items: [{ href: "/equipes", label: "Equipe", icon: UserRound }],
  },
  {
    label: "Gestão interna",
    icon: Briefcase,
    items: [
      { href: "/relatorios", label: "Relatórios", icon: FileText },
      { href: "/financeiro", label: "Financeiro", icon: Landmark },
      { href: "/portfolio", label: "Portfólio", icon: LibraryBig },
      { href: "/materiais/docs", label: "Materiais Operacionais", icon: FolderOpen },
    ],
  },
];

// ADMIN-only, never filtered by STAFF module permissions — managing who has access to what isn't
// itself a grantable module (see src/lib/permissions.ts).
export const ADMIN_ONLY_NAV_GROUPS: NavGroup[] = [
  {
    label: "Configurações",
    icon: Settings,
    items: [
      { href: "/usuarios", label: "Usuários e Permissões", icon: UserCog },
      { href: "/atividades", label: "Atividades", icon: History },
    ],
  },
];

// Flat lists kept for call sites that only need "is this href admin-only" style lookups.
export const CLIENT_NAV: NavItem[] = CLIENT_NAV_GROUPS.flatMap((g) => g.items);
export const ADMIN_NAV: NavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

/**
 * The nav groups a given user should actually see — this is what makes the sidebar/mobile menu
 * hide pages a STAFF user isn't permitted to open. Purely a UX convenience: the real access
 * control is enforced server-side per page (requireModule/requireStaffModule), so even if this
 * filtering were somehow bypassed, direct navigation to a hidden URL still gets redirected away.
 */
export function visibleNavGroups(role: "ADMIN" | "STAFF" | "CLIENT", modulePermissions: string[]): NavGroup[] {
  if (role === "CLIENT") return CLIENT_NAV_GROUPS;
  if (role === "ADMIN") return [...ADMIN_NAV_GROUPS, ...ADMIN_ONLY_NAV_GROUPS];

  // STAFF: keep only items whose module the user has been granted, drop groups left empty.
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const path = item.href.split("?")[0];
      return MODULES.some((m) => m.prefixes.some((p) => path === p || path.startsWith(p + "/")) && modulePermissions.includes(m.key));
    }),
  })).filter((group) => group.items.length > 0);
}

/** The Performance subpages a given user can open, in order — same permission filtering as the
 *  sidebar (visibleNavGroups), just pulled out for the tab bar each of those pages renders at
 *  the top (see PerformanceTabs). CLIENT/ADMIN see the full list; STAFF only what they've been
 *  granted. */
export function performanceTabItems(role: "ADMIN" | "STAFF" | "CLIENT", modulePermissions: string[]): NavItem[] {
  const groups = role === "CLIENT" ? CLIENT_NAV_GROUPS : visibleNavGroups(role, modulePermissions);
  return groups.find((g) => g.label === "Performance")?.items ?? [];
}

/** Abas de Integrações (Contas, Sincronizações) — mesma filtragem por permissão do menu. */
export function integrationTabItems(role: "ADMIN" | "STAFF" | "CLIENT", modulePermissions: string[]): NavItem[] {
  if (role === "CLIENT") return [];
  return visibleNavGroups(role, modulePermissions).find((g) => g.label === "Integrações")?.items ?? [];
}
