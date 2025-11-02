/**
 * Professional Success Modal
 * Custom success modal matching the app's theme and design
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
  Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'info' | 'warning' | 'error';
  showDetails?: boolean;
  details?: string;
  actionText?: string;
  onAction?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  message,
  onClose,
  type = 'success',
  showDetails = false,
  details,
  actionText,
  onAction
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(0));
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: '✅', color: '#27ae60', bgColor: '#d5f4e6' };
      case 'info':
        return { icon: 'ℹ️', color: '#3498db', bgColor: '#e3f2fd' };
      case 'warning':
        return { icon: '⚠️', color: '#f39c12', bgColor: '#fff3cd' };
      case 'error':
        return { icon: '❌', color: '#e74c3c', bgColor: '#f8d7da' };
      default:
        return { icon: '✅', color: '#27ae60', bgColor: '#d5f4e6' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.overlay}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Header with Icon */}
            <View style={[styles.header, { backgroundColor: color }]}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{icon}</Text>
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>Operation completed successfully</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={[styles.messageContainer, { backgroundColor: bgColor }]}>
                <Text style={styles.message}>{message}</Text>
              </View>

              {/* Details Section */}
              {showDetails && details && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Details:</Text>
                  <Text style={styles.detailsText}>{details}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {actionText && onAction && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: color }]}
                    onPress={onAction}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>{actionText}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
            </View>
          </Animated.View>
        </Animated.View>
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
    overflow: 'hidden',
  },
  header: {
    padding: isTablet ? 24 : 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderRadius: isTablet ? 30 : 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: isTablet ? 28 : 24,
  },
  headerContent: {
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
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: isTablet ? 24 : 20,
  },
  messageContainer: {
    padding: isTablet ? 20 : 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  message: {
    fontSize: isTablet ? 18 : 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 22,
    fontWeight: '500',
  },
  detailsSection: {
    backgroundColor: '#f8f9fa',
    padding: isTablet ? 16 : 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailsLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: isTablet ? 14 : 12,
    color: '#7f8c8d',
    lineHeight: isTablet ? 20 : 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: isTablet ? 16 : 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    flex: 1,
    paddingVertical: isTablet ? 16 : 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#95a5a6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: isTablet ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  footerText: {
    fontSize: isTablet ? 12 : 10,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SuccessModal;
