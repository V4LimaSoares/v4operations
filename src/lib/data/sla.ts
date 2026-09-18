import "server-only";
import type { MonitorData, SlaGroup, AttendanceData, ReportSend } from "@/lib/sla-config";

export * from "@/lib/sla-config";

// Controle de SLA isn't backed by this app's own database — it's the WhatsApp SLA automations
// running on the VPS (see /opt/sla-attention-monitor, /opt/sla-weekly-report,
// /opt/sla-attendance-snapshot), which write their live state to JSON files served statically by
// the sla-dashboard nginx container. These fetchers are the only bridge between that automation
// stack and this page — no business logic lives here, just reading what's already generated.
const SLA_BASE_URL = process.env.NEXT_PUBLIC_SLA_DASHBOARD_URL ?? "http://86.48.18.68:8088";

async function fetchSlaJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SLA_BASE_URL}/live/${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // automation host unreachable — pages render their "not connected" state
  }
}

export async function getSlaMonitor() {
  return fetchSlaJson<MonitorData>("monitor.json");
}

export async function getSlaGroups() {
  return fetchSlaJson<SlaGroup[]>("groups.json");
}

export async function getSlaAttendance() {
  return fetchSlaJson<AttendanceData>("attendance.json");
}

export async function getSlaReports() {
  return fetchSlaJson<ReportSend[]>("reports.json");
}

// sla-report-trigger: a small host-native bridge on the VPS (systemd unit, not Dockerized — same
// pattern the report scripts themselves already run under) that can (a) read back the text of the
// last generated report and (b) run the generation scripts on demand. Separate base URL/API key
// from the read-only dashboard above since these two actually mutate/execute things — see the
// portal-trafego-pago session notes for what "solicitar relatório" actually does (posts a real
// approval-request message to the SLA TRIAGEM WhatsApp group for weekly/monthly; daily just
// regenerates a transcript file, no send).
const REPORT_TRIGGER_URL = process.env.SLA_REPORT_TRIGGER_URL ?? "http://86.48.18.68:8090";
const REPORT_TRIGGER_API_KEY = process.env.SLA_REPORT_TRIGGER_API_KEY ?? "";

export type SlaReportType = "weekly" | "monthly" | "daily";

export async function getLatestSlaReportText(type: SlaReportType) {
  try {
    const res = await fetch(`${REPORT_TRIGGER_URL}/report/latest?type=${type}`, {
      headers: { "X-Api-Key": REPORT_TRIGGER_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { text: string | null; meta: Record<string, unknown> };
  } catch {
    return null;
  }
}

export async function triggerSlaReport(type: SlaReportType) {
  try {
    const res = await fetch(`${REPORT_TRIGGER_URL}/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": REPORT_TRIGGER_API_KEY },
      body: JSON.stringify({ type }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, output: typeof data.output === "string" ? data.output : "" };
  } catch (e) {
    return { ok: false, output: e instanceof Error ? e.message : "erro desconhecido" };
  }
}
