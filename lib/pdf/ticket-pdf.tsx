import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "sans",
  src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHQ.woff2",
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f7f2e8",
    fontFamily: "Helvetica",
    padding: 0,
  },
  header: {
    backgroundColor: "#1b3a2a",
    padding: "32 40",
  },
  logoText: {
    color: "#c9a24a",
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  eventTitle: {
    color: "#f7f2e8",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    lineHeight: 1.2,
  },
  body: {
    padding: "28 40",
  },
  greeting: {
    fontSize: 13,
    color: "#1a1a18",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    backgroundColor: "#1b3a2a1a",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#1a1a1860",
    fontFamily: "Helvetica-Bold",
  },
  value: {
    fontSize: 13,
    color: "#1a1a18",
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  divider: {
    borderBottom: "1 solid #e8e3d8",
    marginVertical: 20,
  },
  tokenBox: {
    backgroundColor: "#1b3a2a10",
    borderRadius: 10,
    padding: "14 20",
    alignItems: "center",
  },
  tokenLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1a1a1860",
  },
  token: {
    fontSize: 20,
    letterSpacing: 5,
    color: "#1b3a2a",
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  notice: {
    fontSize: 10,
    color: "#1a1a1870",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 1.5,
  },
  footer: {
    marginTop: "auto",
    padding: "20 40",
    borderTop: "1 solid #e8e3d8",
    fontSize: 9,
    color: "#1a1a1850",
    textAlign: "center",
  },
});

interface TicketPdfProps {
  firstName:   string;
  lastName:    string;
  eventTitle:  string;
  eventDate:   string;
  eventTime:   string;
  venueName:   string | null;
  ticketToken: string;
  siteName?:   string;
  siteUrl?:    string;
}

export function TicketPdf(p: TicketPdfProps) {
  const ref = p.ticketToken.slice(0, 8).toUpperCase();

  return (
    <Document
      title={`Ticket — ${p.eventTitle}`}
      author="The Green House"
      creator="The Green House"
    >
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>{p.siteName ?? "The Green House"}</Text>
          <Text style={styles.eventTitle}>{p.eventTitle}</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.greeting}>
            {p.firstName} {p.lastName} — your spot is confirmed.
          </Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{p.eventDate}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{p.eventTime}pm</Text>
            </View>
          </View>

          {p.venueName && (
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Venue</Text>
                <Text style={styles.value}>{p.venueName}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>Ticket Reference</Text>
            <Text style={styles.token}>{ref}</Text>
          </View>

          <Text style={styles.notice}>
            Entry is free. Present this ticket at the door.{"\n"}
            Doors open 30 minutes before the session.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>{(p.siteUrl ?? "thegreenhouseke.com").replace(/^https?:\/\//, "")}</Text>
        </View>
      </Page>
    </Document>
  );
}
