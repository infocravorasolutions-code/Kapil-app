import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InvoiceData } from '../database/db';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    width: 824,
    height: 500,
    border: '3px solid #1a3d5c',
  },
  header: {
    backgroundColor: '#1a3d5c',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  logo: {
    width: 50,
    height: 50,
    backgroundColor: '#d4a574',
    borderRadius: 25,
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  certificateTitle: {
    color: '#d4a574',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reportTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyInfo: {
    color: '#d4a574',
    fontSize: 13,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  leftBar: {
    width: 50,
    backgroundColor: '#1a3d5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labTestedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    transform: 'rotate(90deg)',
  },
  mainContent: {
    flex: 1,
    paddingLeft: 20,
    flexDirection: 'row',
  },
  detailsSection: {
    flex: 1,
    paddingRight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  detailLabel: {
    color: '#1a3d5c',
    fontSize: 18,
    fontWeight: 'bold',
    width: 200,
  },
  detailColon: {
    color: '#1a3d5c',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  detailValue: {
    color: '#333333',
    fontSize: 18,
    flex: 1,
  },
  rightSection: {
    width: 250,
    alignItems: 'center',
  },
  stampBox: {
    width: 200,
    height: 200,
    border: '3px solid #8e44ad',
    backgroundColor: '#8e44ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stampText: {
    color: '#FFFFFF',
    fontSize: 80,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stampSubtext: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signature: {
    marginBottom: 15,
    alignItems: 'center',
  },
  signatureName: {
    color: '#1a3d5c',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  signatureTitle: {
    color: '#666666',
    fontSize: 13,
  },
  footer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    alignItems: 'center',
    borderTop: '2px solid #d4a574',
  },
  address: {
    color: '#1a3d5c',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

interface CertificatePDFProps {
  data: InvoiceData;
}

const CertificatePDF: React.FC<CertificatePDFProps> = ({ data }) => (
  <Document>
    <Page size={[824, 500]} style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>BP</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.certificateTitle}>CERTIFICATE</Text>
          <Text style={styles.reportTitle}>Jewellery Report</Text>
          <Text style={styles.companyInfo}>SONI BHAVARLAL PRHLADJI - MO. 9428419514</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Left Lab Tested Bar */}
        <View style={styles.leftBar}>
          <Text style={styles.labTestedText}>LAB TESTED</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>NAME</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.customer_name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DESCRIPTION</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.jewellery_details}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GROSS WEIGHT</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.gross_weight} gm</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>NET WEIGHT</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.net_weight} gm</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GOLD PURITY</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.gold_purity}</Text>
            </View>
          </View>

          {/* Right Section - Stamp & Signatures */}
          <View style={styles.rightSection}>
            <View style={styles.stampBox}>
              <Text style={styles.stampText}>S</Text>
              <Text style={styles.stampSubtext}>
                SONI BHAVARLAL{'\n'}PRHLADJI{'\n'}JEWELLERY{'\n'}STAMP
              </Text>
            </View>

            <View style={styles.signature}>
              <Text style={styles.signatureName}>Manish Jain</Text>
              <Text style={styles.signatureTitle}>Chief Gemmologist</Text>
            </View>

            <View style={styles.signature}>
              <Text style={styles.signatureName}>Yatish Soni</Text>
              <Text style={styles.signatureTitle}>Gemmologist</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.address}>283/6/1, PREMDARWAJA OPP BABASDEHLA AHM-380002</Text>
      </View>
    </Page>
  </Document>
);

export default CertificatePDF;






