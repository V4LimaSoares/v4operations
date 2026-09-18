"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Building2,
  HeartPulse,
  Users,
  Settings2,
  TrendingUp,
  Wallet,
  Target,
  ListChecks,
  ClipboardList,
  Percent,
  CalendarClock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  History,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CHECKLIST_ITEMS } from "@/lib/health-score-checklist";
import { EMPTY_HEALTH_SCORE_FORM_ENTRY, type HealthScoreFormEntry } from "@/lib/health-score-form";
import { formatBRL, formatPercent, formatDate, formatDateTime, cn } from "@/lib/utils";

export type { HealthScoreFormEntry } from "@/lib/health-score-form";
export { toHealthScoreFormEntry } from "@/lib/health-score-form";

const CHECK_OPTIONS = ["", "Sim", "Não", "Não Contratado"];
const TEAM_ROLES = ["Account", "Gestor de Tráfego", "Analista de CRM", "Designer", "Social Media", "Stakeholder"];

type BadgeVariant = "default" | "primary" | "positive" | "negative" | "warning" | "info" | "outline";

function flagBadgeVariant(flag: string | null): BadgeVariant {
  const f = (flag ?? "").trim().toLowerCase();
  if (f.startsWith("risco iminente")) return "negative";
  if (f.startsWith("risco")) return "warning";
  if (f.startsWith("saud")) return "positive";
  return "outline";
}

function phaseBadgeVariant(phase: string): BadgeVariant {
  const p = phase.trim().toLowerCase();
  if (p === "churn") return "negative";
  if (p === "onboarding") return "info";
  return "primary";
}

function simNaoBadgeVariant(v: string | null): BadgeVariant {
  if (v === "Sim" || v === "Em dia") return "positive";
  if (v === "Não" || v === "Atrasado") return "negative";
  return "outline";
}

function toISODate(d: string | null) {
  if (!d) return "";
  return d.slice(0, 10);
}

