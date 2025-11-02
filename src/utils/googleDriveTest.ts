/**
 * Google Drive Test Utility
 * Simple test functions to verify Google Drive integration
 */

import { googleDriveService } from './googleDriveService';
import { logger, logUserAction, logError } from './logger';

export const testGoogleDriveConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Google Drive connection...');
    
    // Test initialization
    const isInitialized = await googleDriveService.initialize();
    console.log('✅ Google Drive initialized:', isInitialized);
    
    if (!isInitialized) {
      console.log('⚠️ Google Drive not signed in, attempting sign in...');
      const signedIn = await googleDriveService.signIn();
      console.log('✅ Google Drive sign in result:', signedIn);
      
      if (!signedIn) {
        console.log('❌ Google Drive sign in failed');
        return false;
      }
    }
    
    // Test authentication status
    const isAuthenticated = googleDriveService.isAuthenticated();
    console.log('✅ Google Drive authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ Google Drive not authenticated');
      return false;
    }
    
    // Test getting current user
    const currentUser = await googleDriveService.getCurrentUser();
    console.log('✅ Current user:', currentUser?.user?.email || 'Unknown');
    
    // Test getting app folder
    const appFolderId = await googleDriveService.getAppFolderId();
    console.log('✅ App folder ID:', appFolderId || 'Not found');
    
    logUserAction('Google Drive test completed successfully');
    return true;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('❌ Google Drive test failed:', errorMessage);
    logError('Google Drive test failed', { error: errorMessage });
    return false;
  }
};

export const testGoogleDriveUpload = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    console.log('🔍 Testing Google Drive upload...');
    console.log('📁 File path:', filePath);
    console.log('📄 File name:', fileName);
    
    // Test upload
    const result = await googleDriveService.uploadFile(filePath, fileName);
    console.log('✅ Upload result:', result);
    
    if (result.success) {
      console.log('🎉 Upload successful!');
      console.log('📄 File ID:', result.fileId);
      console.log('🔗 Web View Link:', result.webViewLink);
      logUserAction('Google Drive upload test successful', { 
        fileName, 
        fileId: result.fileId 
      });
      return true;
    } else {
      console.log('❌ Upload failed:', result.error);
      logError('Google Drive upload test failed', { 
        error: result.error, 
        fileName 
      });
      return false;
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('❌ Google Drive upload test failed:', errorMessage);
    logError('Google Drive upload test failed', { 
      error: errorMessage, 
      fileName 
    });
    return false;
  }
};

export const getGoogleDriveStatus = async (): Promise<{
  isConnected: boolean;
  userEmail?: string;
  appFolderId?: string;
  error?: string;
}> => {
  try {
    const isInitialized = await googleDriveService.initialize();
    
    if (!isInitialized) {
      return {
        isConnected: false,
        error: 'Google Drive not initialized'
      };
    }
    
    const isAuthenticated = googleDriveService.isAuthenticated();
    
    if (!isAuthenticated) {
      return {
        isConnected: false,
        error: 'Not signed in to Google Drive'
      };
    }
    
    const currentUser = await googleDriveService.getCurrentUser();
    const appFolderId = await googleDriveService.getAppFolderId();
    
    return {
      isConnected: true,
      userEmail: currentUser?.user?.email,
      appFolderId: appFolderId || undefined
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      isConnected: false,
      error: errorMessage
    };
  }
};
