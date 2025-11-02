/**
 * Professional Image Selection Modal
 * Custom modal for image selection with modern design
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface ImageSelectionModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
  currentImage?: string | null;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
  visible,
  title,
  subtitle,
  onClose,
  onCamera,
  onGallery,
  onRemove,
  showRemove = false,
  currentImage
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📷</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Image Preview */}
          {currentImage && (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Current Image:</Text>
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: currentImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Camera Option */}
            <TouchableOpacity
              style={[styles.optionButton, styles.cameraButton]}
              onPress={onCamera}
              activeOpacity={0.8}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>📸</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionDescription}>
                  Capture a new image using camera
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity
              style={[styles.optionButton, styles.galleryButton]}
              onPress={onGallery}
              activeOpacity={0.8}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>🖼️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Choose from Gallery</Text>
                <Text style={styles.optionDescription}>
                  Select an existing image from gallery
                </Text>
              </View>
              <View style={styles.optionArrow}>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </TouchableOpacity>


            {/* Remove Option */}
            {showRemove && currentImage && (
              <TouchableOpacity
                style={[styles.optionButton, styles.removeButton]}
                onPress={onRemove}
                activeOpacity={0.8}
              >
                <View style={styles.optionIcon}>
                  <Text style={styles.optionIconText}>🗑️</Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Remove Image</Text>
                  <Text style={styles.optionDescription}>
                    Remove the current image
                  </Text>
                </View>
                <View style={styles.optionArrow}>
                  <Text style={styles.arrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: isTablet ? 500 : width * 0.9,
    maxHeight: height * 0.8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: isTablet ? 24 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: isTablet ? 24 : 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#b8b8d1',
  },
  closeButton: {
    width: isTablet ? 40 : 32,
    height: isTablet ? 40 : 32,
    borderRadius: isTablet ? 20 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: isTablet ? 18 : 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  previewSection: {
    padding: isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  previewLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: isTablet ? 120 : 80,
    height: isTablet ? 120 : 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
  },
  optionsContainer: {
    padding: isTablet ? 20 : 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 16 : 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#fafbfc',
  },
  cameraButton: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  galleryButton: {
    borderColor: '#9b59b6',
    backgroundColor: '#faf8ff',
  },
  removeButton: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  optionIcon: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionIconText: {
    fontSize: isTablet ? 20 : 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
    lineHeight: isTablet ? 20 : 16,
  },
  optionArrow: {
    width: isTablet ? 30 : 24,
    height: isTablet ? 30 : 24,
    borderRadius: isTablet ? 15 : 12,
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: isTablet ? 16 : 14,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  footer: {
    padding: isTablet ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 12,
    paddingVertical: isTablet ? 16 : 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ImageSelectionModal;
