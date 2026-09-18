// Types, static config, and pure helpers for Controle de SLA — split out from
// src/lib/data/sla.ts (which is server-only, for the live-data fetchers) because this module is
// also imported by client components (e.g. the Clientes search filter).

export type PersonKey = "monica" | "camila" | "pedro" | "rafael";

export function isPersonKey(value: string): value is PersonKey {
  return value === "monica" || value === "camila" || value === "pedro" || value === "rafael";
}

export type MonitorItem = {
  group: string;
  since: string;
  elapsed: string;
  severity: "attention" | "urgent";
  /** Responsible account for this group's alerts (default "Mônica") — see group_owners.json on the VPS. */
  owner?: string;
};
export type MonitorData = { attention: MonitorItem[]; urgent: MonitorItem[]; updatedAt?: string };

export type SlaGroup = { name: string; jid: string; owner?: string };

export type PersonAttendance = {
  responseMin: number[];
  volume: number[];
  kpi: { avgResp: number; withinSla: number; atend: number; alerts: number };
  donut: { label: string; value: number; color: string }[];
  alertsLog: { date: string; time: string; group: string; kind: string; wait: string; status: string }[];
};

export type AttendanceData = {
  updatedAt: string;
  team: Record<PersonKey, PersonAttendance>;
  /** group name -> ISO timestamp of last activity */
  clients: Record<string, string>;
};

export type ReportSend = { date: string; type: string; dest: string; status: "ok" | "pending" };

// ---------- Static config (hand-authored, not automation output) ----------

export type TeamMember = {
  key: PersonKey;
  name: string;
  role: string;
  colorVar: string;
  focus: string;
  cpc: { continuar: string[]; parar: string[]; comecar: string[] };
};

export const TEAM: Record<PersonKey, TeamMember> = {
  monica: {
    key: "monica",
    name: "Mônica Betim",
    role: "Account",
    colorVar: "var(--c-monica)",
    focus:
      "Account principal — centraliza a maior parte do contato com os 29 clientes ativos e é marcada automaticamente em todo alerta do monitor de atenção.",
    cpc: {
      continuar: [
        "Maior volume de atendimento da equipe e é quem primeiro responde na maioria dos 29 grupos — o ritmo geral do time depende dela.",
        "É marcada automaticamente em todo alerta (⚠️ e 🚨), então nenhum aviso passa batido — a cobertura funciona.",
      ],
      parar: [
        "Sozinha concentra praticamente todo o volume de contato — qualquer ausência dela deixa 29 clientes sem cobertura ao mesmo tempo.",
        "Parte dos atendimentos ultrapassa os 30min de Ponto de Atenção em horário comercial antes de ter resposta.",
      ],
      comecar: [
        "Repassar um bloco de clientes de menor criticidade para a Camila, tirando o bus factor de uma pessoa só.",
        "Tratar o alerta de Ponto de Atenção (30min) como checklist proativo, respondendo antes de virar Urgente (5h).",
      ],
    },
  },
  camila: {
    key: "camila",
    name: "Camila",
    role: "Account",
    colorVar: "var(--c-camila)",
    focus:
      "Também é account e deveria centralizar contato de clientes — mas ainda não aparece com mensagens computadas nos grupos monitorados neste período.",
    cpc: {
      continuar: [],
      parar: [
        "Zero mensagens computadas nos 29 grupos monitorados no período — hoje ela não centraliza contato nenhum cliente rastreado.",
      ],
      comecar: [
        "Assumir formalmente uma fatia dos 29 clientes, tirando volume da Mônica.",
        "Confirmar se o número dela está mapeado corretamente na classificação de sender — pode ser gap de automação, não de atuação real.",
      ],
    },
  },
  pedro: {
    key: "pedro",
    name: "Pedro Vyctor",
    role: "Gestor de Tráfego",
    colorVar: "var(--c-pedro)",
    focus:
      "Atende pontualmente quando um account aciona, geralmente para dúvidas técnicas de campanha — não centraliza o contato direto com cliente.",
    cpc: {
      continuar: [
        "Atuação pontual funciona bem — entra só quando acionado, sem virar gargalo nos grupos onde não precisa estar.",
      ],
      parar: [
        "Quando é citado num Ponto de Atenção ou Urgente, o tempo até ele responder tende a ser maior que o do account que acionou.",
      ],
      comecar: [
        "Ter um SLA próprio para quando for citado em um alerta — mesmo pontual, precisa responder rápido pra não deixar o account esperando sozinho.",
      ],
    },
  },
  rafael: {
    key: "rafael",
    name: "Rafael Macêdo",
    role: "Analista de CRM",
    colorVar: "var(--c-rafael)",
    focus: "Apoio pontual em fluxos de CRM e automações de relacionamento, acionado sob demanda pelos accounts.",
    cpc: {
      continuar: ["Suporte pontual em fluxos de CRM chega a funcionar quando acionado — não é um gargalo constante."],
      parar: [
        "Já apareceu em alertas de Urgente mesmo sendo apoio pontual — sinal de estar sendo chamado pra coisa fora do escopo dele.",
      ],
      comecar: [
        "Documentar e automatizar os fluxos de CRM mais recorrentes, reduzindo quantas vezes precisa ser acionado manualmente.",
      ],
    },
  },
};

