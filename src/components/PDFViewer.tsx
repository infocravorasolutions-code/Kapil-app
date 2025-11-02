/**
 * PDF Viewer Component
 * In-app PDF viewing with zoom, navigation, and sharing capabilities
 */

import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { logger, logUserAction, logError } from '../utils/logger';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Simple text-based icon component
const TextIcon = ({ icon, size = 20, color = '#000' }: { icon: string; size?: number; color?: string }) => (
  <Text style={{ fontSize: size, color, textAlign: 'center' }}>{icon}</Text>
);

interface PDFViewerProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
  onShare?: (filePath: string) => void;
  onUploadToDrive?: (filePath: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  filePath,
  fileName,
  onClose,
  onShare,
  onUploadToDrive,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<Pdf>(null);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setLoading(false);
    setError(null);
    logUserAction('PDF loaded successfully', { 
      fileName, 
      totalPages: numberOfPages 
    });
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleError = (error: any) => {
    console.error('PDF Error:', error);
    setError('Failed to load PDF. The file may be corrupted or in an unsupported format.');
    setLoading(false);
    logError('PDF load error', { 
      error: error.message || String(error), 
      fileName 
    });
  };

  const goToPage = (page: number) => {
    if (pdfRef.current && page >= 1 && page <= totalPages) {
      pdfRef.current.setPage(page);
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.5, 3.0);
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.5, 0.5);
    setScale(newScale);
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const handleShare = async () => {
    try {
      logUserAction('PDF share initiated', { fileName });
      
      if (onShare) {
        onShare(filePath);
      } else {
        // Default sharing behavior
        const shareOptions = {
          title: 'Share PDF',
          message: `Sharing ${fileName}`,
          url: `file://${filePath}`,
          type: 'application/pdf',
        };
        
        await Share.open(shareOptions);
        logUserAction('PDF shared successfully', { fileName });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('PDF share failed', { error: errorMessage, fileName });
      Alert.alert('Error', `Failed to share PDF: ${errorMessage}`);
    }
  };

  const handleUploadToDrive = async () => {
    try {
      logUserAction('PDF upload to Drive initiated', { fileName });
      
      if (onUploadToDrive) {
        onUploadToDrive(filePath);
      } else {
        Alert.alert(
          'Google Drive Upload',
          'Google Drive integration is not configured. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Drive upload failed', { error: errorMessage, fileName });
      Alert.alert('Error', `Failed to upload to Drive: ${errorMessage}`);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <TextIcon icon="✕" size={isTablet ? 24 : 20} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading PDF...</Text>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a1a2e" />
            <Text style={styles.loadingText}>Loading PDF document...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <TextIcon icon="✕" size={isTablet ? 24 : 20} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Error</Text>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.errorContainer}>
            <TextIcon icon="⚠️" size={64} color="#e74c3c" />
            <Text style={styles.errorTitle}>Failed to Load PDF</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              Page {currentPage} of {totalPages}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <TextIcon icon="📤" size={isTablet ? 20 : 18} color="#ffffff" />
            </TouchableOpacity>
            {onUploadToDrive && (
              <TouchableOpacity style={styles.headerActionButton} onPress={handleUploadToDrive}>
                <TextIcon icon="☁️" size={isTablet ? 20 : 18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PDF Content */}
        <View style={styles.pdfContainer}>
          <Pdf
            ref={pdfRef}
            source={{ uri: `file://${filePath}`, cache: true }}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            style={styles.pdf}
            scale={scale}
            minScale={0.5}
            maxScale={3.0}
            horizontal={false}
            enablePaging={true}
            enableRTL={false}
            enableAntialiasing={true}
            enableAnnotationRendering={true}
            password=""
            spacing={0}
            fitPolicy={0}
          />
        </View>

        {/* Navigation Controls */}
        <View style={styles.controlsContainer}>
          {/* Page Navigation */}
          <View style={styles.pageControls}>
            <TouchableOpacity 
              style={[styles.controlButton, currentPage <= 1 && styles.controlButtonDisabled]} 
              onPress={goToFirstPage}
              disabled={currentPage <= 1}
            >
              <TextIcon icon="⏮️" size={isTablet ? 20 : 18} color={currentPage <= 1 ? "#95a5a6" : "#1a1a2e"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, currentPage <= 1 && styles.controlButtonDisabled]} 
              onPress={goToPreviousPage}
              disabled={currentPage <= 1}
            >
              <TextIcon icon="◀️" size={isTablet ? 20 : 18} color={currentPage <= 1 ? "#95a5a6" : "#1a1a2e"} />
            </TouchableOpacity>
            
            <View style={styles.pageInfo}>
              <Text style={styles.pageInfoText}>{currentPage} / {totalPages}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.controlButton, currentPage >= totalPages && styles.controlButtonDisabled]} 
              onPress={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              <TextIcon icon="▶️" size={isTablet ? 20 : 18} color={currentPage >= totalPages ? "#95a5a6" : "#1a1a2e"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, currentPage >= totalPages && styles.controlButtonDisabled]} 
              onPress={goToLastPage}
              disabled={currentPage >= totalPages}
            >
              <TextIcon icon="⏭️" size={isTablet ? 20 : 18} color={currentPage >= totalPages ? "#95a5a6" : "#1a1a2e"} />
            </TouchableOpacity>
          </View>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
              <TextIcon icon="🔍-" size={isTablet ? 20 : 18} color="#1a1a2e" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={resetZoom}>
              <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
              <TextIcon icon="🔍+" size={isTablet ? 20 : 18} color="#1a1a2e" />
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#ffffff',
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
  pdfContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  pdf: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  controlsContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: isTablet ? 44 : 40,
    height: isTablet ? 44 : 40,
    borderRadius: isTablet ? 22 : 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  controlButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e1e8ed',
  },
  pageInfo: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 8 : 6,
    backgroundColor: '#f8f9fa',
    borderRadius: isTablet ? 20 : 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  pageInfoText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  zoomText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: isTablet ? 16 : 14,
    color: '#7f8c8d',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: isTablet ? 40 : 32,
  },
  errorTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: isTablet ? 16 : 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: isTablet ? 24 : 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: isTablet ? 24 : 20,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: isTablet ? 24 : 20,
  },
  retryButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default PDFViewer;
