import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(value: number | string, maximumFractionDigits = 0) {
  const n = typeof value === "string" ? Number(value) : value;
  return n.toLocaleString("pt-BR", { maximumFractionDigits });
}

export function formatPercent(value: number, maximumFractionDigits = 2) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits })}%`;
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/** % change from previous to current. Returns null when previous is 0 (undefined/infinite change). */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
