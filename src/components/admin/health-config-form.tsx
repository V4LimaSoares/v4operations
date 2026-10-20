"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DIMENSION_KEYS, DIMENSION_LABEL, type HealthConfig } from "@/lib/health-score-engine";

/** Parâmetros do Health Score calculado (admin). Salvar cria uma NOVA versão; os snapshots já
 *  gravados continuam apontando para a versão com que foram calculados. */
export function HealthConfigForm({ config }: { config: HealthConfig }) {
  const router = useRouter();
  const [weights, setWeights] = useState({ ...config.weights });
  const [healthyMin, setHealthyMin] = useState(config.healthyMin);
  const [attentionMin, setAttentionMin] = useState(config.attentionMin);
  const [newClientDays, setNewClientDays] = useState(config.newClientDays);
  const [loading, setLoading] = useState(false);
  const sum = DIMENSION_KEYS.reduce((a, k) => a + (Number(weights[k]) || 0), 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health-score/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights, healthyMin, attentionMin, newClientDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(`Parâmetros salvos (versão ${data.version}).`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Versão atual: {config.version === 0 ? "padrão (nunca alterada)" : config.version}. Salvar cria uma nova versão — o histórico anterior não é reescrito.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DIMENSION_KEYS.map((k) => (
          <div key={k} className="flex flex-col gap-1.5">
            <Label htmlFor={`w-${k}`}>{DIMENSION_LABEL[k]} (%)</Label>
            <Input
              id={`w-${k}`}
              type="number"
              min={0}
              max={100}
              value={weights[k]}
              onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      <p className={sum === 100 ? "text-xs text-muted" : "text-xs text-negative"}>Soma dos pesos: {sum} (precisa ser 100)</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hs-min">Saudável a partir de</Label>
          <Input id="hs-min" type="number" min={1} max={100} value={healthyMin} onChange={(e) => setHealthyMin(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="at-min">Atenção a partir de</Label>
          <Input id="at-min" type="number" min={0} max={99} value={attentionMin} onChange={(e) => setAttentionMin(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-days">Cliente novo (dias)</Label>
          <Input id="new-days" type="number" min={0} max={365} value={newClientDays} onChange={(e) => setNewClientDays(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={loading || sum !== 100}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Salvar nova versão
        </Button>
      </div>
    </form>
  );
}
