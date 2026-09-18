import { Send, AlertTriangle, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Automation } from "@/lib/data/sla";

const ICONS = { send: Send, warn: AlertTriangle, mic: Mic } as const;
// Written out in full (not built with template strings) so Tailwind's static analysis can see
// and keep these classes — a `bg-${tint}-soft` interpolation would get purged from the CSS build.
const TINT_CLASSES = {
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  positive: "bg-positive-soft text-positive",
} as const;

export function AutomationCard({ automation }: { automation: Automation }) {
  const Icon = ICONS[automation.icon];
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className={`flex size-9 items-center justify-center rounded-lg ${TINT_CLASSES[automation.tint]}`}>
          <Icon className="size-4.5" />
        </div>
        <Badge variant="positive">Ativo</Badge>
      </div>
      <div>
        <h3 className="text-sm font-semibold">{automation.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">{automation.desc}</p>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs">
        <Row label="Frequência" value={automation.schedule} />
        <Row label="Último envio" value={automation.last} />
        <Row label="Próximo" value={automation.next} />
        <Row label="Destino" value={automation.dest} />
      </div>
      <div className="rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-muted">{automation.preview}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-2">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
