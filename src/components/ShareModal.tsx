/**
 * Share Modal Component
 * Enhanced sharing options for PDFs including Google Drive, email, WhatsApp, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
// Google Drive imports removed as requested
import { logger, logUserAction, logError } from '../utils/logger';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Simple text-based icon component
const TextIcon = ({ icon, size = 20, color = '#000' }: { icon: string; size?: number; color?: string }) => (
  <Text style={{ fontSize: size, color, textAlign: 'center' }}>{icon}</Text>
);

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  onUploadComplete?: (fileId: string, webViewLink: string) => void;
}

interface ShareOption {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  action: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  filePath,
  fileName,
  onUploadComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  // Google Drive status removed as requested

  // Google Drive status check removed as requested

  // Google Drive status check function removed as requested

  const handleNativeShare = async () => {
    try {
      setLoadingAction('native');
      logUserAction('Native share initiated', { fileName });

      const shareOptions = {
        title: 'Share PDF',
        message: `Sharing ${fileName}`,
        url: `file://${filePath}`,
        type: 'application/pdf',
      };

      const result = await Share.open(shareOptions);
      
      if (result.action) {
        logUserAction('Native share successful', { fileName });
        Alert.alert('Success', 'PDF shared successfully!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Native share failed', { error: errorMessage, fileName });
      Alert.alert('Error', `Failed to share PDF: ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailShare = async () => {
    try {
      setLoadingAction('email');
      logUserAction('Email share initiated', { fileName });

      const shareOptions = {
        title: 'PDF Document',
        message: `Please find attached the PDF document: ${fileName}`,
        url: `file://${filePath}`,
        type: 'application/pdf',
        email: '',
        subject: `PDF Document: ${fileName}`,
      };

      await Share.open(shareOptions);
      logUserAction('Email share successful', { fileName });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Email share failed', { error: errorMessage, fileName });
      Alert.alert('Error', `Failed to share via email: ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // WhatsApp share function commented out as requested
  /*
  const handleWhatsAppShare = async () => {
    try {
      setLoadingAction('whatsapp');
      logUserAction('WhatsApp share initiated', { fileName });

      console.log('🔍 Starting WhatsApp share:', fileName);
      console.log('📁 File path:', filePath);

      // Check if file exists
      const exists = await RNFS.exists(filePath);
      console.log('📄 File exists:', exists);
      
      if (!exists) {
        Alert.alert('Error', 'PDF file not found. The file may have been moved or deleted.');
        return;
      }

      // Try multiple sharing methods
      try {
        // Method 1: Use File Provider URI with correct path for external storage
        const fileProviderUri = `content://com.kapil_soni_apk.fileprovider/certificates/${fileName}`;
        console.log('🔗 File Provider URI (certificates):', fileProviderUri);
        
        const shareOptions = {
          title: 'PDF Document',
          message: `Check out this PDF document: ${fileName}`,
          url: fileProviderUri,
          type: 'application/pdf',
          social: Share.Social.WHATSAPP as any,
        };

        console.log('📤 WhatsApp share options:', shareOptions);
        await Share.shareSingle(shareOptions);
        logUserAction('WhatsApp share successful', { fileName });
        return;
        
      } catch (fileProviderError) {
        console.log('❌ File Provider WhatsApp share failed:', fileProviderError);
        
        // Method 1.5: Try direct file sharing for external storage
        try {
          if (filePath.includes('/storage/emulated/0/Download/')) {
            console.log('🔗 Trying direct file sharing for external storage');
            
            const shareOptions = {
              title: 'PDF Document',
              message: `Check out this PDF document: ${fileName}`,
              url: `file://${filePath}`,
              type: 'application/pdf',
              social: Share.Social.WHATSAPP as any,
            };
            
            console.log('📤 Direct file WhatsApp share options:', shareOptions);
            await Share.shareSingle(shareOptions);
            logUserAction('WhatsApp share successful (direct)', { fileName });
            return;
          }
        } catch (directShareError) {
          console.log('❌ Direct file WhatsApp share failed:', directShareError);
        }
        
        // Method 2: Copy to Downloads and share
        try {
          // Request storage permission
          if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: 'Storage Permission',
                message: 'This app needs storage permission to share PDF files via WhatsApp.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              throw new Error('Storage permission denied');
            }
          }
          
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
            title: 'PDF Document',
            message: `Check out this PDF document: ${fileName}`,
            url: downloadsUri,
            type: 'application/pdf',
            social: Share.Social.WHATSAPP as any,
          };
          
          console.log('📤 Downloads WhatsApp share options:', shareOptions);
          await Share.shareSingle(shareOptions);
          logUserAction('WhatsApp share from Downloads successful', { fileName });
          return;
          
        } catch (downloadsShareError) {
          console.log('❌ Downloads WhatsApp share failed:', downloadsShareError);
          throw downloadsShareError;
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ WhatsApp share failed:', errorMessage);
      logError('WhatsApp share failed', { error: errorMessage, fileName });
      
      // Show user-friendly error with fallback options
      Alert.alert(
        'WhatsApp Share',
        `Unable to share PDF via WhatsApp directly.\n\nFile: ${fileName}\n\nYou can find it in your Downloads folder and share it manually via WhatsApp.`,
        [
          { text: 'OK' },
          { 
            text: 'Try Again', 
            onPress: () => handleWhatsAppShare()
          }
        ]
      );
    } finally {
      setLoadingAction(null);
    }
  };
  */

  // Google Drive functionality removed as requested

  const handleCopyToDownloads = async () => {
    try {
      setLoadingAction('downloads');
      logUserAction('Copy to Downloads initiated', { fileName });

      const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${fileName}`;
      
      // Ensure Downloads directory exists
      try {
        await RNFS.mkdir(`${RNFS.ExternalStorageDirectoryPath}/Download`);
      } catch (error) {
        // Directory might already exist
      }
      
      await RNFS.copyFile(filePath, downloadsPath);
      
      logUserAction('Copy to Downloads successful', { fileName });
      Alert.alert(
        'File Copied!',
        `PDF has been copied to Downloads folder.\n\nLocation: Downloads/${fileName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Copy to Downloads failed', { error: errorMessage, fileName });
      Alert.alert('Error', `Failed to copy to Downloads: ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBluetoothShare = async () => {
    try {
      setLoadingAction('bluetooth');
      logUserAction('Bluetooth share initiated', { fileName });

      const shareOptions = {
        title: 'PDF Document',
        message: `Sharing ${fileName} via Bluetooth`,
        url: `file://${filePath}`,
        type: 'application/pdf',
        // social: Share.Social.WHATSAPP, // Removed WhatsApp reference
      };

      await Share.open(shareOptions);
      logUserAction('Bluetooth share successful', { fileName });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Bluetooth share failed', { error: errorMessage, fileName });
      Alert.alert('Error', `Failed to share via Bluetooth: ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'native',
      title: 'Share',
      icon: '📤',
      color: '#3498db',
      description: 'Share via system options',
      action: handleNativeShare,
    },
    // WhatsApp share button commented out as requested
    // {
    //   id: 'whatsapp',
    //   title: 'WhatsApp',
    //   icon: '💬',
    //   color: '#25d366',
    //   description: 'Share via WhatsApp',
    //   action: handleWhatsAppShare,
    // },
  ];

  const renderShareOption = (option: ShareOption) => {
    const isLoading = loadingAction === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.shareOption, { borderLeftColor: option.color }]}
        onPress={option.action}
        disabled={isLoading}
      >
        <View style={styles.shareOptionContent}>
          <View style={styles.shareOptionIcon}>
            <TextIcon icon={option.icon} size={isTablet ? 24 : 20} color={option.color} />
          </View>
          <View style={styles.shareOptionText}>
            <Text style={styles.shareOptionTitle}>{option.title}</Text>
            <Text style={styles.shareOptionDescription}>{option.description}</Text>
          </View>
          {isLoading && (
            <ActivityIndicator size="small" color={option.color} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <TextIcon icon="✕" size={isTablet ? 24 : 20} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Share PDF</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {fileName}
              </Text>
            </View>
            <View style={styles.headerButton} />
          </View>

          {/* Share Options */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Choose sharing method:</Text>
            
            <View style={styles.optionsContainer}>
              {shareOptions.map(renderShareOption)}
            </View>

            {/* Google Drive Status removed as requested */}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
    fontSize: isTablet ? 20 : 18,
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
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingTop: isTablet ? 24 : 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: isTablet ? 20 : 16,
  },
  optionsContainer: {
    marginBottom: isTablet ? 32 : 24,
  },
  shareOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: isTablet ? 12 : 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shareOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 16 : 14,
  },
  shareOptionIcon: {
    width: isTablet ? 50 : 44,
    height: isTablet ? 50 : 44,
    borderRadius: isTablet ? 25 : 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  },
  shareOptionText: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  shareOptionDescription: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: isTablet ? 16 : 14,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  statusTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  statusText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: isTablet ? 12 : 10,
    color: '#7f8c8d',
    lineHeight: isTablet ? 18 : 16,
  },
});

export default ShareModal;
