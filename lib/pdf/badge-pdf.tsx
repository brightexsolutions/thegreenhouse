import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Circle,
  Svg,
} from "@react-pdf/renderer";

// Square social badge — 1080×1080 pt (rendered at screen resolution)
const SIZE = 560;

const styles = StyleSheet.create({
  page: {
    width:           SIZE,
    height:          SIZE,
    backgroundColor: "#1b3a2a",
    padding:         0,
    position:        "relative",
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    justifyContent:  "center",
  },
  // Decorative ring in top-right
  ringWrap: {
    position: "absolute",
    top: -SIZE * 0.22,
    right: -SIZE * 0.22,
  },
  inner: {
    alignItems: "center",
    width:      SIZE * 0.75,
    textAlign:  "center",
  },
  siteName: {
    fontSize:       8,
    letterSpacing:  4,
    textTransform:  "uppercase",
    color:          "rgba(201,162,74,0.7)",
    fontFamily:     "Helvetica",
    marginBottom:   20,
  },
  attending: {
    fontSize:     20,
    fontFamily:   "Helvetica",
    color:        "rgba(247,242,232,0.75)",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize:     32,
    fontFamily:   "Helvetica-Bold",
    color:        "#c9a24a",
    lineHeight:   1.2,
    textAlign:    "center",
    marginBottom: 20,
  },
  divider: {
    width:        48,
    height:       1,
    backgroundColor: "rgba(201,162,74,0.3)",
    marginBottom: 18,
  },
  attendeeName: {
    fontSize:     14,
    fontFamily:   "Helvetica",
    color:        "rgba(247,242,232,0.75)",
    marginBottom: 6,
  },
  dateText: {
    fontSize:   11,
    fontFamily: "Helvetica",
    color:      "rgba(247,242,232,0.4)",
  },
  footer: {
    position:  "absolute",
    bottom:    20,
    fontSize:  8,
    fontFamily: "Helvetica",
    color:     "rgba(247,242,232,0.2)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

interface BadgePdfProps {
  firstName:    string;
  lastName:     string;
  eventTitle:   string;
  eventDate:    string;
  siteName:     string;
  siteUrl:      string;
}

export function BadgePdf(p: BadgePdfProps) {
  // Strip "The Green House — " prefix
  const sessionLabel = p.eventTitle.replace(/^The Green House\s*[—–-]\s*/i, "");
  const cleanUrl = p.siteUrl.replace(/^https?:\/\//, "");

  return (
    <Document
      title={`Badge — ${p.eventTitle}`}
      author={p.siteName}
      creator={p.siteName}
    >
      <Page size={[SIZE, SIZE]} style={styles.page}>
        {/* Decorative ring SVG */}
        <View style={styles.ringWrap}>
          <Svg width={SIZE * 0.65} height={SIZE * 0.65} viewBox={`0 0 ${SIZE * 0.65} ${SIZE * 0.65}`}>
            <Circle
              cx={(SIZE * 0.65) / 2}
              cy={(SIZE * 0.65) / 2}
              r={(SIZE * 0.65) / 2 - 1}
              fill="none"
              stroke="rgba(201,162,74,0.07)"
              strokeWidth={1}
            />
            <Circle
              cx={(SIZE * 0.65) / 2}
              cy={(SIZE * 0.65) / 2}
              r={(SIZE * 0.65) / 2 - 20}
              fill="none"
              stroke="rgba(201,162,74,0.04)"
              strokeWidth={1}
            />
          </Svg>
        </View>

        {/* Content */}
        <View style={styles.inner}>
          <Text style={styles.siteName}>{p.siteName}</Text>
          <Text style={styles.attending}>I&apos;m attending</Text>
          <Text style={styles.eventTitle}>{sessionLabel}</Text>
          <View style={styles.divider} />
          <Text style={styles.attendeeName}>{p.firstName} {p.lastName}</Text>
          <Text style={styles.dateText}>{p.eventDate}</Text>
        </View>

        <Text style={styles.footer}>{cleanUrl}</Text>
      </Page>
    </Document>
  );
}