export function HealthScoreDialog({
  entry,
  clients,
  defaultClientId,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  entry?: HealthScoreFormEntry;
  clients: { id: string; name: string; company: string }[];
  /** Pre-fills "Cliente vinculado" for a new entry created from that client's own page — ignored
   *  when editing an existing entry (which already has its own clientId). */
  defaultClientId?: string;
  /** Omit to get the dialog's own trigger button (Editar/Adicionar registro); pass `null` to
   *  render no trigger at all (fully controlled via `open`/`onOpenChange` — e.g. a table row). */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<HealthScoreFormEntry>(
    entry ?? { ...EMPTY_HEALTH_SCORE_FORM_ENTRY, clientId: defaultClientId ?? null }
  );
  const isEdit = !!entry?.id;
  // An existing record opens locked (view-only) by default — editing is an explicit action, not
  // the default state, so nobody accidentally overwrites real client data while just browsing.
  const [locked, setLocked] = useState(isEdit);

  useEffect(() => {
    if (open) {
      setForm(entry ?? { ...EMPTY_HEALTH_SCORE_FORM_ENTRY, clientId: defaultClientId ?? null });
      setLocked(!!entry?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry?.id]);

  function set<K extends keyof HealthScoreFormEntry>(key: K, value: HealthScoreFormEntry[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setChecklist(key: string, value: string) {
    setForm((f) => {
      const next = { ...(f.checklist ?? {}) };
      if (value) next[key] = value;
      else delete next[key];
      return { ...f, checklist: next };
    });
  }

  function cancelEdit() {
    setForm(entry ?? { ...EMPTY_HEALTH_SCORE_FORM_ENTRY, clientId: defaultClientId ?? null });
    setLocked(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/health-score/${entry!.id}` : "/api/health-score", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(isEdit ? "Registro atualizado." : "Registro de Health Score adicionado.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!entry?.id) return;
    if (!confirm(`Remover o registro de Health Score "${entry.product ?? entry.clientName}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/health-score/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível remover.");
        return;
      }
      toast.success("Removido.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // Deletes the actual Client tenant record (cascades to ad accounts, users, Equipe links,
  // Account notes) — distinct from onDelete above, which only removes this Health Score row.
  // Only offered when this entry is linked to a real Client (form.clientId).
  async function onDeleteClient() {
    if (!form.clientId) return;
    if (
      !confirm(
        `Excluir permanentemente o cliente "${form.clientName}" e todos os dados vinculados (contas de anúncio, usuários, equipe, notas)? Os registros de Health Score deste cliente ficarão sem vínculo, mas não serão apagados. Esta ação não pode ser desfeita.`
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${form.clientId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Não foi possível excluir o cliente.");
        return;
      }
      toast.success("Cliente excluído.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (isEdit ? (
            <Button variant="ghost" size="sm">
              <Pencil className="size-3.5" /> Editar
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="size-4" /> Adicionar registro
            </Button>
          ))}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{isEdit ? entry!.clientName : "Adicionar registro de Health Score"}</DialogTitle>
              <DialogDescription>
                {locked
                  ? "Registro travado para evitar edição acidental. Clique em Editar para alterar."
                  : "Mesmas informações da planilha de Health Score — dados financeiros, checklist de saúde da conta e probabilidade de churn."}
              </DialogDescription>
            </div>
            {isEdit && locked && (
              <Button type="button" size="sm" onClick={() => setLocked(false)} className="shrink-0">
                <Pencil className="size-3.5" /> Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        {locked ? (
          <>
            <HealthScoreView form={form} clients={clients} />
            {form.clientId && (
              <DialogFooter className="justify-start sm:justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onDeleteClient}
                  disabled={loading}
                  className="text-negative hover:bg-negative-soft"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  <Trash2 className="size-4" /> Excluir cliente
                </Button>
              </DialogFooter>
            )}
          </>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <Section title="Informações do cliente" icon={Building2}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente" required>
                  <Input required value={form.clientName} onChange={(e) => set("clientName", e.target.value)} />
                </Field>
                <Field label="Produto">
                  <Input value={form.product ?? ""} onChange={(e) => set("product", e.target.value || null)} />
                </Field>
                <Field label="Data de início">
                  <Input type="date" value={toISODate(form.projectStart)} onChange={(e) => set("projectStart", e.target.value || null)} />
                </Field>
                <Field label="Data de fim">
                  <Input type="date" value={toISODate(form.endDate)} onChange={(e) => set("endDate", e.target.value || null)} />
                </Field>
                <Field label="Contrato (link do documento)">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.contractLink ?? ""}
                    onChange={(e) => set("contractLink", e.target.value || null)}
                  />
                </Field>
                <Field label="Fee mensal (R$)">
                  <NumberInput value={form.feeBrl} onChange={(v) => set("feeBrl", v)} />
                </Field>
              </div>

              <details className="mt-3 group">
                <summary className="cursor-pointer text-xs font-medium text-muted hover:text-foreground">
                  Detalhes adicionais
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Cliente vinculado (filtro do topo)">
                    <Select value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value || null)}>
                      <option value="">Nenhum — não aparece em filtros por cliente</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.company}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Categoria do produto">
                    <Input value={form.productCategory ?? ""} onChange={(e) => set("productCategory", e.target.value || null)} />
                  </Field>
                  <Field label="LT (meses)">
                    <NumberInput value={form.leadTimeMonths} onChange={(v) => set("leadTimeMonths", v != null ? Math.round(v) : null)} />
                  </Field>
                  <Field label="Replanejamento">
                    <Input type="date" value={toISODate(form.replanDate)} onChange={(e) => set("replanDate", e.target.value || null)} />
                  </Field>
                  <Field label="Última atualização">
                    <Input type="date" value={toISODate(form.lastUpdate)} onChange={(e) => set("lastUpdate", e.target.value || null)} />
                  </Field>
                  <Field label="Margem de cont. (%)">
                    <NumberInput value={form.contributionMarginPct} onChange={(v) => set("contributionMarginPct", v)} />
                  </Field>
                  <Field label="ROI">
                    <NumberInput value={form.roi} onChange={(v) => set("roi", v)} />
                  </Field>
                  <Field label="Link do planejamento">
                    <Input value={form.planningLink ?? ""} onChange={(e) => set("planningLink", e.target.value || null)} />
                  </Field>
                </div>
              </details>
            </Section>

            <Section title="Saúde da conta" icon={HeartPulse}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Flag">
                  <Select value={form.flag ?? ""} onChange={(e) => set("flag", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="Saudável">Saudável</option>
                    <option value="Risco">Risco</option>
                    <option value="Risco Iminente">Risco Iminente</option>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.phase} onChange={(e) => set("phase", e.target.value)}>
                    <option value="Onboarding">Onboarding</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="Churn">Churn</option>
                  </Select>
                </Field>
                <Field label="Resultado">
                  <Select value={form.growth ?? ""} onChange={(e) => set("growth", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </Select>
                </Field>
                <Field label="Relacionamento">
                  <Select value={form.stakeholderRelationship ?? ""} onChange={(e) => set("stakeholderRelationship", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="Saudável">Saudável</option>
                    <option value="Risco">Risco</option>
                  </Select>
                </Field>
                <Field label="Churn (%)">
                  <NumberInput value={form.churnProbabilityPct} onChange={(v) => set("churnProbabilityPct", v)} />
                </Field>
                <Field label="Check-in">
                  <Input type="date" value={toISODate(form.nextCheckin)} onChange={(e) => set("nextCheckin", e.target.value || null)} />
                </Field>
                <Field label="HS em dia?">
                  <Select value={form.hsUpToDate ?? ""} onChange={(e) => set("hsUpToDate", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="Em dia">Em dia</option>
                    <option value="Atrasado">Atrasado</option>
                  </Select>
                </Field>
                <Field label="Responsável interno">
                  <Input value={form.accountOwner ?? ""} onChange={(e) => set("accountOwner", e.target.value || null)} />
                </Field>
              </div>
            </Section>

            <Section title="Time" icon={Users}>
              <TeamSection clientId={form.clientId} />
            </Section>

            <Section title="Operação" icon={Settings2}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Periodicidade da análise">
                  <Select value={form.analysisFrequency ?? ""} onChange={(e) => set("analysisFrequency", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                  </Select>
                </Field>
                <Field label="Investimento mídia paga (R$)">
                  <NumberInput value={form.paidMediaInvestmentBrl} onChange={(v) => set("paidMediaInvestmentBrl", v)} />
                </Field>
                <Field label="Drive (link)">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.driveLink ?? ""}
                    onChange={(e) => set("driveLink", e.target.value || null)}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Meta de faturamento" icon={TrendingUp}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Meta (R$)">
                  <NumberInput value={form.revenueGoalBrl} onChange={(v) => set("revenueGoalBrl", v)} />
                </Field>
                <Field label="Atingido (R$)">
                  <NumberInput value={form.revenueAchievedBrl} onChange={(v) => set("revenueAchievedBrl", v)} />
                </Field>
              </div>
            </Section>

            <Section title="Meta de investimento" icon={Wallet}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Meta (R$)">
                  <NumberInput value={form.investmentGoalBrl} onChange={(v) => set("investmentGoalBrl", v)} />
                </Field>
                <Field label="Atingido (R$)">
                  <NumberInput value={form.investmentAchievedBrl} onChange={(v) => set("investmentAchievedBrl", v)} />
                </Field>
              </div>
            </Section>

            <Section title="KPI / OKRs" icon={Target}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Meta">
                  <Input value={form.kpiGoal ?? ""} onChange={(e) => set("kpiGoal", e.target.value || null)} />
                </Field>
                <Field label="Parcial">
                  <Input value={form.kpiPartial ?? ""} onChange={(e) => set("kpiPartial", e.target.value || null)} />
                </Field>
                <Field label="Atingido?">
                  <Select
                    value={form.kpiAchieved == null ? "" : form.kpiAchieved ? "true" : "false"}
                    onChange={(e) => set("kpiAchieved", e.target.value === "" ? null : e.target.value === "true")}
                  >
                    <option value="">—</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Checklist de saúde da conta" icon={ListChecks}>
              <div className="grid grid-cols-2 gap-3">
                {CHECKLIST_ITEMS.map((item) => (
                  <Field key={item.key} label={item.label}>
                    <Select
                      value={form.checklist?.[item.key] ?? ""}
                      onChange={(e) => setChecklist(item.key, e.target.value)}
                    >
                      {CHECK_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt || "—"}</option>
                      ))}
                    </Select>
                  </Field>
                ))}
              </div>
            </Section>

            <Section title="Notas" icon={ClipboardList}>
              <div className="grid grid-cols-1 gap-3">
                <Field label="Fato">
                  <Textarea rows={2} value={form.fact ?? ""} onChange={(e) => set("fact", e.target.value || null)} />
                </Field>
                <Field label="Causa">
                  <Textarea rows={2} value={form.cause ?? ""} onChange={(e) => set("cause", e.target.value || null)} />
                </Field>
                <Field label="Ação">
                  <Textarea rows={2} value={form.action ?? ""} onChange={(e) => set("action", e.target.value || null)} />
                </Field>
                <Field label="Observações">
                  <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
                </Field>
              </div>
            </Section>

            <DialogFooter className="items-center justify-between sm:justify-between">
              <div className="flex items-center gap-2">
                {isEdit && (
                  <Button type="button" variant="ghost" onClick={onDelete} disabled={loading} className="text-negative hover:bg-negative-soft">
                    <Trash2 className="size-4" /> Remover registro
                  </Button>
                )}
                {form.clientId && (
                  <Button type="button" variant="ghost" onClick={onDeleteClient} disabled={loading} className="text-negative hover:bg-negative-soft">
                    <Trash2 className="size-4" /> Excluir cliente
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEdit && (
                  <Button type="button" variant="ghost" onClick={cancelEdit} disabled={loading}>
                    <X className="size-4" /> Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {isEdit ? "Salvar alterações" : "Adicionar registro"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Read-only mirror of the edit form — badges, avatars and progress bars instead of label/value
 *  text rows, so the record reads at a glance. Default view for an existing record; "Editar" (in
 *  the header) switches to the plain form above. */
function HealthScoreView({ form, clients }: { form: HealthScoreFormEntry; clients: { id: string; name: string; company: string }[] }) {
  const linkedClient = clients.find((c) => c.id === form.clientId);
  const churnPct = form.churnProbabilityPct;
  const revenuePct = form.revenueGoalBrl ? ((form.revenueAchievedBrl ?? 0) / form.revenueGoalBrl) * 100 : null;
  const investmentPct = form.investmentGoalBrl ? ((form.investmentAchievedBrl ?? 0) / form.investmentGoalBrl) * 100 : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero — badges + key numbers, the "read this in 3 seconds" summary */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface-2/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {form.flag && <Badge variant={flagBadgeVariant(form.flag)}>{form.flag}</Badge>}
          <Badge variant={phaseBadgeVariant(form.phase)}>{form.phase === "ONGOING" ? "Ongoing" : form.phase}</Badge>
          {form.growth && <Badge variant={simNaoBadgeVariant(form.growth)}>Resultado: {form.growth}</Badge>}
          {form.hsUpToDate && <Badge variant={simNaoBadgeVariant(form.hsUpToDate)}>{form.hsUpToDate}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <HeroStat icon={Wallet} label="Fee mensal" value={form.feeBrl != null ? formatBRL(form.feeBrl) : "—"} />
          <HeroStat
            icon={Percent}
            label="Churn"
            value={churnPct != null ? formatPercent(churnPct) : "—"}
            bar={churnPct != null ? { pct: churnPct, tone: churnPct >= 50 ? "bad" : churnPct >= 20 ? "warn" : "good" } : undefined}
          />
          <HeroStat icon={CalendarClock} label="Próximo check-in" value={form.nextCheckin ? formatDate(form.nextCheckin) : "—"} />
        </div>
      </div>

      <Section title="Informações do cliente" icon={Building2}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ViewField label="Cliente">{form.clientName}</ViewField>
          <ViewField label="Produto">{form.product}</ViewField>
          <ViewField label="Data de início">{form.projectStart ? formatDate(form.projectStart) : null}</ViewField>
          <ViewField label="Data de fim">{form.endDate ? formatDate(form.endDate) : null}</ViewField>
          <ViewField label="Contrato">{form.contractLink ? <ViewLink href={form.contractLink} /> : null}</ViewField>
          <ViewField label="Fee mensal">{form.feeBrl != null ? formatBRL(form.feeBrl) : null}</ViewField>
        </div>

        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs font-medium text-muted hover:text-foreground">
            Detalhes adicionais
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ViewField label="Cliente vinculado">{linkedClient ? `${linkedClient.name} — ${linkedClient.company}` : null}</ViewField>
            <ViewField label="Categoria do produto">{form.productCategory}</ViewField>
            <ViewField label="LT (meses)">{form.leadTimeMonths}</ViewField>
            <ViewField label="Replanejamento">{form.replanDate ? formatDate(form.replanDate) : null}</ViewField>
            <ViewField label="Última atualização">{form.lastUpdate ? formatDate(form.lastUpdate) : null}</ViewField>
            <ViewField label="Margem de cont.">{form.contributionMarginPct != null ? formatPercent(form.contributionMarginPct) : null}</ViewField>
            <ViewField label="ROI">{form.roi}</ViewField>
            <ViewField label="Link do planejamento">{form.planningLink ? <ViewLink href={form.planningLink} /> : null}</ViewField>
          </div>
        </details>
      </Section>

      <Section title="Saúde da conta" icon={HeartPulse}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ViewField label="Relacionamento">
            {form.stakeholderRelationship ? <Badge variant={simNaoBadgeVariant(form.stakeholderRelationship === "Saudável" ? "Sim" : "Não")}>{form.stakeholderRelationship}</Badge> : null}
          </ViewField>
          <ViewField label="Check-in">{form.nextCheckin ? formatDate(form.nextCheckin) : null}</ViewField>
          <ViewField label="Responsável interno">{form.accountOwner}</ViewField>
        </div>
      </Section>

      <Section title="Time" icon={Users}>
        <TeamSection clientId={form.clientId} />
      </Section>

      <Section title="Operação" icon={Settings2}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ViewField label="Periodicidade da análise">{form.analysisFrequency}</ViewField>
          <ViewField label="Investimento mídia paga">{form.paidMediaInvestmentBrl != null ? formatBRL(form.paidMediaInvestmentBrl) : null}</ViewField>
          <ViewField label="Drive">{form.driveLink ? <ViewLink href={form.driveLink} /> : null}</ViewField>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="Meta de faturamento" icon={TrendingUp}>
          <GoalBar goal={form.revenueGoalBrl} achieved={form.revenueAchievedBrl} pct={revenuePct} />
        </Section>
        <Section title="Meta de investimento" icon={Wallet}>
          <GoalBar goal={form.investmentGoalBrl} achieved={form.investmentAchievedBrl} pct={investmentPct} />
        </Section>
      </div>

      <Section title="KPI / OKRs" icon={Target}>
        <div className="grid grid-cols-3 gap-3">
          <ViewField label="Meta">{form.kpiGoal}</ViewField>
          <ViewField label="Parcial">{form.kpiPartial}</ViewField>
          <ViewField label="Atingido?">
            {form.kpiAchieved == null ? null : <Badge variant={form.kpiAchieved ? "positive" : "negative"}>{form.kpiAchieved ? "Sim" : "Não"}</Badge>}
          </ViewField>
        </div>
      </Section>

      <Section title="Checklist de saúde da conta" icon={ListChecks}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHECKLIST_ITEMS.map((item) => (
            <ChecklistChip key={item.key} label={item.label} value={form.checklist?.[item.key]} />
          ))}
        </div>
      </Section>

      <Section title="Notas" icon={ClipboardList}>
        <div className="grid grid-cols-1 gap-3">
          <ViewField label="Fato">{form.fact}</ViewField>
          <ViewField label="Causa">{form.cause}</ViewField>
          <ViewField label="Ação">{form.action}</ViewField>
          <ViewField label="Observações">{form.notes}</ViewField>
        </div>
      </Section>

      {form.id && (
        <Section title="Histórico de alterações" icon={History}>
          <HistorySection entryId={form.id} />
        </Section>
      )}
    </div>
  );
}

type HistoryLog = {
  id: string;
  actorName: string;
  action: string;
  detail: string | null;
  createdAt: string;
};

const HISTORY_ACTION_LABEL: Record<string, string> = {
  criou: "Criou o registro",
  editou: "Editou o registro",
  excluiu: "Excluiu o registro",
};

/** Fetches ActivityLog rows for this Health Score entry on demand — kept out of the server-side
 *  page load (a list of dozens of entries doesn't need every row's full history preloaded). */
function HistorySection({ entryId }: { entryId: string }) {
  const [logs, setLogs] = useState<HistoryLog[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/health-score/${entryId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLogs(data.logs ?? []);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (logs === null) {
    return <p className="text-xs text-muted-2">Carregando histórico...</p>;
  }
  if (logs.length === 0) {
    return <p className="text-xs text-muted-2">Nenhuma alteração registrada ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log) => (
        <div key={log.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{log.actorName}</span>
            <span className="text-[11px] text-muted-2">{formatDateTime(log.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {log.detail ? log.detail.split("; ").join(" · ") : HISTORY_ACTION_LABEL[log.action] ?? log.action}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  bar,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  bar?: { pct: number; tone: "good" | "warn" | "bad" };
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
        {bar && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                "h-full rounded-full",
                bar.tone === "good" && "bg-positive",
                bar.tone === "warn" && "bg-warning",
                bar.tone === "bad" && "bg-negative"
              )}
              style={{ width: `${Math.min(100, Math.max(0, bar.pct))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function GoalBar({ goal, achieved, pct }: { goal: number | null; achieved: number | null; pct: number | null }) {
  if (goal == null && achieved == null) {
    return <p className="text-sm text-muted-2">—</p>;
  }
  const clamped = pct != null ? Math.min(100, Math.max(0, pct)) : 0;
  const tone = pct == null ? "warn" : pct >= 100 ? "good" : pct >= 70 ? "warn" : "bad";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">{achieved != null ? formatBRL(achieved) : "—"}</span>
        <span className="text-xs text-muted">de {goal != null ? formatBRL(goal) : "—"}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full", tone === "good" && "bg-positive", tone === "warn" && "bg-warning", tone === "bad" && "bg-negative")}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {pct != null && <span className="text-xs text-muted">{formatPercent(pct, 0)} da meta</span>}
    </div>
  );
}

function ChecklistChip({ label, value }: { label: string; value?: string | null }) {
  const v = value ?? "";
  const Icon = v === "Sim" ? CheckCircle2 : v === "Não" ? XCircle : MinusCircle;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
        v === "Sim" && "bg-positive-soft text-positive",
        v === "Não" && "bg-negative-soft text-negative",
        v !== "Sim" && v !== "Não" && "bg-surface-2 text-muted"
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="text-foreground/90">{label}</span>
    </div>
  );
}

function ViewField({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-foreground whitespace-pre-wrap">
        {empty ? <span className="text-muted-2">—</span> : children}
      </span>
    </div>
  );
}

function ViewLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      Abrir ↗
    </a>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface-2/30 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-2">
        {Icon && <Icon className="size-3.5" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted">
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <Input
      type="number"
      step="any"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

type TeamMemberLink = { id: string; name: string; role: string | null; colorVar?: string };

/** Read-only — sources from the client's real Equipe links (ClientTeamMember.role) instead of
 *  duplicating free-text role fields on the Health Score record itself. Edited from the client's
 *  own Equipe tab, not here. */
function TeamSection({ clientId }: { clientId: string | null }) {
  const [team, setTeam] = useState<TeamMemberLink[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setTeam(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/clients/${clientId}/team`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTeam(data.team ?? []);
      })
      .catch(() => {
        if (!cancelled) setTeam([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="text-sm text-muted">
        Vincule um cliente cadastrado no campo &quot;Cliente vinculado&quot; (em Informações do cliente → Detalhes
        adicionais) para ver o time daqui.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEAM_ROLES.map((role) => {
          const members = (team ?? []).filter((m) => (m.role ?? "").trim().toLowerCase() === role.toLowerCase());
          return (
            <div key={role} className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">{role}</span>
              {loading ? (
                <span className="text-sm text-muted-2">…</span>
              ) : members.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <span key={m.id} className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 text-xs">
                      <span
                        className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: m.colorVar || "var(--primary)" }}
                      >
                        {m.name[0]}
                      </span>
                      {m.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-2">—</span>
              )}
            </div>
          );
        })}
      </div>
      <Link href={`/clientes/${clientId}`} className="mt-3 inline-block text-xs text-primary hover:underline">
        Editar time na aba Equipe do cliente →
      </Link>
    </div>
  );
}
