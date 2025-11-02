/**
 * Simple PDF Viewer Component
 * Fallback PDF viewer using system PDF viewer
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { logger, logUserAction, logError } from '../utils/logger';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Simple text-based icon component
const TextIcon = ({ icon, size = 20, color = '#000' }: { icon: string; size?: number; color?: string }) => (
  <Text style={{ fontSize: size, color, textAlign: 'center' }}>{icon}</Text>
);

interface SimplePDFViewerProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
  onShare?: (filePath: string) => void;
  // Google Drive upload removed as requested
}

const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({
  filePath,
  fileName,
  onClose,
  onShare,
  // Google Drive upload prop removed as requested
}) => {
  const [loading, setLoading] = useState(false);

  const handleOpenPDF = async () => {
    try {
      setLoading(true);
      logUserAction('Opening PDF with system viewer', { fileName });

      console.log('🔍 Opening PDF:', fileName);
      console.log('📁 File path:', filePath);

      // Check if file exists
      const exists = await RNFS.exists(filePath);
      console.log('📄 File exists:', exists);
      
      if (!exists) {
        Alert.alert('Error', 'PDF file not found. The file may have been moved or deleted.');
        return;
      }

      // Try File Provider URI first (no permission needed)
      try {
        const fileProviderUri = `content://com.kapil_soni_apk.fileprovider/certificates/${fileName}`;
        console.log('🔗 Trying File Provider URI:', fileProviderUri);
        
        const canOpenProvider = await Linking.canOpenURL(fileProviderUri);
        console.log('✅ Can open File Provider URI:', canOpenProvider);
        
        if (canOpenProvider) {
          await Linking.openURL(fileProviderUri);
          logUserAction('PDF opened with File Provider', { fileName });
          return;
        }
      } catch (providerError) {
        console.log('❌ File Provider URI failed:', providerError);
      }

      // Try alternative File Provider paths
      try {
        const altFileProviderUri = `content://com.kapil_soni_apk.fileprovider/files/${fileName}`;
        console.log('🔗 Trying alternative File Provider URI:', altFileProviderUri);
        
        const canOpenAltProvider = await Linking.canOpenURL(altFileProviderUri);
        console.log('✅ Can open alternative File Provider URI:', canOpenAltProvider);
        
        if (canOpenAltProvider) {
          await Linking.openURL(altFileProviderUri);
          logUserAction('PDF opened with alternative File Provider', { fileName });
          return;
        }
      } catch (altProviderError) {
        console.log('❌ Alternative File Provider URI failed:', altProviderError);
      }

      // Try direct file opening (no permission needed)
      try {
        const directFileUri = `file://${filePath}`;
        console.log('🔗 Trying direct file URI:', directFileUri);
        
        const canOpenDirect = await Linking.canOpenURL(directFileUri);
        console.log('✅ Can open direct file:', canOpenDirect);
        
        if (canOpenDirect) {
          await Linking.openURL(directFileUri);
          logUserAction('PDF opened directly', { fileName });
          return;
        }
      } catch (directError) {
        console.log('❌ Direct file open failed:', directError);
      }

      // If direct opening fails, try copying to Downloads
      try {
        // Request storage permission
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs storage permission to copy PDF files to Downloads folder for better compatibility.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Grant Permission',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'PDF Ready!',
              `Your PDF is ready to view!\n\nFile: ${fileName}\n\nSince we couldn't open it directly, you can find it in your Downloads folder and open it with any PDF viewer app.`,
              [
                { text: 'OK' },
                { 
                //   text: 'Open Downloads', 
                  onPress: () => {
                    // Try to open Downloads folder
                    Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download');
                  }
                },
                { 
                  text: 'Try Again', 
                  onPress: () => handleOpenPDF()
                }
              ]
            );
            return;
          }
        }
        
        // Copy file to Downloads folder
        const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${fileName}`;
        console.log('📁 Downloads path:', downloadsPath);
        
        // Ensure Downloads directory exists
        await RNFS.mkdir(`${RNFS.ExternalStorageDirectoryPath}/Download`);
        
        // Copy file to Downloads
        await RNFS.copyFile(filePath, downloadsPath);
        console.log('✅ File copied to Downloads');
        
        // Try to open the copied file
        const downloadsUri = `file://${downloadsPath}`;
        console.log('🔗 Downloads URI:', downloadsUri);
        
        const canOpen = await Linking.canOpenURL(downloadsUri);
        console.log('✅ Can open Downloads URI:', canOpen);
        
        if (canOpen) {
          await Linking.openURL(downloadsUri);
          logUserAction('PDF opened from Downloads', { fileName });
          return;
        } else {
          // If can't open directly, show user where to find the file
          Alert.alert(
            'PDF Ready!',
            `Your PDF has been saved to Downloads folder.\n\nFile: ${fileName}\nLocation: Downloads/${fileName}\n\nYou can open it with any PDF viewer app from your Downloads folder.`,
            [
              { text: 'OK' },
              { 
                text: 'Open Downloads', 
                onPress: () => {
                  // Try to open Downloads folder
                  Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download');
                }
              }
            ]
          );
        }
        
      } catch (error) {
        console.log('❌ PDF open failed:', error);
        
        // Show user-friendly error message
        Alert.alert(
          'PDF Ready!',
          `Your PDF is ready to view!\n\nFile: ${fileName}\n\nYou can find it in your Downloads folder and open it with any PDF viewer app.`,
          [
            { text: 'OK' },
            { 
              text: 'Open Downloads', 
              onPress: () => {
                // Try to open Downloads folder
                Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download');
              }
            }
          ]
        );
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ PDF open failed:', errorMessage);
      logError('PDF open failed', { error: errorMessage, fileName });
      
      // Show user-friendly error message
      Alert.alert(
        'PDF Ready!',
        `Your PDF is ready to view!\n\nFile: ${fileName}\n\nYou can find it in your Downloads folder and open it with any PDF viewer app.`,
        [
          { text: 'OK' },
          { 
            text: 'Open Downloads', 
            onPress: () => {
              // Try to open Downloads folder
              Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download');
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      logUserAction('PDF share initiated', { fileName });
      
      console.log('🔍 Starting PDF share:', fileName);
      console.log('📁 File path:', filePath);

      // Check if file exists
      const exists = await RNFS.exists(filePath);
      console.log('📄 File exists:', exists);
      
      if (!exists) {
        Alert.alert('Error', 'PDF file not found. The file may have been moved or deleted.');
        return;
      }

      if (onShare) {
        onShare(filePath);
        return;
      }

      // Try multiple sharing methods
      try {
        // Method 1: Direct file sharing
        const fileUri = `file://${filePath}`;
        console.log('🔗 File URI:', fileUri);
        
        const shareOptions = {
          title: 'Share PDF',
          message: `Sharing ${fileName}`,
          url: fileUri,
          type: 'application/pdf',
        };
        
        console.log('📤 Share options:', shareOptions);
        await Share.open(shareOptions);
        logUserAction('PDF shared successfully', { fileName });
        return;
        
      } catch (directShareError) {
        console.log('❌ Direct share failed:', directShareError);
        
        // Method 2: Copy to Downloads and share
        try {
          const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${fileName}`;
          console.log('📁 Downloads path:', downloadsPath);
          
          // Ensure Downloads directory exists
          await RNFS.mkdir(`${RNFS.ExternalStorageDirectoryPath}/Download`);
          
          // Copy file to Downloads
          await RNFS.copyFile(filePath, downloadsPath);
          console.log('✅ File copied to Downloads');
          
          // Share from Downloads
          const downloadsUri = `file://${downloadsPath}`;
          const shareOptions = {
            title: 'Share PDF',
            message: `Sharing ${fileName}`,
            url: downloadsUri,
            type: 'application/pdf',
          };
          
          console.log('📤 Downloads share options:', shareOptions);
          await Share.open(shareOptions);
          logUserAction('PDF shared from Downloads', { fileName });
          return;
          
        } catch (downloadsShareError) {
          console.log('❌ Downloads share failed:', downloadsShareError);
          throw downloadsShareError;
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ PDF share failed:', errorMessage);
      logError('PDF share failed', { error: errorMessage, fileName });
      
      // Show user-friendly error with fallback options
      Alert.alert(
        'Share PDF',
        `Unable to share PDF directly.\n\nFile: ${fileName}\n\nYou can find it in your Downloads folder and share it manually.`,
        [
          { text: 'OK' },
          { 
            text: 'Try Again', 
            onPress: () => handleShare()
          }
        ]
      );
    }
  };

  // Google Drive upload function removed as requested

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <TextIcon icon="✕" size={isTablet ? 24 : 20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {fileName}
            </Text>
            <Text style={styles.headerSubtitle}>
              PDF Document
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <TextIcon icon="📤" size={isTablet ? 20 : 18} color="#ffffff" />
            </TouchableOpacity>
            {/* Google Drive button removed as requested */}
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* PDF Preview Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewIconContainer}>
                <TextIcon icon="📄" size={isTablet ? 32 : 28} color="#1a1a2e" />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>PDF Document</Text>
                <Text style={styles.previewSubtitle}>Ready to view</Text>
              </View>
            </View>
            
            <View style={styles.fileDetails}>
              <View style={styles.fileDetailRow}>
                <TextIcon icon="📁" size={isTablet ? 16 : 14} color="#7f8c8d" />
                <Text style={styles.fileDetailLabel}>File Name:</Text>
                <Text style={styles.fileDetailValue} numberOfLines={1}>{fileName}</Text>
              </View>
              
              <View style={styles.fileDetailRow}>
                <TextIcon icon="📅" size={isTablet ? 16 : 14} color="#7f8c8d" />
                <Text style={styles.fileDetailLabel}>Created:</Text>
                <Text style={styles.fileDetailValue}>{new Date().toLocaleDateString()}</Text>
              </View>
              
              <View style={styles.fileDetailRow}>
                <TextIcon icon="📊" size={isTablet ? 16 : 14} color="#7f8c8d" />
                <Text style={styles.fileDetailLabel}>Type:</Text>
                <Text style={styles.fileDetailValue}>PDF Document</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>Choose an action:</Text>
            
            <TouchableOpacity 
              style={styles.primaryActionButton} 
              onPress={handleOpenPDF}
              disabled={loading}
            >
              <View style={styles.primaryActionContent}>
                <View style={styles.primaryActionIcon}>
                  <TextIcon icon="📖" size={isTablet ? 24 : 20} color="#ffffff" />
                </View>
                <View style={styles.primaryActionText}>
                  <Text style={styles.primaryActionTitle}>
                    {loading ? 'Opening PDF...' : 'Open PDF'}
                  </Text>
                  <Text style={styles.primaryActionSubtitle}>
                    View with your device's PDF viewer
                  </Text>
                </View>
                {loading && (
                  <ActivityIndicator size="small" color="#ffffff" style={styles.loadingIndicator} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.secondaryActionButton} 
                onPress={handleShare}
              >
                <View style={styles.secondaryActionContent}>
                  <TextIcon icon="📤" size={isTablet ? 20 : 18} color="#1a1a2e" />
                  <Text style={styles.secondaryActionText}>Share</Text>
                </View>
              </TouchableOpacity>
              
              {/* Google Drive button removed as requested */}
            </View>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <View style={styles.helpHeader}>
              <TextIcon icon="💡" size={isTablet ? 18 : 16} color="#f39c12" />
              <Text style={styles.helpTitle}>Quick Tips</Text>
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpText}>
                • Tap "Open PDF" to view with your default PDF app
              </Text>
              <Text style={styles.helpText}>
                • Use "Share" to send via email or other apps
              </Text>
              <Text style={styles.helpText}>
                • Google Drive functionality removed as requested
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerButton: {
    width: isTablet ? 44 : 40,
    height: isTablet ? 44 : 40,
    borderRadius: isTablet ? 22 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#b8b8d1',
    textAlign: 'center',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: isTablet ? 40 : 36,
    height: isTablet ? 40 : 36,
    borderRadius: isTablet ? 20 : 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingTop: isTablet ? 20 : 16,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: isTablet ? 20 : 16,
    marginBottom: isTablet ? 24 : 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 16 : 12,
  },
  previewIconContainer: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderRadius: isTablet ? 30 : 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
  },
  fileDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    paddingTop: isTablet ? 16 : 12,
  },
  fileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 12 : 8,
  },
  fileDetailLabel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: isTablet ? 8 : 6,
    marginRight: isTablet ? 12 : 8,
    minWidth: isTablet ? 80 : 70,
  },
  fileDetailValue: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
    flex: 1,
  },
  actionSection: {
    marginBottom: isTablet ? 24 : 20,
  },
  actionSectionTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: isTablet ? 16 : 12,
  },
  primaryActionButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: isTablet ? 16 : 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 20 : 16,
  },
  primaryActionIcon: {
    width: isTablet ? 50 : 44,
    height: isTablet ? 50 : 44,
    borderRadius: isTablet ? 25 : 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingIndicator: {
    marginLeft: isTablet ? 12 : 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: isTablet ? 12 : 8,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTablet ? 16 : 12,
  },
  secondaryActionText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: isTablet ? 8 : 6,
  },
  helpSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 12 : 8,
  },
  helpTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: isTablet ? 8 : 6,
  },
  helpContent: {
    paddingLeft: isTablet ? 24 : 20,
  },
  helpText: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
    lineHeight: isTablet ? 20 : 18,
    marginBottom: isTablet ? 6 : 4,
  },
});

export default SimplePDFViewer;
