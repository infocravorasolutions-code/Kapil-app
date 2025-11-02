import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  SafeAreaView,
  PermissionsAndroid,
} from 'react-native';
// import { Icon } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { database, InvoiceData } from '../database/db';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import RNFS from 'react-native-fs';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import DigitalSignature from '../components/DigitalSignature';
import LoadingOverlay from '../components/LoadingOverlay';
import ImageSelectionModal from '../components/ImageSelectionModal';
import SuccessModal from '../components/SuccessModal';
import { validateFormData } from '../utils/inputSanitizer';
import { validateImageFile, getFileSizeLimit } from '../utils/fileValidator';
import { logger, logUserAction, logError, logPerformance } from '../utils/logger';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Simple text-based icon component
const TextIcon = ({ icon, size = 20, color = '#000' }) => (
  <Text style={{ fontSize: size, color, textAlign: 'center' }}>{icon}</Text>
);
const isLandscape = width > height;
const isSmallScreen = width < 400;
const isVerySmallScreen = width < 350;

const FormScreen: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [jewelleryDetails, setJewelleryDetails] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [goldPurity, setGoldPurity] = useState('22K');
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [showDigitalSignature, setShowDigitalSignature] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'stamp' | 'signature' | 'customer'>('stamp');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'info' | 'warning' | 'error',
    details: '',
    actionText: '',
    onAction: null as (() => void) | null
  });

  useEffect(() => {
    // Initialize database when component mounts
    const initDB = async () => {
      try {
        await database.initDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        Alert.alert('Error', 'Failed to initialize database');
      }
    };
    initDB();
  }, []);

  const validateForm = (): boolean => {
    // Clear previous errors
    setFieldErrors({});
    
    // Sanitize and validate all form data
    const formData = {
      customerName,
      customerId,
      jewelleryDetails,
      grossWeight,
      netWeight,
      goldPurity
    };

    const validation = validateFormData(formData);
    
    if (!validation.isValid) {
      // Map validation errors to specific fields
      const errors: {[key: string]: string} = {};
      
      // Map errors to field names
      validation.errors.forEach(error => {
        if (error.includes('Customer name')) {
          errors.customerName = 'Please enter a valid customer name';
        } else if (error.includes('Customer ID')) {
          errors.customerId = 'Please enter a valid customer ID';
        } else if (error.includes('Jewellery details')) {
          errors.jewelleryDetails = 'Please enter valid jewellery details';
        } else if (error.includes('Gross weight')) {
          errors.grossWeight = 'Please enter a valid gross weight (0-10000)';
        } else if (error.includes('Net weight')) {
          errors.netWeight = 'Please enter a valid net weight (0-10000)';
        } else if (error.includes('Gold purity')) {
          errors.goldPurity = 'Please enter valid gold purity';
        }
      });
      
      setFieldErrors(errors);
      logError('Form validation failed', { errors: validation.errors });
      return false;
    }

    // Show warnings if any (still use modal for warnings as they're informational)
    if (validation.warnings.length > 0) {
      Alert.alert(
        'Input Warnings',
        validation.warnings.join('\n'),
        [{ text: 'OK' }]
      );
      logger.warn('Form validation warnings', { warnings: validation.warnings });
    }

    return true;
  };

  // Helper function to clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const selectImage = (type: 'stamp' | 'signature' | 'customer') => {
    if (type === 'signature') {
      // For customer signature, show digital signature component
      setShowDigitalSignature(true);
      return;
    }

    // Set current image type and show modal
    setCurrentImageType(type);
    setShowImageModal(true);
  };

  // Modal action handlers
  const handleModalCamera = () => {
    setShowImageModal(false);
    openCamera(currentImageType);
  };

  const handleModalGallery = () => {
    setShowImageModal(false);
    openGallery(currentImageType);
  };


  const handleModalRemove = () => {
    setShowImageModal(false);
    if (currentImageType === 'customer') {
      setCustomerImage(null);
    } else if (currentImageType === 'stamp') {
      setStampImage(null);
    }
    Alert.alert('Success', 'Image removed successfully!');
  };

  const handleModalClose = () => {
    setShowImageModal(false);
  };

  // Helper function to show success modal
  const displaySuccessModal = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
    details?: string,
    actionText?: string,
    onAction?: () => void
  ) => {
    setSuccessModalData({
      title,
      message,
      type,
      details: details || '',
      actionText: actionText || '',
      onAction: onAction || null
    });
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  // Check camera permissions
  const checkCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logError('Camera permission error', { error: errorMessage });
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const openCamera = async (type: 'stamp' | 'signature' | 'customer' = 'stamp') => {
    try {
      // Check camera permission first
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as const,
        includeBase64: true,
        maxWidth: 2000,
        maxHeight: 2000,
        cameraType: 'back' as const,
      };

      logUserAction('Camera opened', { type });

      launchCamera(options, async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          logUserAction('Camera cancelled', { type });
          return;
        }

        if (response.errorMessage) {
          logError('Camera error', { error: response.errorMessage, type });
          Alert.alert('Camera Error', response.errorMessage);
          return;
        }

        if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            // Validate image file
            try {
              const validation = await validateImageFile(imageUri, {
                maxSizeBytes: getFileSizeLimit('image')
              });

              if (!validation.isValid) {
                Alert.alert(
                  'File Validation Error',
                  validation.errors.join('\n'),
                  [{ text: 'OK' }]
                );
                logError('Image validation failed', { 
                  type, 
                  errors: validation.errors,
                  fileSize: validation.sizeFormatted 
                });
                return;
              }

              // Log successful image selection
              logUserAction('Image selected from camera', { 
                type, 
                fileSize: validation.sizeFormatted,
                fileType: validation.type 
              });

              if (type === 'signature') {
                setCustomerSignature(imageUri);
                displaySuccessModal(
                  'Signature Captured!',
                  'Customer signature has been captured successfully using the camera.',
                  'success',
                  `File size: ${validation.sizeFormatted}\nFile type: ${validation.type}`
                );
              } else if (type === 'customer') {
                setCustomerImage(imageUri);
                displaySuccessModal(
                  'Photo Captured!',
                  'Customer photo has been captured successfully using the camera.',
                  'success',
                  `File size: ${validation.sizeFormatted}\nFile type: ${validation.type}`
                );
              } else {
                setStampImage(imageUri);
                displaySuccessModal(
                  'Stamp Image Captured!',
                  'Stamp image has been captured successfully using the camera.',
                  'success',
                  `File size: ${validation.sizeFormatted}\nFile type: ${validation.type}`
                );
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logError('Image validation error', { type, error: errorMessage });
              Alert.alert('Error', 'Failed to validate image file');
            }
          } else {
            Alert.alert('Error', 'Failed to get image from camera');
          }
        } else {
          Alert.alert('Error', 'No image was captured');
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Camera launch error', { type, error: errorMessage });
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = (type: 'stamp' | 'signature' | 'customer' = 'stamp') => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      includeBase64: true,
      maxWidth: 2000,
      maxHeight: 2000,
    };

    logUserAction('Gallery opened', { type });

    launchImageLibrary(options, async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        logUserAction('Gallery cancelled', { type });
        return;
      }

      if (response.errorMessage) {
        logError('Gallery error', { error: response.errorMessage, type });
        Alert.alert('Gallery Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          // Validate image file
          try {
            const validation = await validateImageFile(imageUri, {
              maxSizeBytes: getFileSizeLimit('image')
            });

            if (!validation.isValid) {
              Alert.alert(
                'File Validation Error',
                validation.errors.join('\n'),
                [{ text: 'OK' }]
              );
              logError('Image validation failed', { 
                type, 
                errors: validation.errors,
                fileSize: validation.sizeFormatted 
              });
              return;
            }

            // Log successful image selection
            logUserAction('Image selected from gallery', { 
              type, 
              fileSize: validation.sizeFormatted,
              fileType: validation.type 
            });

            if (type === 'signature') {
              setCustomerSignature(imageUri);
              displaySuccessModal(
                'Signature Selected!',
                'Customer signature has been selected successfully from gallery.',
                'success',
                `File size: ${validation.sizeFormatted}\nFile type: ${validation.type}`
              );
            } else if (type === 'customer') {
              setCustomerImage(imageUri);
              displaySuccessModal(
                'Photo Selected!',
                'Customer photo has been selected successfully from gallery.',
                'success',
                `File size: ${validation.sizeFormatted}\nFile type: ${validation.type}`
              );
            } else {
              setStampImage(imageUri);
              displaySuccessModal(
                'Stamp Image Selected!',
                'Stamp image has been selected successfully from gallery.',
                'success',
                `File size: ${validation.sizeFormatted}\nFile type: ${validation.type}`
              );
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logError('Image validation error', { type, error: errorMessage });
            Alert.alert('Error', 'Failed to validate image file');
          }
        } else {
          Alert.alert('Error', 'Failed to get image from gallery');
        }
      } else {
        Alert.alert('Error', 'No image was selected');
      }
    });
  };

  const handleSignatureComplete = (signatureUri: string) => {
    setCustomerSignature(signatureUri);
    setShowDigitalSignature(false);
    Alert.alert('Success', 'Digital signature captured successfully!');
  };

  const handleSignatureCancel = () => {
    setShowDigitalSignature(false);
  };

  const handleGenerateCard = async () => {
    if (!validateForm()) return;

    const startTime = Date.now();
    setIsLoading(true);
    setShowLoadingOverlay(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing PDF generation...');

    try {
      logUserAction('PDF generation started', { 
        documentType: documentType || 'default',
        hasSignature: !!customerSignature,
        hasCustomerImage: !!customerImage,
        hasStampImage: !!stampImage
      });

      // Update progress
      setLoadingProgress(20);
      setLoadingMessage('Validating form data...');

      // Generate PDF with images
      setLoadingProgress(40);
      setLoadingMessage('Generating PDF document...');

      const pdfPath = await generateInvoicePDF({
        customer_name: customerName.trim(),
        customer_id: customerId.trim(),
        jewellery_details: jewelleryDetails.trim(),
        gross_weight: Number(grossWeight),
        net_weight: Number(netWeight),
        gold_purity: goldPurity.trim(),
        customer_signature: customerSignature || '',
        customer_image: customerImage || '',
        pdf_path: '', // Will be set after PDF generation
      }, logoImage, stampImage, customerSignature, customerImage, documentType);

      setLoadingProgress(80);
      setLoadingMessage('Saving to database...');

      // Save to database
      const invoiceData: InvoiceData = {
        customer_name: customerName.trim(),
        customer_id: customerId.trim(),
        jewellery_details: jewelleryDetails.trim(),
        gross_weight: Number(grossWeight),
        net_weight: Number(netWeight),
        gold_purity: goldPurity.trim(),
        customer_signature: customerSignature || '',
        customer_image: customerImage || '',
        pdf_path: pdfPath,
      };

      const success = await database.insertInvoice(invoiceData);

      setLoadingProgress(100);
      setLoadingMessage('PDF generation completed!');

      if (success) {
        const duration = Date.now() - startTime;
        logPerformance('PDF generation completed', duration, {
          documentType: documentType || 'default',
          filePath: pdfPath
        });

        const documentTypeName = documentType === 'certificate' ? 'Certificate' : 
                                 documentType === 'jewellery-report' ? 'Jewellery Report' : 'Bill';
        
        displaySuccessModal(
          'PDF Generated Successfully!',
          `Your ${documentTypeName} has been generated and saved successfully!`,
          'success',
          `File: ${pdfPath.split('/').pop()}\nLocation: ${pdfPath.split('/').slice(-3).join('/')}\nFormat: 824×500px landscape ${documentTypeName.toLowerCase()}`,
          'Generate Another',
          () => {
            // Clear form
            setCustomerName('');
            setCustomerId('');
            setDocumentType('');
            setJewelleryDetails('');
            setGrossWeight('');
            setNetWeight('');
            setGoldPurity('22K');
            setCustomerSignature(null);
            setCustomerImage(null);
            setLogoImage(null);
            setStampImage(null);
            setShowLoadingOverlay(false);
            setLoadingProgress(0);
            setLoadingMessage('');
            setFieldErrors({});
            setShowSuccessModal(false);
          }
        );
      } else {
        logError('Database save failed', { invoiceData });
        Alert.alert('Error', 'Failed to save invoice data');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('PDF generation failed', { 
        error: errorMessage, 
        duration,
        documentType: documentType || 'default'
      });
      console.error('Error generating card:', error);
      Alert.alert('Error', 'Failed to generate PDF invoice');
    } finally {
      setIsLoading(false);
      setShowLoadingOverlay(false);
      setLoadingProgress(0);
      setLoadingMessage('');
    }
  };

  if (showDigitalSignature) {
    return (
      <DigitalSignature
        onSignatureComplete={handleSignatureComplete}
        onCancel={handleSignatureCancel}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../../logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>SONI BHAVARLAL PRHLADJI</Text>
              <Text style={styles.subtitle}>Professional Jewellery Management System</Text>
              <Text style={styles.version}>Invoice Generator v2.0</Text>
            </View>
          </View>
        </View>

        {/* Customer Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <TextIcon icon="👤" size={isTablet ? 22 : 18} color="#1a1a2e" />
              <Text style={styles.sectionTitle}> Customer Information</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={[styles.input, fieldErrors.customerName && styles.inputError]}
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  clearFieldError('customerName');
                }}
                placeholder="Enter full name"
                placeholderTextColor="#999"
              />
              {fieldErrors.customerName && (
                <Text style={styles.errorText}>{fieldErrors.customerName}</Text>
              )}
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Customer ID *</Text>
              <TextInput
                style={[styles.input, fieldErrors.customerId && styles.inputError]}
                value={customerId}
                onChangeText={(text) => {
                  setCustomerId(text);
                  clearFieldError('customerId');
                }}
                placeholder="Enter customer ID"
                placeholderTextColor="#999"
              />
              {fieldErrors.customerId && (
                <Text style={styles.errorText}>{fieldErrors.customerId}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Document Type Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <TextIcon icon="📄" size={isTablet ? 22 : 18} color="#1a1a2e" />
              <Text style={styles.sectionTitle}> Document Type</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Document Type (Optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={documentType}
                onValueChange={(itemValue: string) => setDocumentType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select document type..." value="" />
                <Picker.Item label="Certificate" value="certificate" />
                <Picker.Item label="Jewellery Report" value="jewellery-report" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Jewellery Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <TextIcon icon="💍" size={isTablet ? 22 : 18} color="#1a1a2e" />
              <Text style={styles.sectionTitle}> Jewellery Details</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Jewellery Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, fieldErrors.jewelleryDetails && styles.inputError]}
              value={jewelleryDetails}
              onChangeText={(text) => {
                setJewelleryDetails(text);
                clearFieldError('jewelleryDetails');
              }}
              placeholder="Describe the jewellery (e.g., Gold Ring with Diamond, Pearl Necklace, etc.)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            {fieldErrors.jewelleryDetails && (
              <Text style={styles.errorText}>{fieldErrors.jewelleryDetails}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputContainer, styles.thirdWidth]}>
              <Text style={styles.label}>Gross Weight (gm) *</Text>
              <TextInput
                style={[styles.input, fieldErrors.grossWeight && styles.inputError]}
                value={grossWeight}
                onChangeText={(text) => {
                  setGrossWeight(text);
                  clearFieldError('grossWeight');
                }}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {fieldErrors.grossWeight && (
                <Text style={styles.errorText}>{fieldErrors.grossWeight}</Text>
              )}
            </View>
            <View style={[styles.inputContainer, styles.thirdWidth]}>
              <Text style={styles.label}>Net Weight (gm) *</Text>
              <TextInput
                style={[styles.input, fieldErrors.netWeight && styles.inputError]}
                value={netWeight}
                onChangeText={(text) => {
                  setNetWeight(text);
                  clearFieldError('netWeight');
                }}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {fieldErrors.netWeight && (
                <Text style={styles.errorText}>{fieldErrors.netWeight}</Text>
              )}
            </View>
            <View style={[styles.inputContainer, styles.thirdWidth]}>
              <Text style={styles.label}>Gold Purity *</Text>
              <TextInput
                style={[styles.input, fieldErrors.goldPurity && styles.inputError]}
                value={goldPurity}
                onChangeText={(text) => {
                  // Remove any existing 'K' and non-numeric characters except decimal point
                  const numericValue = text.replace(/[^0-9.]/g, '');
                  
                  // If user enters a number, automatically add 'K'
                  if (numericValue && !numericValue.includes('K')) {
                    setGoldPurity(numericValue + 'K');
                  } else if (numericValue === '') {
                    setGoldPurity('');
                  } else {
                    setGoldPurity(numericValue);
                  }
                  clearFieldError('goldPurity');
                }}
                placeholder="22K"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {fieldErrors.goldPurity && (
                <Text style={styles.errorText}>{fieldErrors.goldPurity}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <TextIcon icon="📸" size={isTablet ? 22 : 18} color="#1a1a2e" />
              <Text style={styles.sectionTitle}> Document Images</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
          
          <View style={styles.imageGrid}>
            <TouchableOpacity 
              style={[styles.imageCard, stampImage && styles.imageCardSelected]}
              onPress={() => selectImage('stamp')}
            >
              <View style={styles.imageIcon}>
                <TextIcon icon="🏷️" size={isTablet ? 24 : 20} color="#1a1a2e" />
              </View>
              <Text style={styles.imageCardText}>
                {stampImage ? 'Stamp Added ✓' : 'Add Stamp'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imageCard, customerSignature && styles.imageCardSelected]}
              onPress={() => selectImage('signature')}
            >
              <View style={styles.imageIcon}>
                <TextIcon icon="✍️" size={isTablet ? 24 : 20} color="#1a1a2e" />
              </View>
              <Text style={styles.imageCardText}>
                {customerSignature ? 'Signature Added ✓' : 'Add Signature'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imageCard, customerImage && styles.imageCardSelected]}
              onPress={() => selectImage('customer')}
            >
              <View style={styles.imageIcon}>
                <TextIcon icon="📷" size={isTablet ? 24 : 20} color="#1a1a2e" />
              </View>
              <Text style={styles.imageCardText}>
                {customerImage ? 'Photo Added ✓' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Image Previews */}
          {(stampImage || customerSignature || customerImage) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Image Previews:</Text>
              <View style={styles.previewGrid}>
                {stampImage && stampImage !== 'default' && (
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>Stamp</Text>
                    <Image source={{ uri: stampImage }} style={styles.previewImage} />
                  </View>
                )}
                {customerSignature && (
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>Signature</Text>
                    <Image source={{ uri: customerSignature }} style={styles.previewImage} />
                  </View>
                )}
                {customerImage && (
                  <View style={styles.previewItem}>
                    <Text style={styles.previewLabel}>Customer Photo</Text>
                    <Image source={{ uri: customerImage }} style={styles.previewImage} />
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Generate Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.generateButton, isLoading && styles.buttonDisabled]}
            onPress={handleGenerateCard}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Generating Invoice...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <TextIcon icon="📄" size={20} color="#ffffff" />
                <Text style={styles.buttonText}> Generate PDF Invoice</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Enhanced Loading Overlay */}
      <LoadingOverlay
        visible={showLoadingOverlay}
        message={loadingMessage}
        progress={loadingProgress}
        showProgress={true}
        type="pdf"
        onCancel={() => {
          setShowLoadingOverlay(false);
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingMessage('');
        }}
      />

      {/* Professional Image Selection Modal */}
      <ImageSelectionModal
        visible={showImageModal}
        title={currentImageType === 'customer' ? 'Select Customer Image' : 'Select Stamp Image'}
        subtitle={currentImageType === 'customer' ? 'Choose how you want to add customer photo' : 'Choose how you want to add stamp image'}
        onClose={handleModalClose}
        onCamera={handleModalCamera}
        onGallery={handleModalGallery}
        onRemove={handleModalRemove}
        showRemove={currentImageType === 'customer' ? !!customerImage : !!stampImage}
        currentImage={currentImageType === 'customer' ? customerImage : stampImage}
      />

      {/* Professional Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={successModalData.title}
        message={successModalData.message}
        type={successModalData.type}
        details={successModalData.details}
        actionText={successModalData.actionText}
        onAction={successModalData.onAction || undefined}
        onClose={handleSuccessModalClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: isTablet ? 24 : 16,
    paddingBottom: isTablet ? 40 : 30,
    maxWidth: isTablet ? 1200 : undefined,
    alignSelf: 'center',
    width: '100%',
    minHeight: '100%',
  },
  // Header Styles - Fully Responsive
  header: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: isTablet ? 32 : (isSmallScreen ? 16 : 20),
    padding: isTablet ? 28 : (isVerySmallScreen ? 16 : 20),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minHeight: isTablet ? 120 : (isSmallScreen ? 90 : 100),
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  logoContainer: {
    marginRight: isTablet ? 20 : (isSmallScreen ? 12 : 16),
    flexShrink: 0,
  },
  logoCircle: {
    width: isTablet ? 70 : (isVerySmallScreen ? 45 : 55),
    height: isTablet ? 70 : (isVerySmallScreen ? 45 : 55),
    borderRadius: isTablet ? 35 : (isVerySmallScreen ? 22.5 : 27.5),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoImage: {
    width: isTablet ? 55 : (isVerySmallScreen ? 35 : 42),
    height: isTablet ? 55 : (isVerySmallScreen ? 35 : 42),
  },
  headerText: {
    flex: 1,
    minWidth: 0, // Allows text to wrap properly
  },
  title: {
    fontSize: isTablet ? 24 : (isVerySmallScreen ? 16 : 18),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    flexWrap: 'wrap',
    lineHeight: isTablet ? 28 : (isVerySmallScreen ? 20 : 22),
  },
  subtitle: {
    fontSize: isTablet ? 16 : (isVerySmallScreen ? 10 : 12),
    color: '#b8b8d1',
    marginBottom: 2,
    flexWrap: 'wrap',
    lineHeight: isTablet ? 20 : (isVerySmallScreen ? 14 : 16),
  },
  version: {
    fontSize: isTablet ? 12 : (isVerySmallScreen ? 8 : 10),
    color: '#ffd700',
    fontWeight: '600',
    flexWrap: 'wrap',
    lineHeight: isTablet ? 16 : (isVerySmallScreen ? 12 : 14),
  },
  // Section Styles
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: isTablet ? 28 : 20,
    padding: isTablet ? 28 : 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLine: {
    height: 3,
    backgroundColor: '#ffd700',
    borderRadius: 2,
    width: 60,
  },
  // Form Styles
  formRow: {
    flexDirection: isTablet && isLandscape ? 'row' : 'row',
    justifyContent: 'space-between',
    gap: isTablet ? 16 : 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
  },
  label: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
    borderRadius: 10,
    padding: isTablet ? 18 : 14,
    fontSize: isTablet ? 18 : 16,
    backgroundColor: '#fafbfc',
    color: '#2c3e50',
  },
  textArea: {
    height: isTablet ? 100 : 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
    borderRadius: 10,
    backgroundColor: '#fafbfc',
    overflow: 'hidden',
    minHeight: isTablet ? 55 : 50,
    paddingHorizontal: 4,
  },
  picker: {
    height: isTablet ? 55 : 50,
    color: '#2c3e50',
    fontSize: isTablet ? 16 : 14,
  },
  // Error Styles
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
    backgroundColor: '#fdf2f2',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
  // Image Styles
  imageGrid: {
    flexDirection: isTablet ? 'row' : 'row',
    justifyContent: isTablet ? 'space-around' : 'space-between',
    marginBottom: isTablet ? 24 : 20,
    flexWrap: isTablet ? 'wrap' : 'nowrap',
  },
  imageCard: {
    flex: isTablet ? 0 : 1,
    minWidth: isTablet ? 140 : undefined,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    marginHorizontal: isTablet ? 8 : 4,
    marginBottom: isTablet ? 12 : 0,
  },
  imageCardSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  imageIcon: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageIconText: {
    fontSize: isTablet ? 24 : 20,
  },
  imageCardText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  // Preview Styles
  previewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Button Styles
  buttonSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  generateButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: isTablet ? 22 : 18,
    paddingHorizontal: isTablet ? 32 : 24,
    elevation: 6,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    maxWidth: isTablet ? 400 : undefined,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FormScreen;
