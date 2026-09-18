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

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    items: [{ href: "/admin", label: "Visão Geral", icon: LayoutDashboard }],
  },
  {
    label: "Performance",
    icon: Gauge,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/contas", label: "Contas", icon: Building2 },
      { href: "/google-ads", label: "Google Ads", icon: GoogleIcon },
      { href: "/meta-ads", label: "Meta Ads", icon: MetaIcon },
      { href: "/campanhas", label: "Campanhas", icon: Megaphone },
      { href: "/anuncios", label: "Anúncios", icon: ImageIcon },
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/faturamento", label: "Faturamento", icon: Wallet },
      { href: "/relatorio", label: "Relatório", icon: FileText },
      { href: "/sincronizacoes", label: "Sincronizações", icon: RefreshCw },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
    ],
  },
  {
    label: "SLA",
    icon: ShieldCheck,
    items: [{ href: "/controle-sla", label: "SLA", icon: ShieldCheck }],
  },
  {
    label: "Operação",
    icon: KanbanSquare,
    items: [{ href: "/ekyte", label: "Operação", icon: KanbanSquare }],
  },
  {
    label: "Relatórios",
    icon: FileText,
    items: [{ href: "/relatorios", label: "Relatórios", icon: FileText }],
  },
  {
    label: "Clientes",
    icon: Users,
    items: [{ href: "/clientes", label: "Clientes", icon: Users }],
  },
  {
    label: "Equipes",
    icon: UserRound,
    items: [{ href: "/equipes", label: "Equipes", icon: UserRound }],
  },
  {
    label: "Materiais Operacionais",
    icon: FolderOpen,
    items: [{ href: "/materiais", label: "Materiais Operacionais", icon: FolderOpen }],
  },
  {
    label: "Financeiro",
    icon: Landmark,
    items: [{ href: "/financeiro", label: "Financeiro", icon: Landmark }],
  },
];

// ADMIN-only, never filtered by STAFF module permissions — managing who has access to what isn't
// itself a grantable module (see src/lib/permissions.ts).
export const ADMIN_ONLY_NAV_GROUPS: NavGroup[] = [
  {
    label: "Administração",
    icon: UserCog,
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
      return MODULES.some((m) => m.prefixes.some((p) => path === p) && modulePermissions.includes(m.key));
    }),
  })).filter((group) => group.items.length > 0);
}
