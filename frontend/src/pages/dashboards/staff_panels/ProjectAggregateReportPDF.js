import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: '#404A17',
  },
  header: {
    borderBottom: '2pt solid #404A17',
    marginBottom: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#404A17',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 9,
    color: '#777',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#404A17',
    borderBottom: '1pt solid #eee',
    marginBottom: 8,
    paddingBottom: 2,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    color: '#777',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 9,
    color: '#404A17',
  },
  table: {
    marginTop: 6,
    borderTop: '0.5pt solid #e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e0e0e0',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    fontSize: 9,
    paddingRight: 6,
  },
  colName: {
    width: '40%',
  },
  colStatus: {
    width: '20%',
  },
  colProgress: {
    width: '20%',
    textAlign: 'right',
  },
  colReleased: {
    width: '20%',
    textAlign: 'right',
  },
  muted: {
    color: '#777',
  },
});

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const ProjectAggregateReportPDF = ({
  mainProject,
  clientName,
  contractorName,
  reportRange,
  mainSummary,
  subprojectSummaries,
  generatedAt,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Reports Summary</Text>
        <Text style={styles.subtitle}>
          Period: {reportRange.start} — {reportRange.end}
        </Text>
        <Text style={styles.subtitle}>Generated: {generatedAt}</Text>
      </View>

      <Text style={styles.sectionHeader}>Main Project Overview</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Project Name:</Text>
        <Text style={styles.value}>{mainProject?.project_name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Client:</Text>
        <Text style={styles.value}>{clientName || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Contractor:</Text>
        <Text style={styles.value}>{contractorName || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{mainProject?.project_status || 'Ongoing'}</Text>
      </View>

      <Text style={styles.sectionHeader}>Main Project Reports</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Total Reports:</Text>
        <Text style={styles.value}>{mainSummary?.reportCount || 0}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Latest Progress:</Text>
        <Text style={styles.value}>{mainSummary?.latestProgress || 0}%</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Total Released (PHP):</Text>
        <Text style={styles.value}>{formatNumber(mainSummary?.totalReleased)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Budget (PHP):</Text>
        <Text style={styles.value}>{formatNumber(mainProject?.total_amount)}</Text>
      </View>

      <Text style={styles.sectionHeader}>Subproject Status Summary</Text>
      {subprojectSummaries && subprojectSummaries.length ? (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colName]}>Subproject</Text>
            <Text style={[styles.tableCell, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableCell, styles.colProgress]}>Progress</Text>
            <Text style={[styles.tableCell, styles.colReleased]}>Released</Text>
          </View>
          {subprojectSummaries.map((summary) => (
            <View key={summary.project_id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colName]}>
                {summary.project_name}
              </Text>
              <Text style={[styles.tableCell, styles.colStatus]}>
                {summary.project_status || 'Ongoing'}
              </Text>
              <Text style={[styles.tableCell, styles.colProgress]}>
                {summary.latestProgress || 0}%
              </Text>
              <Text style={[styles.tableCell, styles.colReleased]}>
                {formatNumber(summary.totalReleased)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.value, styles.muted]}>No subprojects found.</Text>
      )}
    </Page>
  </Document>
);
