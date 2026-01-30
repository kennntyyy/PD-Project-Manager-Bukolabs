import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  container: {
    border: '1pt solid #808080',
    padding: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, marginTop: 10, fontWeight: 'bold', textDecoration: 'underline' },
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
  }
});

export const ProjectReportPDF = ({ data, clientName, contractorName, completionRate, reportDates, imageUrls, imageComments }) => {
  const parsedComments = imageComments ? JSON.parse(imageComments) : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <Text style={styles.title}>Report Preview</Text>
          
          <Text style={styles.text}>Client: {clientName}</Text>
          <Text style={styles.text}>PN: {data?.project_name}</Text>
          <Text style={styles.text}>Contractor: {contractorName}</Text>
          <Text style={styles.text}>
            Allocated Budget: ₱{Number(data?.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.text}>Project Start: {reportDates.projectStart}</Text>
          <Text style={styles.text}>Project End: {reportDates.projectEnd}</Text>

          <Text style={styles.sectionTitle}>Report Generation for the Month/s of:</Text>
          <Text style={styles.text}>Report Start Date: {reportDates.reportStart}</Text>
          <Text style={styles.text}>Report End Date: {reportDates.reportEnd}</Text>
          
          <Text style={[styles.text, { marginTop: 10 }]}>Completion Rate: {completionRate}%</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
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