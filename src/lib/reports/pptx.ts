import "server-only";
import path from "path";
import PptxGenJS from "pptxgenjs";
import type { ReportData } from "@/lib/reports/data";
import { buildNarrative } from "@/lib/reports/narrative";

const RED = "E50914";
const BLACK = "000000";
const WHITE = "FFFFFF";
const GRAY = "6B6B6B";
const GRAY_BG = "F5F5F5";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtNum(v: number, d = 0) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: d });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function buildReportPptx(data: ReportData): Promise<Buffer> {
  const narrative = buildNarrative(data);
  const logoPath = path.join(process.cwd(), "public", "brand", "v4-logo.png");

  const pres = new PptxGenJS();
  pres.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  pres.layout = "WIDE";
  pres.author = "V4 Company - Operations";
  pres.title = `Relatório de Performance — ${data.client.company}`;

  // Slide 1 — Capa
  const cover = pres.addSlide();
  cover.background = { color: BLACK };
  cover.addShape("rect", { x: 0, y: 0, w: 3.3, h: 7.5, fill: { color: RED } });
  cover.addImage({ path: logoPath, x: 0.6, y: 0.6, w: 1.1, h: 1.1 });
  cover.addText("RELATÓRIO DE\nPERFORMANCE", {
    x: 3.9, y: 2.6, w: 8.8, h: 1.8, fontSize: 40, bold: true, color: WHITE, fontFace: "Helvetica",
  });
  cover.addText(data.client.company, { x: 3.9, y: 4.3, w: 8.8, h: 0.6, fontSize: 22, color: RED, bold: true });
  cover.addText(`Período: ${fmtDate(data.range.start)} a ${fmtDate(data.range.end)}`, {
    x: 3.9, y: 4.9, w: 8.8, h: 0.4, fontSize: 13, color: "CCCCCC",
  });
  cover.addText("V4 Company - Operations", { x: 3.9, y: 6.8, w: 8, h: 0.4, fontSize: 10, color: "888888" });

  // Slide 2 — KPIs
  const kpiSlide = pres.addSlide();
  kpiSlide.background = { color: WHITE };
  kpiSlide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: RED } });
  kpiSlide.addText("Principais indicadores", { x: 0.6, y: 0.5, w: 10, h: 0.6, fontSize: 24, bold: true, color: BLACK });

  const kpis: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Investimento", value: fmtBRL(data.current.costBrl) },
    { label: "Conversões", value: fmtNum(data.current.conversions, 1) },
    { label: "Cliques", value: fmtNum(data.current.clicks) },
    { label: "Impressões", value: fmtNum(data.current.impressions) },
    { label: "CPC", value: fmtBRL(data.current.cpc) },
    { label: "CTR", value: `${data.current.ctr.toFixed(2)}%` },
    { label: "CPA", value: fmtBRL(data.current.cpa), highlight: true },
    { label: "ROAS", value: `${data.current.roas.toFixed(2)}x` },
  ];
  const cols = 4;
  const cardW = 2.9;
  const cardH = 2.0;
  const gap = 0.25;
  const startX = 0.6;
  const startY = 1.5;
  kpis.forEach((kpi, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    kpiSlide.addShape("rect", { x, y, w: cardW, h: cardH, fill: { color: GRAY_BG }, line: { color: "E5E5E5", width: 0.5 } });
    kpiSlide.addShape("rect", { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.06, fill: { color: i % 2 === 0 ? RED : BLACK } });
    kpiSlide.addText(kpi.label.toUpperCase(), { x: x + 0.25, y: y + 0.45, w: cardW - 0.5, h: 0.3, fontSize: 10, color: GRAY });
    kpiSlide.addText(kpi.value, {
      x: x + 0.25, y: y + 0.75, w: cardW - 0.5, h: 0.7, fontSize: 26, bold: true, color: kpi.highlight ? RED : BLACK,
    });
  });

  // Slide 3 — Campanhas
  const campSlide = pres.addSlide();
  campSlide.background = { color: WHITE };
  campSlide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: RED } });
  campSlide.addText("Resumo por campanha", { x: 0.6, y: 0.5, w: 10, h: 0.6, fontSize: 24, bold: true, color: BLACK });

  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: "Campanha", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
      { text: "Plataforma", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
      { text: "Investimento", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
      { text: "Conversões", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
      { text: "ROAS", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
    ],
    ...data.campaigns.slice(0, 8).map((c) => [
      { text: c.name },
      { text: c.platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads" },
      { text: fmtBRL(c.costBrl) },
      { text: fmtNum(c.conversions, 1) },
      { text: `${c.roas.toFixed(2)}x`, options: { color: RED, bold: true } },
    ]),
  ];
  campSlide.addTable(tableRows, {
    x: 0.6, y: 1.4, w: 12.1, h: 5,
    fontSize: 12, border: { type: "solid", color: "E5E5E5", pt: 0.5 }, autoPage: false,
  });

  // Slide 4 — Plataformas + leitura executiva
  const platSlide = pres.addSlide();
  platSlide.background = { color: WHITE };
  platSlide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: RED } });
  platSlide.addText("Distribuição por plataforma", { x: 0.6, y: 0.5, w: 6, h: 0.6, fontSize: 22, bold: true, color: BLACK });
  platSlide.addTable(
    [
      [
        { text: "Plataforma", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
        { text: "Investimento", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
        { text: "ROAS", options: { bold: true, color: WHITE, fill: { color: BLACK } } },
      ],
      [{ text: "Google Ads" }, { text: fmtBRL(data.platforms.google.costBrl) }, { text: `${data.platforms.google.roas.toFixed(2)}x` }],
      [{ text: "Meta Ads" }, { text: fmtBRL(data.platforms.meta.costBrl) }, { text: `${data.platforms.meta.roas.toFixed(2)}x` }],
    ],
    { x: 0.6, y: 1.4, w: 5.8, h: 1.8, fontSize: 12, border: { type: "solid", color: "E5E5E5", pt: 0.5 } }
  );

  platSlide.addShape("rect", { x: 6.9, y: 1.3, w: 5.8, h: 3.5, fill: { color: BLACK } });
  platSlide.addText("LEITURA EXECUTIVA", { x: 7.2, y: 1.5, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: WHITE });
  platSlide.addText(narrative.leituraExecutiva, { x: 7.2, y: 2.0, w: 5.2, h: 2.6, fontSize: 12, color: WHITE, valign: "top" });

  platSlide.addText(
    narrative.destaques.map((d) => ({ text: d, options: { bullet: { code: "2022", indent: 15 }, color: BLACK, fontSize: 12, breakLine: true } })),
    { x: 0.6, y: 3.5, w: 5.8, h: 3, valign: "top" }
  );

  // Slide 5 — Próximos passos
  const nextSlide = pres.addSlide();
  nextSlide.background = { color: WHITE };
  nextSlide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.15, fill: { color: RED } });
  nextSlide.addText("Próximos passos", { x: 0.6, y: 0.5, w: 10, h: 0.6, fontSize: 24, bold: true, color: BLACK });

  narrative.proximosPassos.forEach((step, i) => {
    const x = 0.6 + i * 3.1;
    nextSlide.addShape("rect", { x, y: 1.6, w: 2.85, h: 3.2, fill: { color: GRAY_BG }, line: { color: "E5E5E5", width: 0.5 } });
    nextSlide.addShape("ellipse", { x: x + 0.25, y: 1.9, w: 0.18, h: 0.18, fill: { color: i % 2 === 0 ? RED : BLACK } });
    nextSlide.addText(step.title, { x: x + 0.25, y: 2.15, w: 2.4, h: 0.6, fontSize: 13, bold: true, color: BLACK, valign: "top" });
    nextSlide.addText(step.description, { x: x + 0.25, y: 2.75, w: 2.4, h: 1.9, fontSize: 10.5, color: GRAY, valign: "top" });
  });

  const buf = await pres.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}
