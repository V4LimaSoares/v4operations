import { Badge } from "@/components/ui/badge";
import { isEkyteOverdue, EKYTE_SITUATION_LABEL, type EkyteTask } from "@/lib/data/ekyte";

export function EkyteStatusBadge({ task }: { task: EkyteTask }) {
  if (isEkyteOverdue(task)) return <Badge variant="negative">Atrasada</Badge>;
  const variant = { 10: "default", 20: "warning", 30: "positive", 40: "outline" } as const;
  return <Badge variant={variant[task.situation]}>{EKYTE_SITUATION_LABEL[task.situation]}</Badge>;
}
