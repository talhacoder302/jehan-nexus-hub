import "server-only";
import {
  Document,
  Image,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { fmt, monthLabel } from "@/lib/format";
import type { InsightTotals } from "@/lib/metrics";

export interface ReportData {
  client: {
    name: string;
    brandColor: string | null;
    logo: { data: Buffer; format: "png" | "jpg" } | null;
  };
  month: string;
  totals: InsightTotals;
  change: Partial<Record<keyof InsightTotals, number | null>>;
  daily: { date: string; spend: number }[];
  campaigns: (InsightTotals & { campaignName: string })[];
  postsPublished: number;
  postsApproved: number;
  generatedAt: Date;
}

const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const BRAND = "#4f46e5";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, objectFit: "contain" },
  client: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  sub: { color: MUTED, marginTop: 2 },
  agency: { textAlign: "right", color: MUTED },
  agencyName: { fontFamily: "Helvetica-Bold", color: BRAND, fontSize: 11 },
  band: { height: 4, borderRadius: 2, marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  tile: { width: "23.5%", borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 8 },
  tileLabel: { color: MUTED, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  tileValue: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 3 },
  tileDelta: { fontSize: 8, color: MUTED, marginTop: 2 },
  table: { borderWidth: 1, borderColor: LINE, borderRadius: 6, marginBottom: 14 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  th: { color: MUTED, fontSize: 8, textTransform: "uppercase" },
  colName: { width: "34%" },
  col: { width: "13.2%", textAlign: "right" },
  note: { color: MUTED, fontSize: 8, marginTop: 4 },
  contentRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    color: MUTED,
    fontSize: 8,
  },
});

const KPIS: { key: keyof InsightTotals; label: string; format: (n: number) => string }[] = [
  { key: "spend", label: "Spend", format: fmt.moneyPrecise },
  { key: "impressions", label: "Impressions", format: fmt.int },
  { key: "reach", label: "Reach", format: fmt.int },
  { key: "clicks", label: "Clicks", format: fmt.int },
  { key: "ctr", label: "CTR", format: fmt.pct },
  { key: "cpc", label: "CPC", format: fmt.moneyPrecise },
  { key: "conversions", label: "Conversions", format: fmt.int },
  { key: "roas", label: "ROAS", format: fmt.roas },
];

/** Plain-text deltas: the built-in PDF fonts have no arrow glyphs. */
function delta(value: number | null | undefined) {
  if (value === null || value === undefined) return "No prior month data";
  if (value === 0) return "No change vs prior month";
  return `${value > 0 ? "Up" : "Down"} ${Math.abs(value).toFixed(1)}% vs prior month`;
}

/** Single-series daily spend bars (drawn as vectors so the PDF stays crisp and small). */
function SpendChart({ daily, color }: { daily: ReportData["daily"]; color: string }) {
  const width = 523;
  const height = 110;
  const max = Math.max(...daily.map((d) => d.spend), 1);
  const gap = 2;
  const barW = Math.max(2, (width - gap * (daily.length - 1)) / Math.max(daily.length, 1));
  return (
    <View>
      <Svg width={width} height={height}>
        <Rect x={0} y={height - 0.5} width={width} height={0.5} fill={LINE} />
        {daily.map((d, i) => {
          const h = Math.max(1, (d.spend / max) * (height - 6));
          return (
            <Rect
              key={d.date}
              x={i * (barW + gap)}
              y={height - h}
              width={barW}
              height={h}
              fill={color}
              rx={1.5}
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
        <Text style={s.note}>{daily[0]?.date ?? ""}</Text>
        <Text style={s.note}>Peak day {fmt.money(max)}</Text>
        <Text style={s.note}>{daily.at(-1)?.date ?? ""}</Text>
      </View>
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const color = data.client.brandColor ?? BRAND;
  return (
    <Document title={`${data.client.name}: ${monthLabel(data.month)} report`} author="Jehan Nexus">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {data.client.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img
              <Image src={data.client.logo} style={s.logo} />
            ) : null}
            <View>
              <Text style={s.client}>{data.client.name}</Text>
              <Text style={s.sub}>Monthly performance report · {monthLabel(data.month)}</Text>
            </View>
          </View>
          <View>
            <Text style={[s.agency, s.agencyName]}>Jehan Nexus</Text>
            <Text style={s.agency}>Web · Social · Meta Ads</Text>
          </View>
        </View>
        <View style={[s.band, { backgroundColor: color }]} />

        <Text style={s.sectionTitle}>Meta Ads summary</Text>
        <View style={s.grid}>
          {KPIS.map((k) => (
            <View key={k.key} style={s.tile}>
              <Text style={s.tileLabel}>{k.label}</Text>
              <Text style={s.tileValue}>{k.format(data.totals[k.key])}</Text>
              <Text style={s.tileDelta}>{delta(data.change[k.key])}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Daily spend</Text>
        {data.daily.some((d) => d.spend > 0) ? (
          <SpendChart daily={data.daily} color={color} />
        ) : (
          <Text style={s.note}>No ad spend recorded this month.</Text>
        )}

        <Text style={[s.sectionTitle, { marginTop: 16 }]}>Top campaigns</Text>
        {data.campaigns.length ? (
          <View style={s.table}>
            <View style={s.tr}>
              <Text style={[s.th, s.colName]}>Campaign</Text>
              <Text style={[s.th, s.col]}>Spend</Text>
              <Text style={[s.th, s.col]}>Clicks</Text>
              <Text style={[s.th, s.col]}>CTR</Text>
              <Text style={[s.th, s.col]}>Conv.</Text>
              <Text style={[s.th, s.col]}>ROAS</Text>
            </View>
            {data.campaigns.map((c, i) => (
              <View
                key={`${c.campaignName}-${i}`}
                style={[s.tr, i === data.campaigns.length - 1 ? { borderBottomWidth: 0 } : {}]}
              >
                <Text style={s.colName}>{c.campaignName}</Text>
                <Text style={s.col}>{fmt.moneyPrecise(c.spend)}</Text>
                <Text style={s.col}>{fmt.int(c.clicks)}</Text>
                <Text style={s.col}>{fmt.pct(c.ctr)}</Text>
                <Text style={s.col}>{fmt.int(c.conversions)}</Text>
                <Text style={s.col}>{fmt.roas(c.roas)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.note}>No campaigns ran this month.</Text>
        )}

        <Text style={s.sectionTitle}>Content</Text>
        <View style={s.contentRow}>
          <View style={s.tile}>
            <Text style={s.tileLabel}>Posts published</Text>
            <Text style={s.tileValue}>{data.postsPublished}</Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileLabel}>Posts approved</Text>
            <Text style={s.tileValue}>{data.postsApproved}</Text>
          </View>
        </View>
        <Text style={s.note}>
          Ratios (CTR, CPC, ROAS) are calculated from monthly totals. Reach is summed across days
          and campaigns, so it may overstate unique people reached.
        </Text>

        <View style={s.footer} fixed>
          <Text>
            Generated {data.generatedAt.toISOString().slice(0, 10)} · Jehan Nexus client portal
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  return renderToBuffer(<ReportDocument data={data} />);
}
