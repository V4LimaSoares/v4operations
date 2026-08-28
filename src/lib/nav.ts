import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Megaphone,
  Image as ImageIcon,
  Lightbulb,
  Settings,
  RefreshCw,
  Building2,
  Search,
  AtSign,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// lucide-react ships no brand marks; Search/AtSign stand in as neutral icons for Google/Meta.
const GoogleIcon = Search;
const MetaIcon = AtSign;

export const CLIENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/google-ads", label: "Google Ads", icon: GoogleIcon },
  { href: "/meta-ads", label: "Meta Ads", icon: MetaIcon },
  { href: "/anuncios", label: "Anúncios", icon: ImageIcon },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/faturamento", label: "Faturamento", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/contas", label: "Contas", icon: Building2 },
  { href: "/google-ads", label: "Google Ads", icon: GoogleIcon },
  { href: "/meta-ads", label: "Meta Ads", icon: MetaIcon },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/anuncios", label: "Anúncios", icon: ImageIcon },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/faturamento", label: "Faturamento", icon: Wallet },
  { href: "/sincronizacoes", label: "Sincronizações", icon: RefreshCw },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
