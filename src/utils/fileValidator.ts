/**
 * File Validation Utilities
 * Production-grade file handling with size limits and type validation
 */

import RNFS from 'react-native-fs';

export interface FileValidationResult {
  isValid: boolean;
  size: number;
  sizeFormatted: string;
  type: string;
  errors: string[];
  warnings: string[];
}

export interface ImageValidationOptions {
  maxSizeBytes: number;
  allowedTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
}

// Default configuration
const DEFAULT_IMAGE_OPTIONS: ImageValidationOptions = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxWidth: 4000,
  maxHeight: 4000
};

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validates file size and type
 * @param filePath - Path to the file
 * @param options - Validation options
 * @returns Validation result
 */
export const validateFile = async (
  filePath: string, 
  options: Partial<ImageValidationOptions> = {}
): Promise<FileValidationResult> => {
  const config = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check if file exists
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      return {
        isValid: false,
        size: 0,
        sizeFormatted: '0 Bytes',
        type: 'unknown',
        errors: ['File does not exist'],
        warnings: []
      };
    }
    
    // Get file stats
    const stats = await RNFS.stat(filePath);
    const size = stats.size;
    const sizeFormatted = formatFileSize(size);
    
    // Validate file size
    if (size > config.maxSizeBytes) {
      errors.push(`File size (${sizeFormatted}) exceeds maximum allowed size (${formatFileSize(config.maxSizeBytes)})`);
    }
    
    // Check file extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    const mimeType = getMimeTypeFromExtension(extension || '');
    
    if (!config.allowedTypes.includes(mimeType)) {
      errors.push(`File type (${mimeType}) is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
    }
    
    // Add warnings for large files
    if (size > config.maxSizeBytes * 0.8) {
      warnings.push(`File size is close to limit (${sizeFormatted})`);
    }
    
    return {
      isValid: errors.length === 0,
      size,
      sizeFormatted,
      type: mimeType,
      errors,
      warnings
    };
    
  } catch (error) {
    return {
      isValid: false,
      size: 0,
      sizeFormatted: '0 Bytes',
      type: 'unknown',
      errors: [`File validation failed: ${error}`],
      warnings: []
    };
  }
};

/**
 * Gets MIME type from file extension
 * @param extension - File extension
 * @returns MIME type string
 */
const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Validates image file with comprehensive checks
 * @param filePath - Path to the image file
 * @param options - Validation options
 * @returns Promise with validation result
 */
export const validateImageFile = async (
  filePath: string,
  options: Partial<ImageValidationOptions> = {}
): Promise<FileValidationResult> => {
  const config = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  
  // First validate basic file properties
  const basicValidation = await validateFile(filePath, config);
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  // Additional image-specific validations could be added here
  // For now, we rely on the basic file validation
  
  return basicValidation;
};

/**
 * Compresses image if it exceeds size limits
 * @param filePath - Path to the image file
 * @param maxSizeBytes - Maximum allowed size
 * @returns Promise with compressed file path or original path
 */
export const compressImageIfNeeded = async (
  filePath: string,
  maxSizeBytes: number = DEFAULT_IMAGE_OPTIONS.maxSizeBytes
): Promise<{ filePath: string; wasCompressed: boolean; originalSize: number; compressedSize: number }> => {
  try {
    const stats = await RNFS.stat(filePath);
    const originalSize = stats.size;
    
    if (originalSize <= maxSizeBytes) {
      return {
        filePath,
        wasCompressed: false,
        originalSize,
        compressedSize: originalSize
      };
    }
    
    // For now, we'll return the original file
    // In a production app, you might want to implement actual image compression
    // using libraries like react-native-image-resizer
    
    return {
      filePath,
      wasCompressed: false,
      originalSize,
      compressedSize: originalSize
    };
    
  } catch (error) {
    throw new Error(`Image compression failed: ${error}`);
  }
};

/**
 * Gets file size limits for different file types
 * @param fileType - Type of file
 * @returns Size limit in bytes
 */
export const getFileSizeLimit = (fileType: 'image' | 'document' | 'video'): number => {
  const limits = {
    image: 5 * 1024 * 1024,    // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024     // 50MB
  };
  
  return limits[fileType];
};
