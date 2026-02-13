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
    color: '#4A4A3A',
  },
  header: {
    borderBottom: '2pt solid #4A4A3A',
    marginBottom: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A3A',
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
    color: '#4A4A3A',
    borderBottom: '1pt solid #eee',
    marginBottom: 8,
    paddingBottom: 2,
    marginTop: 10,
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
    color: '#4A4A3A',
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
    fontSize: 8.5,
    paddingRight: 6,
  },
  colIndex: {
    width: '8%',
  },
  colPeriod: {
    width: '28%',
  },
  colProgress: {
    width: '16%',
    textAlign: 'right',
  },
  colPayment: {
    width: '20%',
    textAlign: 'right',
  },
  colGenerated: {
    width: '28%',
    textAlign: 'right',
  },
  muted: {
    color: '#777',
  },
});

export const ProjectReportsListPDF = ({
  project,
  clientName,
  contractorName,
  parentProjectName,
  reportPeriod,
  reports,
  formatCurrency,
  formatDate,
  formatDateTime,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Reports</Text>
        <Text style={styles.subtitle}>
          Report Period: {reportPeriod.start} — {reportPeriod.end}
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Project Details</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Project Name:</Text>
        <Text style={styles.value}>{project?.project_name}</Text>
      </View>
      {parentProjectName && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Project Under:</Text>
          <Text style={styles.value}>{parentProjectName}</Text>
        </View>
      )}
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
        <Text style={styles.value}>{project?.project_status || 'Ongoing'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Budget (PHP):</Text>
        <Text style={styles.value}>{formatCurrency(project?.total_amount)}</Text>
      </View>

      <Text style={styles.sectionHeader}>Reports ({reports.length})</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.colIndex]}>#</Text>
          <Text style={[styles.tableCell, styles.colPeriod]}>Report Period</Text>
          <Text style={[styles.tableCell, styles.colProgress]}>Progress</Text>
          <Text style={[styles.tableCell, styles.colPayment]}>Amount</Text>
          <Text style={[styles.tableCell, styles.colGenerated]}>Generated</Text>
        </View>
        {reports.map((report, index) => (
          <View key={report.report_id || index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colIndex]}>
              {index + 1}
            </Text>
            <Text style={[styles.tableCell, styles.colPeriod]}>
              {formatDate(report.start_date || report.report_date)} -
              {formatDate(report.end_date || report.report_date)}
            </Text>
            <Text style={[styles.tableCell, styles.colProgress]}>
              {report.current_progress || 0}%
            </Text>
            <Text style={[styles.tableCell, styles.colPayment]}>
              {formatCurrency(report.payment_requested)}
            </Text>
            <Text style={[styles.tableCell, styles.colGenerated]}>
              {formatDateTime(report.created_at || report.start_date)}
            </Text>
          </View>
        ))}
      </View>

      {reports.length === 0 && (
        <Text style={[styles.value, styles.muted]}>
          No reports available for this project.
        </Text>
      )}
    </Page>
  </Document>
);
