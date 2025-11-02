/**
 * KAPIL SONI APK - Offline Invoice Generator
 * React Native App with PDF generation and local database
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import FormScreen from './src/screens/FormScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import BottomNavigation from './src/components/BottomNavigation';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<'form' | 'documents'>('form');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'form':
        return <FormScreen />;
      case 'documents':
        return <DocumentsScreen />;
      default:
        return <FormScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="#f5f5f5"
        />
        <View style={styles.content}>
          {renderActiveScreen()}
        </View>
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default App;
