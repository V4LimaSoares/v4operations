"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

/** Central de Relatórios' Performance card — picking a client jumps straight into the existing
 *  /relatorio generator pre-scoped to it (that page already refuses to render without a client
 *  selected, so this just skips the extra step of doing it via the topbar). */
export function PerformanceReportPicker({ clients }: { clients: { id: string; name: string; company: string }[] }) {
  const router = useRouter();

  return (
    <Select
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) router.push(`/relatorio?clientId=${e.target.value}`);
      }}
      aria-label="Escolher cliente para relatório de Performance"
    >
      <option value="">Selecione um cliente…</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} — {c.company}
        </option>
      ))}
    </Select>
  );
}
