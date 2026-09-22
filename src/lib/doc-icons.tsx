import {
  Megaphone,
  Palette,
  LayoutTemplate,
  BarChart3,
  Route,
  Handshake,
  Layers,
  PenTool,
  Rocket,
  ClipboardCheck,
  Target,
  Users,
  Video,
  FileText,
  type LucideIcon,
} from "lucide-react";

/** Keyword → icon for Materiais Operacionais documents (mostly the imported Notion catalog).
 *  Checked in order, first match wins — keep more specific keywords above broader ones. */
const RULES: [RegExp, LucideIcon][] = [
  [/m[ií]dia paga|google ads|meta ads|\bads\b|tr[aá]fego pago/i, Megaphone],
  [/criativo/i, Palette],
  [/web ?design|site|landing page/i, LayoutTemplate],
  [/dados|dashboard|visualiza[cç][aã]o/i, BarChart3],
  [/jornada|relacionamento/i, Route],
  [/crm|hubspot|pipedrive|kommo|activecampaign/i, Users],
  [/vendas|comercial|isaas/i, Handshake],
  [/stack digital/i, Layers],
  [/conte[uú]do|social boost/i, PenTool],
  [/assessoria de growth/i, Rocket],
  [/auditoria/i, ClipboardCheck],
  [/estrat[eé]gi/i, Target],
  [/v[ií]deo|loom/i, Video],
];

export function iconForDocTitle(title: string): LucideIcon {
  for (const [pattern, icon] of RULES) {
    if (pattern.test(title)) return icon;
  }
  return FileText;
}

/** Same colored-square treatment used everywhere in Materiais Operacionais, icon chosen by
 *  title so each document/category reads at a glance instead of a single repeated glyph. */
export function DocIcon({ title, className = "size-5" }: { title: string; className?: string }) {
  const Icon = iconForDocTitle(title);
  return <Icon className={className} />;
}
