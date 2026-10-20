import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CLASSIFICATION_LABEL,
  DIMENSION_KEYS,
  DIMENSION_LABEL,
  type HealthResult,
  type HealthConfig,
  type Classification,
} from "@/lib/health-score-engine";

const VARIANT: Record<Classification, "positive" | "warning" | "negative" | "default"> = {
  SAUDAVEL: "positive",
  ATENCAO: "warning",
  CRITICO: "negative",
  INSUFICIENTE: "default",
  IMPLANTACAO: "default",
};

function barColor(score: number, cfg: HealthConfig) {
  return score >= cfg.healthyMin ? "bg-positive" : score >= cfg.attentionMin ? "bg-warning" : "bg-negative";
}

export function HealthCalcCard({
  result,
  config,
  history,
  manualFlag,
}: {
  result: HealthResult;
  config: HealthConfig;
  history: { day: string; score: number | null }[];
  manualFlag: string | null;
}) {
  const incomplete = result.classification === "INSUFICIENTE" || result.partial;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Saúde calculada</h3>
          <p className="mt-0.5 text-xs text-muted">
            Calculada com dados reais do sistema (versão {config.version === 0 ? "padrão" : config.version} dos parâmetros).
            Convive com a avaliação manual do Account{manualFlag ? `: ${manualFlag}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums leading-none">{result.score ?? "—"}</div>
            <div className="mt-1 text-[11px] text-muted-2">de 100{result.partial ? " · parcial" : ""}</div>
          </div>
          <Badge variant={VARIANT[result.classification]}>{CLASSIFICATION_LABEL[result.classification]}</Badge>
        </div>
      </div>

      {incomplete && (
        <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          Diagnóstico incompleto:{" "}
          {result.missing.length > 0
            ? `sem dados suficientes em ${result.missing.map((k) => DIMENSION_LABEL[k]).join(", ")}.`
            : "dados insuficientes."}{" "}
          {result.classification === "INSUFICIENTE" ? "Nenhuma nota é atribuída enquanto houver menos de 2 dimensões com dados." : "Por isso a nota não pode ser classificada como Saudável."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DIMENSION_KEYS.map((k) => {
          const d = result.dimensions[k];
          return (
            <div key={k} className="rounded-lg bg-surface-2 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {DIMENSION_LABEL[k]} <span className="text-muted-2">({config.weights[k]}%)</span>
                </span>
                <span className="tabular-nums text-muted">{d ? d.score : "sem dado"}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                {d && <div className={cn("h-full rounded-full", barColor(d.score, config))} style={{ width: `${d.score}%` }} />}
              </div>
              {d && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted">
                  {d.indicators.map((i) => (
                    <li key={i.label} title={i.source}>
                      {i.label}: <span className="text-foreground">{i.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {(result.problems.length > 0 || result.actions.length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold">Por que esta nota</div>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted">
              {result.problems.length === 0 ? <li>Nenhum problema identificado nos dados disponíveis.</li> : result.problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold">Próximas ações sugeridas</div>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted">
              {result.actions.length === 0 ? <li>Manter o acompanhamento atual.</li> : result.actions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-1 text-xs font-semibold">Evolução (snapshots diários)</div>
          <div className="flex items-end gap-1" aria-label="Evolução da nota">
            {history.map((h) => (
              <div key={h.day} title={`${h.day}: ${h.score ?? "sem nota"}`} className="flex w-3 flex-col justify-end">
                <div
                  className={cn("w-full rounded-sm", h.score == null ? "bg-border" : barColor(h.score, config))}
                  style={{ height: `${h.score == null ? 8 : Math.max(8, h.score * 0.4)}px` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-2">
        Fontes: métricas das plataformas (contas reais), alertas do monitor de SLA (estado atual, sem histórico), tarefas do eKyte e notas do Account. O fee mensal não entra na nota.
      </p>
    </Card>
  );
}
