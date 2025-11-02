/**
 * Bottom Navigation Component
 * Simple tab navigation between Form and Documents
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface BottomNavigationProps {
  activeTab: 'form' | 'documents';
  onTabChange: (tab: 'form' | 'documents') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'form' && styles.activeTab]}
        onPress={() => onTabChange('form')}
      >
        <Text style={styles.tabIcon}>📝</Text>
        <Text style={[styles.tabText, activeTab === 'form' && styles.activeTabText]}>
          Create
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
        onPress={() => onTabChange('documents')}
      >
        <Text style={styles.tabIcon}>📁</Text>
        <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
          Documents
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    backgroundColor: '#f8f9fa',
  },
  tabIcon: {
    fontSize: isTablet ? 24 : 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#1a1a2e',
  },
});

export default BottomNavigation;


