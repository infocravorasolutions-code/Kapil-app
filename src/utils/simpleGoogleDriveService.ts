/**
 * Simple Google Drive Service
 * Fallback service that works without OAuth setup for testing
 */

import { logger, logUserAction, logError } from './logger';
import RNFS from 'react-native-fs';

export interface SimpleUploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

class SimpleGoogleDriveService {
  private isSignedIn: boolean = false;
  private userEmail: string = '';

  /**
   * Initialize service (always returns true for testing)
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔍 Initializing Simple Google Drive Service...');
      this.isSignedIn = false;
      this.userEmail = '';
      console.log('✅ Simple Google Drive Service initialized (demo mode)');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Simple Google Drive initialization failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Sign in (demo mode - always succeeds)
   */
  async signIn(): Promise<boolean> {
    try {
      console.log('🔍 Starting Simple Google Drive sign in (demo mode)...');
      
      // Simulate sign in process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isSignedIn = true;
      this.userEmail = 'demo@example.com';
      
      logUserAction('Simple Google Drive sign in successful (demo)', { 
        userEmail: this.userEmail 
      });
      console.log('✅ Simple Google Drive sign in successful (demo mode)');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ Simple Google Drive sign in failed:', errorMessage);
      logError('Simple Google Drive sign in failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<boolean> {
    try {
      this.isSignedIn = false;
      this.userEmail = '';
      logUserAction('Simple Google Drive sign out successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Simple Google Drive sign out failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.isSignedIn;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    if (!this.isSignedIn) {
      return null;
    }
    return {
      user: {
        email: this.userEmail
      }
    };
  }

  /**
   * Upload file (demo mode - simulates upload)
   */
  async uploadFile(
    filePath: string, 
    fileName: string, 
    folderId?: string
  ): Promise<SimpleUploadResult> {
    try {
      console.log('🔍 Starting Simple Google Drive upload (demo mode)...');
      console.log('📁 File path:', filePath);
      console.log('📄 File name:', fileName);
      
      if (!this.isSignedIn) {
        throw new Error('Not signed in to Google Drive');
      }

      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate demo file ID and link
      const demoFileId = `demo_${Date.now()}`;
      const demoWebViewLink = `https://drive.google.com/file/d/${demoFileId}/view`;
      
      logUserAction('Simple Google Drive upload successful (demo)', { 
        fileName, 
        fileId: demoFileId 
      });
      
      console.log('✅ Simple Google Drive upload successful (demo mode)');
      console.log('📄 Demo File ID:', demoFileId);
      console.log('🔗 Demo Web View Link:', demoWebViewLink);
      
      return {
        success: true,
        fileId: demoFileId,
        webViewLink: demoWebViewLink,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Simple Google Drive upload failed', { 
        error: errorMessage, 
        fileName 
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create folder (demo mode)
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<SimpleUploadResult> {
    try {
      console.log('🔍 Creating Simple Google Drive folder (demo mode)...');
      console.log('📁 Folder name:', folderName);
      
      if (!this.isSignedIn) {
        throw new Error('Not signed in to Google Drive');
      }

      // Simulate folder creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoFolderId = `demo_folder_${Date.now()}`;
      
      logUserAction('Simple Google Drive folder created (demo)', { 
        folderName, 
        folderId: demoFolderId 
      });
      
      console.log('✅ Simple Google Drive folder created (demo mode)');
      console.log('📁 Demo Folder ID:', demoFolderId);
      
      return {
        success: true,
        fileId: demoFolderId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Simple Google Drive folder creation failed', { 
        error: errorMessage, 
        folderName 
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get app folder ID (demo mode)
   */
  async getAppFolderId(): Promise<string | null> {
    try {
      console.log('🔍 Getting Simple Google Drive app folder (demo mode)...');
      
      if (!this.isSignedIn) {
        throw new Error('Not signed in to Google Drive');
      }

      // Simulate folder search/creation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const demoFolderId = 'demo_kapil_soni_app_folder';
      
      console.log('✅ Simple Google Drive app folder ready (demo mode)');
      console.log('📁 Demo App Folder ID:', demoFolderId);
      
      return demoFolderId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Simple Google Drive get app folder failed', { error: errorMessage });
      return null;
    }
  }

  /**
   * Share file (demo mode)
   */
  async shareFile(fileId: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<boolean> {
    try {
      console.log('🔍 Sharing Simple Google Drive file (demo mode)...');
      console.log('📄 File ID:', fileId);
      console.log('👥 Role:', role);
      
      if (!this.isSignedIn) {
        throw new Error('Not signed in to Google Drive');
      }

      // Simulate sharing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logUserAction('Simple Google Drive file shared (demo)', { 
        fileId, 
        role 
      });
      
      console.log('✅ Simple Google Drive file shared (demo mode)');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Simple Google Drive share failed', { 
        error: errorMessage, 
        fileId 
      });
      return false;
    }
  }
}

export const simpleGoogleDriveService = new SimpleGoogleDriveService();
export default simpleGoogleDriveService;
