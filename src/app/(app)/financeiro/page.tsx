import { requireStaffModule } from "@/lib/session";
import { listTeamMembers } from "@/lib/data/team";
import {
  ensureMonthlyInstances,
  listRecurringExpenses,
  listExpenseInstances,
  listTaxPayments,
  listRoyalties,
} from "@/lib/data/financeiro";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FinanceiroMonthFilter } from "@/components/financeiro/month-filter";
import { RecurringExpenseDialog } from "@/components/financeiro/recurring-expense-dialog";
import { RecurringExpenseRow } from "@/components/financeiro/recurring-expense-row";
import { ProlaboreTable } from "@/components/financeiro/prolabore-table";
import { ExpenseInstanceTable } from "@/components/financeiro/expense-instance-table";
import { TaxDialog } from "@/components/financeiro/tax-dialog";
import { TaxList } from "@/components/financeiro/tax-list";
import { RoyaltyDialog } from "@/components/financeiro/royalty-dialog";
import { RoyaltyTable } from "@/components/financeiro/royalty-table";
import { MONTH_NAMES } from "@/lib/financeiro-constants";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  await requireStaffModule("financeiro");
  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  await Promise.all([ensureMonthlyInstances("BILL", month, year), ensureMonthlyInstances("PROLABORE", month, year)]);

  const [bills, billInstances, taxes, royalties, prolabore, prolaboreInstances, teamMembers] = await Promise.all([
    listRecurringExpenses("BILL"),
    listExpenseInstances("BILL", month, year),
    listTaxPayments(month, year),
    listRoyalties(),
    listRecurringExpenses("PROLABORE"),
    listExpenseInstances("PROLABORE", month, year),
    listTeamMembers(),
  ]);

  const teamMemberOptions = teamMembers.map((m) => ({ id: m.id, name: m.name, active: m.active }));

  return (
    <div>
      <PageHeader title="Financeiro" description="Contas a pagar, royalties e fixo/pró-labore do time" />

      <Tabs defaultValue="contas">
        <TabsList>
          <TabsTrigger value="contas">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="royalties">Royalties</TabsTrigger>
          <TabsTrigger value="prolabore">Fixo / Pró-labore</TabsTrigger>
        </TabsList>

        <TabsContent value="contas">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FinanceiroMonthFilter />
            <RecurringExpenseDialog kind="BILL" teamMembers={teamMemberOptions} />
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Contas Recorrentes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {bills.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">Nenhuma conta recorrente cadastrada.</p>
              ) : (
                bills.map((b) => (
                  <RecurringExpenseRow
                    key={b.id}
                    kind="BILL"
                    expense={{
                      ...b,
                      hireDate: b.hireDate ? b.hireDate.toISOString() : null,
                      terminationDate: b.terminationDate ? b.terminationDate.toISOString() : null,
                      teamMember: b.teamMember ? { id: b.teamMember.id, name: b.teamMember.name } : null,
                    }}
                    teamMembers={teamMemberOptions}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Impostos Pagos</CardTitle>
              <TaxDialog month={month} year={year} />
            </CardHeader>
            <CardContent>
              <TaxList taxes={taxes.map((t) => ({ id: t.id, name: t.name, amountBrl: t.amountBrl, paidAt: t.paidAt ? t.paidAt.toISOString() : null }))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Contas de {MONTH_NAMES[month - 1]} de {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ExpenseInstanceTable
                rows={billInstances.map((i) => ({
                  id: i.id,
                  description: i.description,
                  category: i.category,
                  amountBrl: i.amountBrl,
                  dueDate: i.dueDate.toISOString(),
                  status: i.status,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="royalties">
          <div className="mb-4 flex justify-end">
            <RoyaltyDialog />
          </div>
          <Card>
            <CardContent className="p-0">
              <RoyaltyTable royalties={royalties} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prolabore">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FinanceiroMonthFilter />
            <RecurringExpenseDialog kind="PROLABORE" teamMembers={teamMemberOptions} />
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Colaboradores com Fixo/Pró-labore</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProlaboreTable
                rows={prolabore.map((p) => ({
                  ...p,
                  hireDate: p.hireDate ? p.hireDate.toISOString() : null,
                  terminationDate: p.terminationDate ? p.terminationDate.toISOString() : null,
                  teamMember: p.teamMember ? { id: p.teamMember.id, name: p.teamMember.name, role: p.teamMember.role } : null,
                }))}
                teamMembers={teamMemberOptions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Pagamentos de {MONTH_NAMES[month - 1]} de {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ExpenseInstanceTable
                rows={prolaboreInstances.map((i) => ({
                  id: i.id,
                  description: i.description,
                  category: i.category,
                  amountBrl: i.amountBrl,
                  dueDate: i.dueDate.toISOString(),
                  status: i.status,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
