import Link from "next/link";
import { TrendingUp, ShieldCheck, KanbanSquare, ArrowRight } from "lucide-react";
import { requireStaffModule } from "@/lib/session";
import { listClientOptions } from "@/lib/scope";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { PerformanceReportPicker } from "@/components/admin/performance-report-picker";

// A single starting point for the three report generators that already exist (Performance, SLA,
// Operação) — each keeps its own engine and its own page; this just answers "onde eu gero um
// relatório?" without needing to know which module owns the thing you actually want.
export default async function RelatoriosPage() {
  await requireStaffModule("relatorio");
  const clients = await listClientOptions();

  return (
    <div>
      <PageHeader title="Relatórios" description="Ponto de partida para os relatórios de Performance, SLA e Operação" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportCard
          icon={TrendingUp}
          title="Performance"
          description="Investimento, ROAS, campanhas e faturamento de um cliente específico, em PDF ou PPT."
        >
          <PerformanceReportPicker clients={clients} />
        </ReportCard>

        <ReportCard
          icon={ShieldCheck}
          title="SLA"
          description="Tempo de resposta, alertas e envios automáticos — semanal, mensal ou overview diário."
        >
          <Link href="/controle-sla" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Ir para Relatórios de SLA <ArrowRight className="size-3.5" />
          </Link>
        </ReportCard>

        <ReportCard
          icon={KanbanSquare}
          title="Operação"
          description="Produção por cliente, por pessoa e por formato, com período customizável e impressão em PDF."
        >
          <Link href="/ekyte" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Ir para Relatórios de Operação <ArrowRight className="size-3.5" />
          </Link>
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="mb-1 size-5 text-primary" />
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
