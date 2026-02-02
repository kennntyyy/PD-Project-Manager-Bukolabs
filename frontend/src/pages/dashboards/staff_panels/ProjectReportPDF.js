import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  container: {
    border: '1pt solid #808080',
    padding: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 12,
    marginTop: 10,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  text: { fontSize: 11, marginBottom: 5 },
  progressBarContainer: {
    height: 12,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007ad9', // Standard PrimeReact Blue
    borderRadius: 5,
  },
  imageContainer: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  image: {
    width: '100%',
    height: 250,
    objectFit: 'cover',
    borderRadius: 4,
    marginBottom: 5,
  },
  imageComment: {
    fontSize: 10,
    padding: 5,
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 2,
    borderLeftColor: '#007ad9',
    marginBottom: 10,
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
    const num = Number(value || 0);
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${withCommas}.${decPart}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <Text style={styles.title}>Report Preview</Text>

          <Text style={styles.text}>Client: {clientName}</Text>
          <Text style={styles.text}>PN: {data?.project_name}</Text>
          <Text style={styles.text}>Contractor: {contractorName}</Text>
          <Text style={styles.text}>
            {'Contract Amount: PHP ' +
              formatAmount(data?.contract_amount ?? data?.total_amount ?? 0)}
          </Text>
          <Text style={styles.text}>
            {'Total Spent: PHP ' +
              formatAmount(data?.total_amount_released ?? 0)}
          </Text>
          <Text style={styles.text}>
            {'Remaining Balance: PHP ' +
              formatAmount(
                (data?.contract_amount ?? data?.total_amount ?? 0) -
                  (data?.total_amount_released ?? 0),
              )}
          </Text>
          <Text style={styles.text}>
            Report Start: {reportDates.reportStart}
          </Text>
          <Text style={styles.text}>Report End: {reportDates.reportEnd}</Text>

          <Text style={styles.sectionTitle}>Report Period</Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.text}>
            {reportDescription || 'No description'}
          </Text>

          <Text style={[styles.text, { marginTop: 10 }]}>
            Completion Rate: {completionRate}%
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBarFill, { width: `${completionRate}%` }]}
            />
          </View>

          {imageUrls && imageUrls.length > 0 && (
            <View style={styles.imageContainer}>
              <Text style={styles.sectionTitle}>Report Images</Text>
              {imageUrls.map((imageUrl, index) => (
                <View key={index}>
                  <Image src={imageUrl} style={styles.image} />
                  {parsedComments[index] && (
                    <View style={styles.imageComment}>
                      <Text style={{ fontSize: 10, color: '#333' }}>
                        {parsedComments[index]}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};
