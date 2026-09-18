import { FileText, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { REPORT_TYPES, type ReportSend } from "@/lib/data/sla";
import { SlaReportActions } from "@/components/admin/sla/sla-report-actions";

export function SlaReportsView({ reports }: { reports: ReportSend[] | null }) {
  return (
    <Tabs defaultValue="generate">
      <TabsList>
        <TabsTrigger value="generate">Gerar relatório</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="generate">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {REPORT_TYPES.map((r) => {
            const Icon = r.name.includes("Diário") ? Mic : FileText;
            return (
              <Card key={r.name} className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info">
                    <Icon className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold">{r.name}</h3>
                </div>
                <p className="text-xs leading-relaxed text-muted">{r.desc}</p>
                <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-2">Cadência</span>
                    <span className="font-medium">{r.cadence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-2">Último envio</span>
                    <span className="font-medium">{r.last}</span>
                  </div>
                </div>
                <SlaReportActions type={r.key} />
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="history">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Histórico de envios</h3>
          <span className="text-xs text-muted">{reports?.length ?? 0} registros</span>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!reports || reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted">
                    Nenhum envio registrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted">{r.date}</TableCell>
                    <TableCell className="font-medium">{r.type}</TableCell>
                    <TableCell className="text-muted">{r.dest}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "ok" ? "positive" : "info"}>
                        {r.status === "ok" ? "Enviado" : "Aguardando aprovação"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
