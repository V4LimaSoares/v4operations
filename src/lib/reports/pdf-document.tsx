import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import type { ReportData } from "@/lib/reports/data";
import { buildNarrative } from "@/lib/reports/narrative";

const RED = "#E50914";
const BLACK = "#000000";
const GRAY_TEXT = "#6B6B6B";
const GRAY_BG = "#F5F5F5";
const BORDER = "#E5E5E5";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: BLACK, paddingBottom: 36 },
  topBarRow: { flexDirection: "row", height: 8 },
  topBarRed: { width: "25%", backgroundColor: RED },
  topBarBlack: { flex: 1, backgroundColor: BLACK },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 24, paddingBottom: 12 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, width: 140 },
  logoImg: { width: 30, height: 30 },
  logoText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: BLACK },
  logoTextSub: { fontSize: 8, color: BLACK },
  titleBlock: { flex: 1, paddingHorizontal: 16 },
  reportTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: RED, letterSpacing: 0.5 },
  reportSubtitle: { fontSize: 9, color: GRAY_TEXT, marginTop: 2 },
  metaBlock: { width: 180, alignItems: "flex-end" },
  metaText: { fontSize: 8, color: GRAY_TEXT, textAlign: "right", marginBottom: 2 },
  h1Block: { paddingHorizontal: 24, marginBottom: 14 },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: BLACK, marginBottom: 6 },
  h1Desc: { fontSize: 9, color: GRAY_TEXT, lineHeight: 1.5 },
  kpiRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, backgroundColor: GRAY_BG, padding: 10 },
  kpiBar: { height: 3, marginBottom: 8, width: 28 },
  kpiLabel: { fontSize: 7, color: GRAY_TEXT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: BLACK },
  kpiValueRed: { fontSize: 15, fontFamily: "Helvetica-Bold", color: RED },
  kpiCaption: { fontSize: 7, color: GRAY_TEXT, marginTop: 3 },
  sectionRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 10 },
  lightBlock: { flex: 1, backgroundColor: "#ffffff", borderWidth: 1, borderColor: BORDER, padding: 12 },
  darkBlock: { flex: 1, backgroundColor: BLACK, padding: 12 },
  blockTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BLACK, marginBottom: 8 },
  blockTitleWhite: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 8 },
  blockTextWhite: { fontSize: 9, color: "#ffffff", lineHeight: 1.5 },
  tableHeadRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  th: { fontSize: 6.5, color: GRAY_TEXT, textTransform: "uppercase", letterSpacing: 0.3 },
  td: { fontSize: 8, color: BLACK },
  bulletRow: { flexDirection: "row", marginBottom: 6, gap: 6 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: RED, marginTop: 3 },
  bulletText: { fontSize: 8.5, color: BLACK, flex: 1, lineHeight: 1.4 },
  nextStepsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10 },
  nextStepCard: { flex: 1, borderWidth: 1, borderColor: BORDER, padding: 10 },
  nextStepHead: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  nextStepDot: { width: 6, height: 6, borderRadius: 3 },
  nextStepTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: BLACK },
  nextStepDesc: { fontSize: 7.5, color: GRAY_TEXT, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 16, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 6 },
  footerText: { fontSize: 7, color: GRAY_TEXT },
});

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtNum(v: number, d = 0) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: d });
}
function fmtPct(v: number) {
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function PerformanceReportDocument({ data }: { data: ReportData }) {
  const narrative = buildNarrative(data);
  const logoPath = path.join(process.cwd(), "public", "brand", "v4-logo.png");
  const platformLabel =
    data.accounts.length === 0
      ? "—"
      : Array.from(new Set(data.accounts.map((a) => (a.platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads")))).join(" + ");

  return (
    <Document title={`Relatório de Performance — ${data.client.company}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarRed} />
          <View style={styles.topBarBlack} />
        </View>

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image src={logoPath} style={styles.logoImg} />
            <View>
              <Text style={styles.logoText}>V4</Text>
              <Text style={styles.logoTextSub}>Lima Soares&Co</Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>RELATÓRIO DE PERFORMANCE</Text>
            <Text style={styles.reportSubtitle}>{data.client.company}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>
              Período: {fmtDate(data.range.start)} a {fmtDate(data.range.end)}
            </Text>
            <Text style={styles.metaText}>Plataformas: {platformLabel}</Text>
            <Text style={styles.metaText}>Acompanhamento de tráfego pago</Text>
          </View>
        </View>

        <View style={styles.h1Block}>
          <Text style={styles.h1}>Resumo de performance: {data.client.name}</Text>
          <Text style={styles.h1Desc}>
            Acompanhamento do investimento em mídia paga e dos resultados de campanhas no período selecionado, com
            leitura executiva e recomendações de próximos passos.
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <KpiCard label="Investimento" value={fmtBRL(data.current.costBrl)} caption="Custo no período" bar={RED} />
          <KpiCard label="Conversões" value={fmtNum(data.current.conversions, 1)} caption="Total de conversões" bar={BLACK} />
          <KpiCard label="Cliques" value={fmtNum(data.current.clicks)} caption="Tráfego pago" bar={RED} />
          <KpiCard label="Impressões" value={fmtNum(data.current.impressions)} caption="Exibições dos anúncios" bar={BLACK} />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard label="CPC" value={fmtBRL(data.current.cpc)} caption="Custo por clique" bar={RED} small />
          <KpiCard label="CTR" value={fmtPct(data.current.ctr)} caption="Taxa de cliques" bar={BLACK} small />
          <KpiCard label="CPA" value={fmtBRL(data.current.cpa)} caption="Custo por conversão" bar={RED} small highlight />
          <KpiCard label="ROAS" value={`${data.current.roas.toFixed(2)}x`} caption="Retorno sobre investimento" bar={BLACK} small />
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.lightBlock}>
            <Text style={styles.blockTitle}>Resumo por campanha</Text>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.th, { width: "40%" }]}>Campanha</Text>
              <Text style={[styles.th, { width: "20%" }]}>Custo</Text>
              <Text style={[styles.th, { width: "20%" }]}>Conv.</Text>
              <Text style={[styles.th, { width: "20%" }]}>ROAS</Text>
            </View>
            {data.campaigns.slice(0, 5).map((c) => (
              <View key={c.id} style={styles.tableRow}>
                <Text style={[styles.td, { width: "40%" }]}>{c.name}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{fmtBRL(c.costBrl)}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{fmtNum(c.conversions, 1)}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{c.roas.toFixed(2)}x</Text>
              </View>
            ))}
            {data.campaigns.length === 0 && <Text style={styles.td}>Sem campanhas no período.</Text>}
          </View>
          <View style={styles.darkBlock}>
            <Text style={styles.blockTitleWhite}>Leitura executiva</Text>
            <Text style={styles.blockTextWhite}>{narrative.leituraExecutiva}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.lightBlock}>
            <Text style={styles.blockTitle}>Distribuição por plataforma</Text>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.th, { width: "34%" }]}>Plataforma</Text>
              <Text style={[styles.th, { width: "22%" }]}>Investimento</Text>
              <Text style={[styles.th, { width: "22%" }]}>Conv.</Text>
              <Text style={[styles.th, { width: "22%" }]}>ROAS</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.td, { width: "34%" }]}>Google Ads</Text>
              <Text style={[styles.td, { width: "22%" }]}>{fmtBRL(data.platforms.google.costBrl)}</Text>
              <Text style={[styles.td, { width: "22%" }]}>{fmtNum(data.platforms.google.conversions, 1)}</Text>
              <Text style={[styles.td, { width: "22%" }]}>{data.platforms.google.roas.toFixed(2)}x</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.td, { width: "34%" }]}>Meta Ads</Text>
              <Text style={[styles.td, { width: "22%" }]}>{fmtBRL(data.platforms.meta.costBrl)}</Text>
              <Text style={[styles.td, { width: "22%" }]}>{fmtNum(data.platforms.meta.conversions, 1)}</Text>
              <Text style={[styles.td, { width: "22%" }]}>{data.platforms.meta.roas.toFixed(2)}x</Text>
            </View>
          </View>
          <View style={styles.lightBlock}>
            <Text style={styles.blockTitle}>Destaques do período</Text>
            {narrative.destaques.map((d, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
          <Text style={[styles.blockTitle, { marginBottom: 8 }]}>Próximos passos</Text>
        </View>
        <View style={styles.nextStepsRow}>
          {narrative.proximosPassos.map((step, i) => (
            <View key={i} style={styles.nextStepCard}>
              <View style={styles.nextStepHead}>
                <View style={[styles.nextStepDot, { backgroundColor: i % 2 === 0 ? RED : BLACK }]} />
                <Text style={styles.nextStepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.nextStepDesc}>{step.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Fonte: V4 Company - Operations {data.dataSource === "DEMO" ? "(dados demonstrativos)" : ""}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function KpiCard({
  label,
  value,
  caption,
  bar,
  small,
  highlight,
}: {
  label: string;
  value: string;
  caption: string;
  bar: string;
  small?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiBar, { backgroundColor: bar }]} />
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={highlight ? styles.kpiValueRed : styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiCaption}>{caption}</Text>
    </View>
  );
}
