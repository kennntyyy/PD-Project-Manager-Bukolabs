import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: '#4A4A3A', // Primary text color
  },
  // Main Header
  header: {
    borderBottom: '2pt solid #4A4A3A',
    marginBottom: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A4A3A',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 9,
    color: '#777',
  },

  // Completion Section
  progressCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 25,
    border: '0.5pt solid #e0e0e0',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4A4A3A',
  },
  progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A4A3A', // Match progress bar to theme
    borderRadius: 4,
  },

  // Two-Column Layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '46%',
  },
  
  // Information Styling
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4A4A3A',
    borderBottom: '1pt solid #eee',
    marginBottom: 8,
    paddingBottom: 2,
  },
  infoBox: {
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  financialValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4A4A3A',
  },

  // Description
  descriptionSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fcfcfc',
    borderRadius: 4,
  },
  descriptionText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#4A4A3A',
  },

  // Images
  imageGrid: {
    marginTop: 20,
  },
  imageWrapper: {
    marginBottom: 20,
    break: 'inside', 
  },
  image: {
    width: '100%',
    height: 220,
    objectFit: 'cover',
    borderRadius: 6,
  },
  imageComment: {
    fontSize: 9,
    marginTop: 5,
    padding: 6,
    color: '#4A4A3A',
    fontStyle: 'italic',
    borderLeft: '2pt solid #4A4A3A', // Accent border match
    backgroundColor: '#f9f9f9',
  },
});

export const ProjectReportPDF = ({
  data,
  clientName,
  contractorName,
  completionRate,
  reportDates,
  imageUrls,
  imageComments,
  reportDescription,
}) => {
  const parsedComments = imageComments
    ? typeof imageComments === 'string'
      ? JSON.parse(imageComments)
      : imageComments
    : [];

  const formatAmount = (value) => {
    return new Number(value || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const contractAmt = data?.contract_amount ?? data?.total_amount ?? 0;
  const totalSpent = data?.total_amount_released ?? 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Project Report</Text>
          <Text style={styles.dateText}>
            Project Duration: start: {reportDates.reportStart} —  end: {reportDates.reportEnd}
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.progressLabel}>Project Status</Text>
            <Text style={styles.progressLabel}>{completionRate}% Complete</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionHeader}>Project Overview</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Project Name:</Text>
              <Text style={styles.value}>{data?.project_name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Client:</Text>
              <Text style={styles.value}>{clientName}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Contractor:</Text>
              <Text style={styles.value}>{contractorName}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionHeader}>Financial Summary (PHP)</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Total Contract:</Text>
              <Text style={styles.financialValue}>{formatAmount(contractAmt)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Total Released:</Text>
              <Text style={styles.financialValue}>{formatAmount(totalSpent)}</Text>
            </View>
            <View style={[styles.infoBox, { marginTop: 4, paddingTop: 4, borderTop: '0.5pt solid #eee' }]}>
              <Text style={[styles.label, { color: '#4A4A3A' }]}>Balance:</Text>
              <Text style={[styles.financialValue, { color: '#4A4A3A' }]}>
                {formatAmount(contractAmt - totalSpent)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionHeader}>Activity Description</Text>
          <Text style={styles.descriptionText}>
            {reportDescription || 'Detailed report description not provided for this period.'}
          </Text>
        </View>

        {imageUrls && imageUrls.length > 0 && (
          <View style={styles.imageGrid}>
            <Text style={styles.sectionHeader}>Site Observations & Progress Photos</Text>
            {imageUrls.map((imageUrl, index) => (
              <View key={index} style={styles.imageWrapper} wrap={false}>
                <Image src={imageUrl} style={styles.image} />
                {parsedComments[index] && (
                  <View style={styles.imageComment}>
                    <Text>{parsedComments[index]}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};