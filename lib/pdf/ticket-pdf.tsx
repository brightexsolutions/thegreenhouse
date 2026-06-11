import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const F = "#1b3a2a";   // forest
const G = "#c9a24a";   // gold
const C = "#f7f2e8";   // cream
const CH = "#1a1a18";  // charcoal

const styles = StyleSheet.create({
  page: {
    backgroundColor: C,
    fontFamily: "Helvetica",
    padding: 0,
    fontSize: 10,
  },

  // ── Header (dark stub) ───────────────────────────────
  header: {
    backgroundColor: F,
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 40,
    paddingRight: 40,
  },
  brandLabel: {
    color: G,
    fontSize: 8,
    letterSpacing: 3.5,
    fontFamily: "Helvetica-Bold",
  },
  sessionTitle: {
    color: C,
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    lineHeight: 1.15,
  },
  themeLabel: {
    color: "#c9a24a99",
    fontSize: 11,
    marginTop: 6,
    fontFamily: "Helvetica-Oblique",
  },

  // ── Tear line ────────────────────────────────────────
  tearLine: {
    borderTop: `1.5 dashed ${G}40`,
    marginHorizontal: 20,
    marginVertical: 0,
  },
  tearWrap: {
    paddingVertical: 10,
    backgroundColor: C,
  },

  // ── Body ─────────────────────────────────────────────
  body: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingLeft: 40,
    paddingRight: 40,
  },

  registeredLabel: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    color: `${CH}50`,
    marginBottom: 4,
  },
  attendeeName: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: F,
    lineHeight: 1.1,
    marginBottom: 22,
  },

  // ── Details grid ─────────────────────────────────────
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: `${F}0D`,
    borderRadius: 8,
    padding: "14 18",
    marginBottom: 20,
    gap: 0,
  },
  detailCell: {
    width: "50%",
    marginBottom: 12,
  },
  detailCellFull: {
    width: "100%",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 7.5,
    letterSpacing: 1.8,
    fontFamily: "Helvetica-Bold",
    color: `${CH}55`,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: CH,
  },

  // ── Bottom row: ref + QR ─────────────────────────────
  bottomRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
  },
  refBox: {
    flex: 1,
    backgroundColor: F,
    borderRadius: 8,
    padding: "14 16",
    alignItems: "center",
    justifyContent: "center",
  },
  refLabel: {
    fontSize: 7.5,
    letterSpacing: 2.5,
    fontFamily: "Helvetica-Bold",
    color: `${G}99`,
    marginBottom: 8,
  },
  refValue: {
    fontSize: 22,
    letterSpacing: 6,
    fontFamily: "Helvetica-Bold",
    color: C,
  },

  qrBox: {
    width: 90,
    backgroundColor: C,
    borderRadius: 8,
    border: `1 solid ${F}22`,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 76,
    height: 76,
  },
  qrCaption: {
    fontSize: 7,
    color: `${CH}50`,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // ── Notice + footer ──────────────────────────────────
  notice: {
    fontSize: 9.5,
    color: `${CH}60`,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 1.6,
  },
  footer: {
    marginTop: "auto",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderTop: `1 solid ${F}18`,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: `${CH}40`,
    letterSpacing: 0.5,
  },
});

interface TicketPdfProps {
  firstName:   string;
  lastName:    string;
  eventTitle:  string;
  eventDate:   string;
  eventTime:   string;
  venueName:   string | null;
  dressCode:   string | null;
  themeTitle:      string | null;
  themeScripture?: string | null;
  ticketToken:     string;
  qrDataUrl:   string;
  siteName?:   string;
  siteUrl?:    string;
}

export function TicketPdf(p: TicketPdfProps) {
  const ref          = p.ticketToken.slice(0, 8).toUpperCase();
  const sessionLabel = p.eventTitle.replace(/^The Green House\s*[—–-]\s*/i, "");
  const domain       = (p.siteUrl ?? "greenhousews.co.ke").replace(/^https?:\/\//, "");

  return (
    <Document
      title={`Ticket — ${p.eventTitle}`}
      author={p.siteName ?? "The Green House"}
      creator={p.siteName ?? "The Green House"}
    >
      <Page size="A5" style={styles.page}>

        {/* ── Dark header stub ── */}
        <View style={styles.header}>
          <Text style={styles.brandLabel}>{(p.siteName ?? "The Green House").toUpperCase()}</Text>
          <Text style={styles.sessionTitle}>{sessionLabel}</Text>
          {p.themeTitle && <Text style={styles.themeLabel}>{p.themeTitle}</Text>}
        </View>

        {/* ── Tear-line ── */}
        <View style={styles.tearWrap}>
          <View style={styles.tearLine} />
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Attendee name */}
          <Text style={styles.registeredLabel}>REGISTERED TO</Text>
          <Text style={styles.attendeeName}>{p.firstName} {p.lastName}</Text>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>DATE</Text>
              <Text style={styles.detailValue}>{p.eventDate}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>TIME</Text>
              <Text style={styles.detailValue}>{p.eventTime} pm</Text>
            </View>
            {p.venueName && (
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>VENUE</Text>
                <Text style={styles.detailValue}>{p.venueName}</Text>
              </View>
            )}
            {p.dressCode && (
              <View style={p.venueName ? styles.detailCell : styles.detailCellFull}>
                <Text style={styles.detailLabel}>DRESS CODE</Text>
                <Text style={styles.detailValue}>{p.dressCode}</Text>
              </View>
            )}
          </View>

          {/* Ticket ref + QR side by side */}
          <View style={styles.bottomRow}>
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>TICKET REFERENCE</Text>
              <Text style={styles.refValue}>{ref}</Text>
            </View>
            <View style={styles.qrBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={p.qrDataUrl} style={styles.qrImage} />
              <Text style={styles.qrCaption}>Live program</Text>
            </View>
          </View>

          <Text style={styles.notice}>
            Entry is free · Present this ticket at the door{"\n"}
            Doors open 30 minutes before the session
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{domain}</Text>
          <Text style={styles.footerText}>Free event · All are welcome</Text>
        </View>

      </Page>
    </Document>
  );
}
