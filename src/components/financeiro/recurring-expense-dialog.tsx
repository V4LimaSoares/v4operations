"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EditableRecurringExpense = {
  id: string;
  name: string;
  category: string | null;
  amountBrl: number;
  dayOfMonth: number;
  teamMemberId: string | null;
  active: boolean;
  percentage: number | null;
  referralPercentage: number | null;
  hireDate: string | null;
  terminationDate: string | null;
  isPartner: boolean;
};

const BILL_CATEGORIES = ["Infraestrutura", "Marketing", "Gastos gerais", "Contabilidade", "Outros"];

function toISODate(d: string | null) {
  return d ? d.slice(0, 10) : "";
}

/** Create when `expense` is omitted, edit when provided. `kind` decides the shape of the form:
 *  a BILL only needs categoria/valor/dia do mês; a PROLABORE mirrors the "Colaboradores Ativos"
 *  table — pessoa, função vem do próprio TeamMember, fixo, porcentagem, monetização/indicação,
 *  contratação/desligamento, sócio. */
export function RecurringExpenseDialog({
  kind,
  expense,
  teamMembers,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  kind: "BILL" | "PROLABORE";
  expense?: EditableRecurringExpense;
  teamMembers: { id: string; name: string; active: boolean }[];
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(expense?.name ?? "");
  const [category, setCategory] = useState(expense?.category ?? BILL_CATEGORIES[0]);
  const [teamMemberId, setTeamMemberId] = useState(expense?.teamMemberId ?? "");
  const [amountBrl, setAmountBrl] = useState(expense?.amountBrl != null ? String(expense.amountBrl) : "");
  const [dayOfMonth, setDayOfMonth] = useState(expense?.dayOfMonth != null ? String(expense.dayOfMonth) : "5");
  const [percentage, setPercentage] = useState(expense?.percentage != null ? String(expense.percentage) : "");
  const [referralPercentage, setReferralPercentage] = useState(expense?.referralPercentage != null ? String(expense.referralPercentage) : "");
  const [hireDate, setHireDate] = useState(toISODate(expense?.hireDate ?? null));
  const [terminationDate, setTerminationDate] = useState(toISODate(expense?.terminationDate ?? null));
  const [isPartner, setIsPartner] = useState(expense?.isPartner ?? false);
  const [active, setActive] = useState(expense?.active ?? true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload =
        kind === "BILL"
          ? { kind, name, amountBrl: Number(amountBrl), dayOfMonth: Number(dayOfMonth), category, active }
          : {
              kind,
              name,
              amountBrl: Number(amountBrl),
              dayOfMonth: 1,
              teamMemberId: teamMemberId || null,
              percentage: percentage ? Number(percentage) : null,
              referralPercentage: referralPercentage ? Number(referralPercentage) : null,
              hireDate: hireDate || null,
              terminationDate: terminationDate || null,
              isPartner,
              active,
            };
      const res = await fetch(expense ? `/api/admin/financeiro/recorrentes/${expense.id}` : "/api/admin/financeiro/recorrentes", {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(expense ? "Atualizado." : "Criado.");
      setOpen(false);
      if (!expense) {
        setName("");
        setAmountBrl("");
        setDayOfMonth("5");
        setTeamMemberId("");
        setPercentage("");
        setReferralPercentage("");
        setHireDate("");
        setTerminationDate("");
        setIsPartner(false);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const label = kind === "BILL" ? "conta" : "colaborador(a)";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (expense ? (
            <Button variant="ghost" size="icon">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" /> {kind === "BILL" ? "Nova conta" : "Novo fixo/pró-labore"}
            </Button>
          ))}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{expense ? `Editar ${label}` : `Novo(a) ${label}`}</DialogTitle>
          <DialogDescription>
            {kind === "BILL" ? "Repete todo mês no dia informado — gera o lançamento automaticamente." : "Fixo mensal e comissões do colaborador."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {kind === "BILL" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-name">Nome</Label>
              <Input id="rec-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Aluguel" />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-team-member">Pessoa</Label>
              <Select
                id="rec-team-member"
                required
                value={teamMemberId}
                onChange={(e) => {
                  setTeamMemberId(e.target.value);
                  const m = teamMembers.find((tm) => tm.id === e.target.value);
                  if (m) setName(m.name);
                }}
              >
                <option value="">Selecione...</option>
                {teamMembers.filter((m) => m.active).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {kind === "BILL" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-category">Categoria</Label>
              <Select id="rec-category" value={category ?? ""} onChange={(e) => setCategory(e.target.value)}>
                {BILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-amount">{kind === "BILL" ? "Valor (R$)" : "Fixo/Pró-Labore (R$)"}</Label>
              <Input id="rec-amount" type="number" step="0.01" min="0" required value={amountBrl} onChange={(e) => setAmountBrl(e.target.value)} />
            </div>
            {kind === "BILL" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-day">Dia do mês</Label>
                <Input id="rec-day" type="number" min="1" max="28" required value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-pct">Porcentagem (%)</Label>
                <Input id="rec-pct" type="number" step="0.1" min="0" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} />
              </div>
            )}
          </div>

          {kind === "PROLABORE" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-referral">Monetização/Indicação (%)</Label>
                <Input id="rec-referral" type="number" step="0.1" min="0" max="100" value={referralPercentage} onChange={(e) => setReferralPercentage(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rec-hire">Data de Contratação</Label>
                  <Input id="rec-hire" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rec-term">Data de Desligamento</Label>
                  <Input id="rec-term" type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPartner} onChange={(e) => setIsPartner(e.target.checked)} className="size-4" />
                Sócio(a)
              </label>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4" />
            Ativo
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {expense ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
