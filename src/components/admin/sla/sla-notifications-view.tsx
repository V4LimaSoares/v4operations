import { AlertTriangle, Activity, Send, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { MonitorItem } from "@/lib/data/sla";

const META = {
  attention: { title: "Ponto de Atenção", threshold: "≥ 30min sem resposta, horário comercial" },
  urgent: { title: "Urgências", threshold: "≥ 5h sem resposta, horário comercial" },
} as const;

export function SlaNotificationsView({
  attention,
  urgent,
  connected,
}: {
  attention: MonitorItem[] | null;
  urgent: MonitorItem[] | null;
  connected: boolean;
}) {
  const attentionList = attention ?? [];
  const urgentList = urgent ?? [];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Aguardando agora"
          value={attentionList.length + urgentList.length}
          icon={AlertTriangle}
          formatter={(v) => String(v)}
        />
        <StatCard
          label="Conexão ao vivo"
          value={0}
          icon={Activity}
          formatter={() => (connected ? "Conectado" : "Aguardando")}
        />
        <StatCard label="Destino do alerta" value={0} icon={Send} formatter={() => "SLA Accounts"} />
      </div>

      <Tabs defaultValue="attention" className="mt-6">
        <TabsList>
          <TabsTrigger value="attention">
            Ponto de Atenção
            {attentionList.length > 0 && (
              <Badge variant="warning" className="ml-1.5">
                {attentionList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="urgent">
            Urgências
            {urgentList.length > 0 && (
              <Badge variant="negative" className="ml-1.5">
                {urgentList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attention">
          <NotificationsTable severity="attention" items={attentionList} connected={connected} />
        </TabsContent>
        <TabsContent value="urgent">
          <NotificationsTable severity="urgent" items={urgentList} connected={connected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationsTable({
  severity,
  items,
  connected,
}: {
  severity: "attention" | "urgent";
  items: MonitorItem[];
  connected: boolean;
}) {
  const meta = META[severity];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Todos os grupos em {meta.title.toLowerCase()} agora ({items.length})
        </h3>
        <span className="text-xs text-muted">{meta.threshold}</span>
      </div>

      <Card>
        {!connected ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
            <Activity className="size-6 text-muted-2" />
            <p className="font-medium text-foreground">Sincronização ao vivo ainda não conectada</p>
            <p className="max-w-md text-xs">
              O Monitor de Atenção já roda no VPS a cada 5 minutos e dispara os alertas no WhatsApp normalmente.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
            <CheckCircle2 className="size-6 text-positive" />
            <p className="font-medium text-foreground">Nenhum grupo em {meta.title.toLowerCase()} agora</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Esperando desde</TableHead>
                <TableHead>Tempo decorrido</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.group}</TableCell>
                  <TableCell className="text-muted">{item.since}</TableCell>
                  <TableCell className="text-muted">{item.elapsed}</TableCell>
                  <TableCell>
                    <Badge variant={severity === "urgent" ? "negative" : "warning"}>
                      <AlertTriangle className="size-3" /> aguardando
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
