/**
 * Production-Grade Loading Overlay Component
 * Enhanced loading states with progress tracking and user feedback
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  type?: 'default' | 'pdf' | 'image' | 'database';
  onCancel?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
  progress = 0,
  showProgress = false,
  type = 'default',
  onCancel
}) => {
  const [rotation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [visible, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getLoadingMessage = () => {
    switch (type) {
      case 'pdf':
        return message || 'Generating PDF...';
      case 'image':
        return message || 'Processing image...';
      case 'database':
        return message || 'Saving to database...';
      default:
        return message || 'Processing...';
    }
  };

  const getLoadingIcon = () => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'database':
        return '💾';
      default:
        return '⏳';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Loading Icon */}
          <View style={styles.iconContainer}>
            <Animated.Text
              style={[
                styles.icon,
                { transform: [{ rotate: spin }] }
              ]}
            >
              {getLoadingIcon()}
            </Animated.Text>
          </View>

          {/* Loading Message */}
          <Text style={styles.message}>{getLoadingMessage()}</Text>

          {/* Progress Bar */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>
          )}

          {/* Loading Spinner */}
          <ActivityIndicator
            size="large"
            color="#1a1a2e"
            style={styles.spinner}
          />

          {/* Cancel Button */}
          {onCancel && (
            <Text style={styles.cancelButton} onPress={onCancel}>
              Cancel
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: isTablet ? 40 : 30,
    alignItems: 'center',
    minWidth: isTablet ? 300 : 250,
    maxWidth: isTablet ? 400 : 300,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: isTablet ? 48 : 40,
    textAlign: 'center',
  },
  message: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: isTablet ? 24 : 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e1e8ed',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  spinner: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 20,
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoadingOverlay;
