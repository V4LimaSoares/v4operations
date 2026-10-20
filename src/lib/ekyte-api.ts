import type { EkyteTask } from "@/lib/data/ekyte";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.EKYTE_API_BASE_URL ?? "https://api.ekyte.com/v1.1";

type RawEkyteTask = {
  id: number;
  currentDueDate: string;
  creationDate: string;
  workspace: string;
  executor: string;
  executorEmail?: string | null;
  ctcTaskType: string;
  phase: string;
  situation: number;
  estimatedTime: number | null;
  actualTime: number | null;
};

function toIsoDate(value: string): string {
  return value.slice(0, 10);
}

/** The Ekyte API token now lives in the database (EkyteIntegration, a singleton row) instead of
 *  the EKYTE_API_KEY env var, so an admin can rotate it from the app itself without a redeploy —
 *  see src/components/admin/ekyte-token-dialog.tsx. First call after this feature ships seeds the
 *  row from the env var, so nothing breaks before anyone has used the new dialog once. */
export async function getEkyteApiKey(): Promise<string> {
  const existing = await prisma.ekyteIntegration.findFirst();
  if (existing) return existing.apiKey;
  const seeded = await prisma.ekyteIntegration.create({
    data: { apiKey: process.env.EKYTE_API_KEY ?? "" },
  });
  return seeded.apiKey;
}

/** Records whether the last attempt to reach Ekyte succeeded — read by the admin-only banner
 *  (src/components/admin/ekyte-integration-banner.tsx) shown across the whole app. */
export async function setEkyteIntegrationStatus(status: "OK" | "ERROR", errorMessage: string | null): Promise<void> {
  const existing = await prisma.ekyteIntegration.findFirst();
  if (existing) {
    await prisma.ekyteIntegration.update({ where: { id: existing.id }, data: { status, errorMessage } });
  } else {
    await prisma.ekyteIntegration.create({ data: { apiKey: process.env.EKYTE_API_KEY ?? "", status, errorMessage } });
  }
}

/** Pulls every task from Ekyte's official REST API (not MCP — this runs server-side, in the
 *  published app, unlike the ad-platform MCP integrations). Paginates until an empty page.
 *  Ekyte doesn't expose a direct time-tracking endpoint alongside this one (checked against their
 *  docs and probed the obvious URL guesses — all 404), so `EKYTE_TIME` stays sourced from
 *  whatever was last saved rather than refreshed here; only tasks go live. */
export async function fetchEkyteTasksFromApi(): Promise<EkyteTask[]> {
  const apiKey = await getEkyteApiKey();
  if (!apiKey) {
    throw new Error("Nenhum token da API do Ekyte configurado.");
  }

  const tasks: EkyteTask[] = [];
  for (let page = 1; page <= 200; page++) {
    const url = `${BASE_URL}/tasks?apiKey=${apiKey}&page=${page}`;
    const res = await fetch(url, { cache: "no-store" });
    // Ekyte's error body is an object ({error: {message, code, ...}}), not a plain string — and
    // it arrives on both ok and non-ok responses, so read it the same way either way instead of
    // discarding the body (and its actual message) the moment res.ok is false.
    const json = (await res.json().catch(() => null)) as
      | { error: { message?: string; code?: string } | null; data: RawEkyteTask[] | null }
      | null;

    if (!res.ok || json?.error) {
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      throw new Error(
        res.status === 401
          ? `Token da API do Ekyte inválido ou revogado (${detail}).`
          : `Ekyte API: ${detail} (página ${page}).`
      );
    }
    if (!json?.data || json.data.length === 0) break;

    for (const t of json.data) {
      tasks.push({
        id: t.id,
        date: toIsoDate(t.currentDueDate),
        creationDate: toIsoDate(t.creationDate),
        client: t.workspace,
        executor: t.executor,
        executorEmail: t.executorEmail ?? undefined,
        type: t.ctcTaskType,
        phase: t.phase,
        situation: (t.situation as EkyteTask["situation"]) ?? 10,
        est: t.estimatedTime ?? 0,
        act: t.actualTime ?? 0,
      });
    }
  }

  return tasks;
}

/** Busca as tarefas no eKyte e grava um novo snapshot (carregando adiante as horas apontadas, que
 *  não têm endpoint). Atualiza o status da integração (OK/ERROR). Usado pelo botão "Atualizar
 *  agora", pela troca de token e pelo snapshot diário do Health Score — assim ninguém precisa
 *  lembrar de clicar depois que o token é corrigido. Lança erro se o eKyte recusar. */
export async function refreshEkyteSnapshot(preFetched?: EkyteTask[]) {
  let tasks: EkyteTask[];
  try {
    tasks = preFetched ?? (await fetchEkyteTasksFromApi());
  } catch (err) {
    await setEkyteIntegrationStatus("ERROR", err instanceof Error ? err.message : "Falha ao buscar dados do Ekyte.");
    throw err;
  }
  await setEkyteIntegrationStatus("OK", null);
  const previous = await prisma.ekyteSnapshot.findFirst({ orderBy: { generatedAt: "desc" } });
  const snapshot = await prisma.ekyteSnapshot.create({
    data: { tasksJson: tasks, timeJson: previous?.timeJson ?? [] },
  });
  const linked = await autoLinkEkyteClients(tasks).catch(() => 0);
  return { id: snapshot.id, generatedAt: snapshot.generatedAt, taskCount: tasks.length, linked };
}

const normName = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Vincula sozinho clientes ainda sem `ekyteClientName` ao workspace do eKyte de mesmo nome
 *  (comparação sem acento/caixa/pontuação, só igualdade — nada de "parecido"). Só preenche campo
 *  vazio e só quando o nome bate com exatamente um cliente e um workspace; o resto continua manual. */
export async function autoLinkEkyteClients(tasks: EkyteTask[]): Promise<number> {
  const workspaces = [...new Set(tasks.map((t) => t.client).filter(Boolean))];
  const unlinked = await prisma.client.findMany({
    where: { ekyteClientName: null },
    select: { id: true, name: true, company: true },
  });
  let count = 0;
  for (const ws of workspaces) {
    const key = normName(ws);
    const matches = unlinked.filter((c) => normName(c.name) === key || normName(c.company) === key);
    const sameKeyWs = workspaces.filter((w) => normName(w) === key);
    if (matches.length === 1 && sameKeyWs.length === 1) {
      await prisma.client.update({ where: { id: matches[0].id }, data: { ekyteClientName: ws } });
      count++;
    }
  }
  return count;
}