export type Automation = {
  key: string;
  name: string;
  desc: string;
  schedule: string;
  last: string;
  next: string;
  dest: string;
  preview: string;
  icon: "send" | "warn" | "mic";
  tint: "info" | "warning" | "positive";
};

export const AUTOMATIONS: Automation[] = [
  {
    key: "aprovacao",
    icon: "send",
    tint: "info",
    name: "Aprovação & Encaminhamento de SLA",
    desc: 'Gera o relatório semanal/mensal, envia para SLA TRIAGEM em texto, aguarda Anderson responder "OK" e encaminha automaticamente para SLA Accounts — sem mais nenhum passo manual.',
    schedule: "Sex 18:00 (semanal) · último dia do mês 18:00 (mensal)",
    last: "Sex 28/08, 18:00",
    next: "Sex 04/09, 18:00",
    dest: "SLA TRIAGEM → SLA ACCOUNTS",
    preview: 'SLA TRIAGEM: relatório da semana em texto → Anderson responde "OK" → encaminhado em segundos.',
  },
  {
    key: "monitor",
    icon: "warn",
    tint: "warning",
    name: "Monitor de Ponto de Atenção",
    desc: "A cada 5 minutos varre os 29 grupos e mede, só em horário comercial, há quanto tempo o cliente está sem resposta do time. Dispara direto pra SLA Accounts, sem aprovação.",
    schedule: "A cada 5 minutos, contínuo",
    last: "agora há pouco",
    next: "em ≤5 min",
    dest: "SLA ACCOUNTS (direto)",
    preview:
      "⚠️ Ponto de Atenção! ≥30min sem resposta · 🚨 URGENTE! ≥5h — @Mônica é marcada nos dois, e recebe DM privada se ficar +20min sem responder.",
  },
  {
    key: "overview-diario",
    icon: "mic",
    tint: "positive",
    name: "Overview Diário",
    desc: "Resume o que foi discutido nos 29 grupos no dia (não é métrica de tempo), com transcrição local e gratuita de áudios via faster-whisper — sem custo de API externa.",
    schedule: "Dias úteis, 19:00 · janela móvel 19h→19h",
    last: "Qui 02/09, 19:00",
    next: "Hoje, 19:00",
    dest: "SLA ACCOUNTS (direto)",
    preview: "Um parágrafo por grupo ativo, ⚠️ nos temas sensíveis, + lista de grupos silenciosos e mensagens sem resposta.",
  },
];

export type ReportType = { key: "weekly" | "monthly" | "daily"; name: string; desc: string; cadence: string; last: string };

export const REPORT_TYPES: ReportType[] = [
  {
    key: "weekly",
    name: "Relatório Semanal de SLA",
    desc: "Tempo de resposta por cliente e por account, últimos 7 dias corridos, só horário comercial.",
    cadence: "Toda sexta, 18:00",
    last: "28/08/2026",
  },
  {
    key: "monthly",
    name: "Relatório Mensal de SLA",
    desc: "Consolidado do mês inteiro (dia 1 até hoje), mesma metodologia do semanal.",
    cadence: "Último dia do mês, 18:00",
    last: "31/08/2026",
  },
  {
    key: "daily",
    name: "Overview Diário",
    desc: "Resumo qualitativo do conteúdo discutido em cada grupo, com áudios transcritos.",
    cadence: "Dias úteis, 19:00",
    last: "02/09/2026",
  },
];

/** Strips the "V4 Company + " prefix the WhatsApp group names all share. */
export function clientLabel(groupName: string) {
  return groupName.replace(/^V4 Company \+ /, "");
}

/** Builds the last-N-weekday ISO date labels to pair index-wise with attendance.json's flat
 *  responseMin/volume arrays, which carry no dates of their own. */
export function lastBusinessDays(count: number): string[] {
  const days: string[] = [];
  const cursor = new Date();
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.unshift(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}
