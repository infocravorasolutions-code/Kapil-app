/**
 * Documents Management Screen
 * View, manage, and download generated PDFs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  RefreshControl,
  Share,
  Linking,
  Platform,
  TextInput,
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
// import { Icon } from 'react-native-paper';
import RNFS from 'react-native-fs';
import { listInvoiceFiles } from '../utils/pdfGenerator';
import { logger, logUserAction, logError } from '../utils/logger';
import PDFViewer from '../components/PDFViewer';
import SimplePDFViewer from '../components/SimplePDFViewer';
import ShareModal from '../components/ShareModal';
import { googleDriveService } from '../utils/googleDriveService';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Simple text-based icon component
const TextIcon = ({ icon, size = 20, color = '#000' }: { icon: string; size?: number; color?: string }) => (
  <Text style={{ fontSize: size, color, textAlign: 'center' }}>{icon}</Text>
);

// Request storage permissions
const requestStoragePermissions = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // Check Android version for permission handling
    const androidVersion = Platform.Version;
    console.log('Android version:', androidVersion);

    if (androidVersion >= 33) {
      // Android 13+ - Use new granular permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ]);

      const imagesGranted = granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED;
      const videoGranted = granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.GRANTED;

      console.log('Android 13+ permissions:', { imagesGranted, videoGranted });
      return imagesGranted || videoGranted; // Either permission is sufficient for PDF access
    } else {
      // Android 12 and below - Use legacy permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

      console.log('Legacy permissions:', { readGranted, writeGranted });
      return readGranted && writeGranted;
    }
  } catch (error) {
    console.log('Permission request error:', error);
    return false;
  }
};

interface DocumentFile {
  name: string;
  path: string;
  size: string;
  date: string;
  type: 'certificate' | 'report' | 'invoice';
  customerName: string;
}

const DocumentsScreen: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'certificate' | 'report' | 'invoice'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);

  useEffect(() => {
    loadDocuments();
    checkGoogleDriveStatus();
  }, []);

  const checkGoogleDriveStatus = async () => {
    try {
      const isConnected = await googleDriveService.initialize();
      setGoogleDriveConnected(isConnected);
    } catch (error) {
      console.log('Google Drive status check failed:', error);
      setGoogleDriveConnected(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const filePaths = await listInvoiceFiles();
      console.log('Found PDF files:', filePaths);
      const documentList: DocumentFile[] = [];

      for (const filePath of filePaths) {
        try {
          const stats = await RNFS.stat(filePath);
          const fileName = filePath.split('/').pop() || '';
          
          console.log('Processing file:', fileName, 'Path:', filePath, 'Size:', stats.size);
          
          // Extract customer name and document type from filename
          const customerName = extractCustomerName(fileName);
          const documentType = extractDocumentType(fileName);
          
          documentList.push({
            name: fileName,
            path: filePath,
            size: formatFileSize(stats.size),
            date: new Date(stats.mtime).toLocaleDateString('en-IN'),
            type: documentType,
            customerName: customerName,
          });
        } catch (error) {
          console.log('Error reading file stats for:', filePath, error);
        }
      }

      // Sort by date (newest first)
      documentList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDocuments(documentList);
      
      console.log('Loaded documents:', documentList.length);
      logUserAction('Documents loaded', { count: documentList.length });
    } catch (error) {
      logError('Failed to load documents', { error: error instanceof Error ? error.message : String(error) });
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const extractCustomerName = (fileName: string): string => {
    if (fileName.includes('_certificate.pdf')) {
      return fileName.replace('_certificate.pdf', '').replace(/_/g, ' ');
    } else if (fileName.includes('_report.pdf')) {
      return fileName.replace('_report.pdf', '').replace(/_/g, ' ');
    } else if (fileName.includes('_invoice.pdf')) {
      return fileName.replace('_invoice.pdf', '').replace(/_/g, ' ');
    }
    return fileName.replace('.pdf', '');
  };

  const extractDocumentType = (fileName: string): 'certificate' | 'report' | 'invoice' => {
    if (fileName.includes('_certificate.pdf')) return 'certificate';
    if (fileName.includes('_report.pdf')) return 'report';
    if (fileName.includes('_invoice.pdf')) return 'invoice';
    return 'invoice';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleView = async (document: DocumentFile) => {
    try {
      logUserAction('Document view initiated', { 
        fileName: document.name, 
        type: document.type 
      });

      console.log('=== VIEW PDF PRESSED ===');
      console.log('File name:', document.name);
      console.log('File path:', document.path);

      // Check if file exists
      const exists = await RNFS.exists(document.path);
      console.log('File exists:', exists);

      if (!exists) {
        console.log('❌ PDF file not found:', document.path);
        Alert.alert('Error', 'PDF file not found. The file may have been moved or deleted.');
        return;
      }
      
      // Open in-app PDF viewer
      setSelectedDocument(document);
      setShowPDFViewer(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('View failed', { error: errorMessage, fileName: document.name });
      console.log('❌ Failed to open PDF:', errorMessage);
      Alert.alert('Error', `Failed to open PDF: ${errorMessage}`);
    }
  };

  const openWithPDFApp = async (document: DocumentFile) => {
    try {
      logUserAction('Opening PDF in external app', { fileName: document.name });

      console.log('=== OPENING PDF IN EXTERNAL APP ===');
      console.log('Document path:', document.path);
      console.log('Document name:', document.name);

      // Request permissions first
      const hasPermissions = await requestStoragePermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Required',
          'This app needs storage permissions to open PDF files. Please grant permissions in settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if file exists
      const fileExists = await RNFS.exists(document.path);
      console.log('File exists:', fileExists);

      if (!fileExists) {
        Alert.alert('Error', 'PDF file not found. The file may have been moved or deleted.');
        return;
      }

      // Use app's internal storage instead of external Downloads
      const appDocumentsPath = `${RNFS.DocumentDirectoryPath}/${document.name}`;
      
      console.log('Copying PDF to app documents folder...');
      console.log('App documents path:', appDocumentsPath);
      
      // Copy file to app's internal storage
      await RNFS.copyFile(document.path, appDocumentsPath);
      console.log('✅ File copied to app documents successfully');
      
      // Verify the copy
      const copyExists = await RNFS.exists(appDocumentsPath);
      console.log('Copy exists in app documents:', copyExists);
      
      if (!copyExists) {
        throw new Error('Failed to copy file to app documents');
      }

      // Try multiple methods to open PDF
      console.log('✅ PDF ready, attempting to open...');
      
      try {
        // Method 1: Use react-native-share to open the PDF
        const Share = require('react-native-share').default;
        
        await Share.open({
          url: `file://${appDocumentsPath}`,
          type: 'application/pdf',
          title: document.name,
          subject: document.name,
        });
        
        console.log('✅ PDF opened successfully with Share');
      } catch (shareError) {
        console.log('Share method failed, trying direct file access...');
        
        // Method 2: Direct file access fallback
        try {
          await Linking.openURL(`file://${appDocumentsPath}`);
          console.log('✅ PDF opened with direct file access');
        } catch (linkError) {
          console.log('Direct file access failed, showing file info...');
          
          // Method 3: Show file information for manual access
          Alert.alert(
            'PDF Ready!', 
            `Your PDF is ready to view!\n\n📄 File: ${document.name}\n📂 Location: App Documents\n\nYou can find it in your file manager or use any PDF viewer app.`,
            [
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('PDF opening failed', { error: errorMessage, fileName: document.name });
      console.log('❌ Failed to open PDF:', errorMessage);
      
      // Fallback: Show file path for manual opening
      Alert.alert(
        'PDF Ready!', 
        `Your PDF is ready to view!\n\n📄 File: ${document.name}\n📂 Location: App Documents\n\nYou can find it in your file manager or use any PDF viewer app.`,
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    }
  };

  const handleShare = (document: DocumentFile) => {
    setSelectedDocument(document);
    setShowShareModal(true);
  };

  // Google Drive upload function removed as requested

  const handleDelete = (document: DocumentFile) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(document.path);
              await loadDocuments();
              logUserAction('Document deleted', { fileName: document.name });
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              logError('Delete failed', { error: errorMessage, fileName: document.name });
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const getDocumentIcon = (type: 'certificate' | 'report' | 'invoice') => {
    switch (type) {
      case 'certificate': return <TextIcon icon="🏆" size={isTablet ? 24 : 20} color="#f39c12" />;
      case 'report': return <TextIcon icon="📊" size={isTablet ? 24 : 20} color="#9b59b6" />;
      case 'invoice': return <TextIcon icon="📄" size={isTablet ? 24 : 20} color="#3498db" />;
      default: return <TextIcon icon="📄" size={isTablet ? 24 : 20} color="#3498db" />;
    }
  };

  const getDocumentColor = (type: 'certificate' | 'report' | 'invoice'): string => {
    switch (type) {
      case 'certificate': return '#f39c12';
      case 'report': return '#9b59b6';
      case 'invoice': return '#3498db';
      default: return '#3498db';
    }
  };

  // Search and filter logic
  const getFilteredDocuments = () => {
    let filtered = documents;
    
    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc => 
        doc.customerName.toLowerCase().includes(query) ||
        doc.name.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredDocuments = getFilteredDocuments();

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  // Highlight search matches in text
  const highlightSearchMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text key={index} style={styles.highlightText}>
          {part}
        </Text>
      ) : part
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <TextIcon icon="📁" size={isTablet ? 28 : 24} color="#1a1a2e" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Document Manager</Text>
            <Text style={styles.subtitle}>View and manage your PDFs</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <TextIcon icon="🔍" size={isTablet ? 20 : 18} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextIcon icon="🔍" size={isTablet ? 18 : 16} color="#ffffff" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by customer name, file name, or type..."
                placeholderTextColor="#95a5a6"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <TextIcon icon="✕" size={isTablet ? 16 : 14} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchResultsText}>
                  {filteredDocuments.length} result{filteredDocuments.length !== 1 ? 's' : ''} found
                </Text>
                {filteredDocuments.length === 1 && (
                  <TouchableOpacity
                    style={styles.quickOpenButton}
                    onPress={() => handleView(filteredDocuments[0])}
                  >
                    <View style={styles.quickOpenButtonContent}>
                      <TextIcon icon="🚀" size={isTablet ? 14 : 12} color="#1a1a2e" />
                      <Text style={styles.quickOpenButtonText}> Open PDF</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All ({searchQuery.trim() ? filteredDocuments.length : documents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'certificate' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('certificate')}
          >
            <View style={styles.filterButtonContent}>
              <TextIcon icon="🏆" size={isTablet ? 16 : 14} color={selectedFilter === 'certificate' ? '#ffffff' : '#7f8c8d'} />
              <Text style={[styles.filterText, selectedFilter === 'certificate' && styles.filterTextActive]}>
                Certificates ({searchQuery.trim() ? filteredDocuments.filter(d => d.type === 'certificate').length : documents.filter(d => d.type === 'certificate').length})
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'report' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('report')}
          >
            <View style={styles.filterButtonContent}>
              <TextIcon icon="📊" size={isTablet ? 16 : 14} color={selectedFilter === 'report' ? '#ffffff' : '#7f8c8d'} />
              <Text style={[styles.filterText, selectedFilter === 'report' && styles.filterTextActive]}>
                Reports ({searchQuery.trim() ? filteredDocuments.filter(d => d.type === 'report').length : documents.filter(d => d.type === 'report').length})
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'invoice' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('invoice')}
          >
            <View style={styles.filterButtonContent}>
              <TextIcon icon="📄" size={isTablet ? 16 : 14} color={selectedFilter === 'invoice' ? '#ffffff' : '#7f8c8d'} />
              <Text style={[styles.filterText, selectedFilter === 'invoice' && styles.filterTextActive]}>
                Invoices ({searchQuery.trim() ? filteredDocuments.filter(d => d.type === 'invoice').length : documents.filter(d => d.type === 'invoice').length})
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Documents List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No Documents Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'Generate your first PDF to see it here'
                : `No ${selectedFilter}s found. Generate one to get started.`
              }
            </Text>
          </View>
        ) : (
          filteredDocuments.map((document, index) => (
            <View key={index} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentInfo}>
                  <View style={styles.documentIconContainer}>
                    {getDocumentIcon(document.type)}
                  </View>
                  <View style={styles.documentDetails}>
                    <Text style={styles.customerName}>
                      {highlightSearchMatch(document.customerName, searchQuery)}
                    </Text>
                    <Text style={styles.documentName}>
                      {highlightSearchMatch(document.name, searchQuery)}
                    </Text>
                    <View style={styles.documentMeta}>
                      <Text style={styles.documentMetaText}>{document.date}</Text>
                      <Text style={styles.documentMetaText}>•</Text>
                      <Text style={styles.documentMetaText}>{document.size}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.documentTypeBadge, { backgroundColor: getDocumentColor(document.type) }]}>
                  <Text style={styles.documentTypeText}>
                    {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.documentActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => handleView(document)}
                >
                  <View style={styles.actionButtonContent}>
                    <TextIcon icon="👁️" size={isTablet ? 14 : 12} color="#ffffff" />
                    <Text style={styles.actionButtonText}> View</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={() => handleShare(document)}
                >
                  <View style={styles.actionButtonContent}>
                    <TextIcon icon="📤" size={isTablet ? 14 : 12} color="#ffffff" />
                    <Text style={styles.actionButtonText}> Share</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(document)}
                >
                  <View style={styles.actionButtonContent}>
                    <TextIcon icon="🗑️" size={isTablet ? 14 : 12} color="#ffffff" />
                    <Text style={styles.actionButtonText}> Delete</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      </SafeAreaView>

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedDocument && (
        <SimplePDFViewer
          filePath={selectedDocument.path}
          fileName={selectedDocument.name}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedDocument(null);
          }}
          onShare={(filePath: string) => {
            if (selectedDocument) {
              handleShare(selectedDocument);
            }
          }}
          // Google Drive upload removed as requested
        />
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <ShareModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedDocument(null);
          }}
          filePath={selectedDocument.path}
          fileName={selectedDocument.name}
          onUploadComplete={(fileId, webViewLink) => {
            console.log('Upload completed:', { fileId, webViewLink });
            setShowShareModal(false);
            setSelectedDocument(null);
          }}
        />
      )}
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
    paddingTop: Platform.OS === 'ios' ? 10 : 5,
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'ios' ? (isTablet ? 50 : 45) : (isTablet ? 40 : 35),
    paddingBottom: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 24 : 20,
    minHeight: Platform.OS === 'ios' ? (isTablet ? 140 : 120) : (isTablet ? 120 : 100),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderRadius: isTablet ? 30 : 25,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIcon: {
    fontSize: isTablet ? 28 : 24,
  },
  headerText: {
    flex: 1,
  },
  searchButton: {
    width: isTablet ? 50 : 44,
    height: isTablet ? 50 : 44,
    borderRadius: isTablet ? 25 : 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchButtonText: {
    fontSize: isTablet ? 20 : 18,
    color: '#ffffff',
  },
  searchContainer: {
    marginTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: isTablet ? 12 : 10,
    minHeight: isTablet ? 48 : 44,
  },
  searchIcon: {
    fontSize: isTablet ? 18 : 16,
    color: '#ffffff',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
    color: '#ffffff',
    paddingVertical: isTablet ? 8 : 6,
    paddingHorizontal: 8,
  },
  clearButton: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    borderRadius: isTablet ? 16 : 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: isTablet ? 16 : 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    marginTop: 12,
    alignItems: 'center',
    paddingBottom: 4,
  },
  searchResultsText: {
    fontSize: isTablet ? 14 : 12,
    color: '#b8b8d1',
    textAlign: 'center',
  },
  quickOpenButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 8 : 6,
    borderRadius: 20,
    marginTop: 8,
  },
  quickOpenButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  quickOpenButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    backgroundColor: '#ffd700',
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  title: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#b8b8d1',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    marginBottom: 8,
    marginTop: 8,
  },
  filterButton: {
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  filterButtonActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#1a1a2e',
  },
  filterText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: isTablet ? 30 : 24,
    paddingBottom: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 20 : 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: isTablet ? 18 : 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isTablet ? 80 : 60,
    minHeight: isTablet ? 400 : 300,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: isTablet ? 24 : 20,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: isTablet ? 20 : 16,
    marginTop: 4,
    padding: isTablet ? 20 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  documentIconContainer: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIcon: {
    fontSize: isTablet ? 24 : 20,
  },
  documentDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  documentName: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentMetaText: {
    fontSize: isTablet ? 12 : 10,
    color: '#95a5a6',
    marginRight: 8,
  },
  documentTypeBadge: {
    paddingHorizontal: isTablet ? 12 : 10,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: 12,
  },
  documentTypeText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 8 : 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isTablet ? 48 : 44,
  },
  viewButton: {
    backgroundColor: '#3498db',
  },
  shareButton: {
    backgroundColor: '#27ae60',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default DocumentsScreen;