import "server-only";
import { prisma } from "@/lib/prisma";
import type { ExpenseKind } from "@prisma/client";

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month is 1-12; day 0 of next month = last day of this one
}

function dueDateFor(year: number, month: number, dayOfMonth: number): Date {
  const day = Math.min(dayOfMonth, lastDayOfMonth(year, month));
  return new Date(year, month - 1, day);
}

/** Idempotent — for every active RecurringExpense of this kind, creates this month's
 *  ExpenseInstance if it doesn't already exist yet (unique on recurringExpenseId+month+year).
 *  Called on every page load for the selected month, so "Contas do Mês"/"Pagamentos do Mês"
 *  show up without any manual "generate" step. */
export async function ensureMonthlyInstances(kind: ExpenseKind, month: number, year: number): Promise<void> {
  const recurring = await prisma.recurringExpense.findMany({ where: { kind, active: true } });
  await Promise.all(
    recurring.map((r) =>
      prisma.expenseInstance.upsert({
        where: { recurringExpenseId_month_year: { recurringExpenseId: r.id, month, year } },
        create: {
          recurringExpenseId: r.id,
          kind,
          description: r.name,
          category: r.category,
          amountBrl: r.amountBrl,
          dueDate: dueDateFor(year, month, r.dayOfMonth),
          month,
          year,
        },
        update: {},
      })
    )
  );
}

export function listRecurringExpenses(kind: ExpenseKind) {
  return prisma.recurringExpense.findMany({
    where: { kind },
    include: { teamMember: { select: { id: true, name: true, colorVar: true, role: true } } },
    orderBy: { name: "asc" },
  });
}

export function listExpenseInstances(kind: ExpenseKind, month: number, year: number) {
  return prisma.expenseInstance.findMany({
    where: { kind, month, year },
    orderBy: { dueDate: "asc" },
  });
}

export function listTaxPayments(month: number, year: number) {
  return prisma.taxPayment.findMany({ where: { month, year }, orderBy: { createdAt: "desc" } });
}

export function listRoyalties() {
  return prisma.royaltyConfig.findMany({ orderBy: { name: "asc" } });
}

export function isInstanceOverdue(status: "PENDING" | "PAID", dueDate: Date): boolean {
  return status === "PENDING" && dueDate < new Date();
}
