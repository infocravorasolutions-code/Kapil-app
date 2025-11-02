/**
 * Google Drive Service
 * Handles Google Drive authentication, file upload, download, and sharing
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleDriveApi } from '@robinbobin/react-native-google-drive-api-wrapper';
import { logger, logUserAction, logError } from './logger';
import RNFS from 'react-native-fs';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'AIzaSyDzShimJizlvhBhW8ZLkLUkPupDDrIOqyE', // Your Google API key
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private isSignedIn: boolean = false;
  private driveApi: GoogleDriveApi | null = null;

  /**
   * Initialize Google Drive service
   */
  async initialize(): Promise<boolean> {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.getCurrentUser();
        this.accessToken = userInfo?.idToken || null;
        this.isSignedIn = true;
        
        // Initialize Google Drive API
        this.driveApi = new GoogleDriveApi();
        await this.driveApi.setAccessToken(this.accessToken);
        
        logUserAction('Google Drive service initialized', { isSignedIn: true });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive initialization failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Sign in to Google Drive
   */
  async signIn(): Promise<boolean> {
    try {
      console.log('🔍 Starting Google Drive sign in...');
      
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Google Play Services available');
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In completed:', userInfo.user?.email);
      
      if (userInfo.idToken) {
        this.accessToken = userInfo.idToken;
        this.isSignedIn = true;
        
        // Initialize Google Drive API with new token
        this.driveApi = new GoogleDriveApi();
        await this.driveApi.setAccessToken(this.accessToken);
        
        logUserAction('Google Drive sign in successful', { 
          userEmail: userInfo.user.email 
        });
        console.log('✅ Google Drive API initialized');
        return true;
      } else {
        console.log('❌ No ID token received');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ Google Drive sign in failed:', errorMessage);
      logError('Google Drive sign in failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Sign out from Google Drive
   */
  async signOut(): Promise<boolean> {
    try {
      await GoogleSignin.signOut();
      this.accessToken = null;
      this.isSignedIn = false;
      logUserAction('Google Drive sign out successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive sign out failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Check if user is signed in
   */
  isAuthenticated(): boolean {
    return this.isSignedIn && this.accessToken !== null;
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Get current user failed', { error: errorMessage });
      return null;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    filePath: string, 
    fileName: string, 
    folderId?: string
  ): Promise<UploadResult> {
    try {
      if (!this.isAuthenticated() || !this.driveApi) {
        throw new Error('User not authenticated. Please sign in to Google Drive.');
      }

      // Read file data
      const fileData = await RNFS.readFile(filePath, 'base64');
      const fileSize = (await RNFS.stat(filePath)).size;

      // Upload using Google Drive API wrapper
      const uploadResult = await this.driveApi.uploadFile({
        name: fileName,
        parents: folderId ? [folderId] : undefined,
        mimeType: 'application/pdf',
      }, fileData);

      if (uploadResult && uploadResult.id) {
        // Make file shareable
        await this.driveApi.setFilePublic(uploadResult.id);
        
        logUserAction('File uploaded to Google Drive', { 
          fileName, 
          fileId: uploadResult.id,
          fileSize 
        });

        return {
          success: true,
          fileId: uploadResult.id,
          webViewLink: uploadResult.webViewLink,
        };
      } else {
        throw new Error('Upload failed: No file ID returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive upload failed', { 
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
   * Create a folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<UploadResult> {
    try {
      if (!this.isAuthenticated() || !this.driveApi) {
        throw new Error('User not authenticated. Please sign in to Google Drive.');
      }

      const folderResult = await this.driveApi.createFolder({
        name: folderName,
        parents: parentFolderId ? [parentFolderId] : undefined,
        mimeType: 'application/vnd.google-apps.folder',
      });

      if (folderResult && folderResult.id) {
        logUserAction('Folder created in Google Drive', { 
          folderName, 
          folderId: folderResult.id 
        });

        return {
          success: true,
          fileId: folderResult.id,
        };
      } else {
        throw new Error('Create folder failed: No folder ID returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive folder creation failed', { 
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
   * List files in Google Drive
   */
  async listFiles(query?: string): Promise<DriveFile[]> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated. Please sign in to Google Drive.');
      }

      const q = query || "mimeType='application/pdf'";
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`List files failed: ${response.status}`);
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive list files failed', { error: errorMessage });
      return [];
    }
  }

  /**
   * Download file from Google Drive
   */
  async downloadFile(fileId: string, localPath: string): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated. Please sign in to Google Drive.');
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const fileData = await response.arrayBuffer();
      const base64Data = Buffer.from(fileData).toString('base64');
      
      await RNFS.writeFile(localPath, base64Data, 'base64');
      
      logUserAction('File downloaded from Google Drive', { 
        fileId, 
        localPath 
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive download failed', { 
        error: errorMessage, 
        fileId 
      });
      return false;
    }
  }

  /**
   * Share file from Google Drive
   */
  async shareFile(fileId: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated. Please sign in to Google Drive.');
      }

      const permissions = {
        role: role,
        type: 'anyone',
      };

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(permissions),
        }
      );

      if (!response.ok) {
        throw new Error(`Share file failed: ${response.status}`);
      }

      logUserAction('File shared on Google Drive', { 
        fileId, 
        role 
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive share failed', { 
        error: errorMessage, 
        fileId 
      });
      return false;
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated. Please sign in to Google Drive.');
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Delete file failed: ${response.status}`);
      }

      logUserAction('File deleted from Google Drive', { fileId });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Google Drive delete failed', { 
        error: errorMessage, 
        fileId 
      });
      return false;
    }
  }

  /**
   * Get app folder ID (create if doesn't exist)
   */
  async getAppFolderId(): Promise<string | null> {
    try {
      if (!this.driveApi) {
        throw new Error('Google Drive API not initialized');
      }

      const folderName = 'KAPIL_SONI_APP';
      
      // Search for existing folder
      const searchResult = await this.driveApi.searchFiles({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id,name)',
      });
      
      if (searchResult && searchResult.files && searchResult.files.length > 0) {
        return searchResult.files[0].id;
      }

      // Create folder if it doesn't exist
      const result = await this.createFolder(folderName);
      return result.fileId || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Get app folder failed', { error: errorMessage });
      return null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
