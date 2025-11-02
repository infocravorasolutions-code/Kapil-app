/**
 * Input Sanitization Utilities for XSS Protection
 * Production-grade security measures for user input handling
 */

export interface SanitizationResult {
  sanitized: string;
  isValid: boolean;
  warnings: string[];
}

/**
 * Sanitizes text input to prevent XSS attacks
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized result with validation info
 */
export const sanitizeTextInput = (input: string, maxLength: number = 1000): SanitizationResult => {
  const warnings: string[] = [];
  
  // Remove null/undefined
  if (!input) {
    return { sanitized: '', isValid: true, warnings: [] };
  }
  
  // Convert to string and trim
  let sanitized = String(input).trim();
  
  // Check length
  if (sanitized.length > maxLength) {
    warnings.push(`Input truncated from ${sanitized.length} to ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove potentially dangerous characters and patterns
  sanitized = sanitized
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove data: protocols (except safe image types)
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp))/gi, '')
    // Remove vbscript: protocols
    .replace(/vbscript:/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=/gi, '')
    // Remove HTML tags (keep only basic formatting)
    .replace(/<[^>]*>/g, '')
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Trim again after cleaning
    .trim();
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
    /document\./gi,
    /window\./gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      warnings.push('Potentially dangerous content detected and removed');
      sanitized = sanitized.replace(pattern, '');
    }
  }
  
  return {
    sanitized,
    isValid: sanitized.length > 0 && warnings.length === 0,
    warnings
  };
};

/**
 * Sanitizes numeric input
 * @param input - Raw numeric input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized numeric result
 */
export const sanitizeNumericInput = (input: string, min: number = 0, max: number = 999999): SanitizationResult => {
  const warnings: string[] = [];
  
  if (!input) {
    return { sanitized: '', isValid: false, warnings: ['Numeric input is required'] };
  }
  
  // Remove non-numeric characters except decimal point
  let sanitized = input.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const decimalParts = sanitized.split('.');
  if (decimalParts.length > 2) {
    sanitized = decimalParts[0] + '.' + decimalParts.slice(1).join('');
  }
  
  // Convert to number and validate range
  const numericValue = parseFloat(sanitized);
  
  if (isNaN(numericValue)) {
    return { sanitized: '', isValid: false, warnings: ['Invalid numeric format'] };
  }
  
  if (numericValue < min) {
    warnings.push(`Value adjusted from ${numericValue} to minimum ${min}`);
    sanitized = min.toString();
  } else if (numericValue > max) {
    warnings.push(`Value adjusted from ${numericValue} to maximum ${max}`);
    sanitized = max.toString();
  }
  
  return {
    sanitized,
    isValid: !isNaN(numericValue) && numericValue >= min && numericValue <= max,
    warnings
  };
};

/**
 * Validates and sanitizes file paths
 * @param path - File path to validate
 * @returns Sanitized path result
 */
export const sanitizeFilePath = (path: string): SanitizationResult => {
  const warnings: string[] = [];
  
  if (!path) {
    return { sanitized: '', isValid: false, warnings: ['File path is required'] };
  }
  
  let sanitized = String(path).trim();
  
  // Remove path traversal attempts
  sanitized = sanitized
    .replace(/\.\./g, '') // Remove .. sequences
    .replace(/\/+/g, '/') // Remove multiple slashes
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .trim();
  
  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.includes('//')) {
    warnings.push('Path traversal attempt detected and removed');
  }
  
  return {
    sanitized,
    isValid: sanitized.length > 0 && !sanitized.includes('..'),
    warnings
  };
};

/**
 * Comprehensive input validation for form data
 * @param data - Form data object
 * @returns Validation result with sanitized data
 */
export const validateFormData = (data: {
  customerName: string;
  customerId: string;
  jewelleryDetails: string;
  grossWeight: string;
  netWeight: string;
  goldPurity: string;
}): {
  sanitized: typeof data;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Sanitize text inputs
  const customerNameResult = sanitizeTextInput(data.customerName, 100);
  const customerIdResult = sanitizeTextInput(data.customerId, 50);
  const jewelleryDetailsResult = sanitizeTextInput(data.jewelleryDetails, 500);
  const goldPurityResult = sanitizeTextInput(data.goldPurity, 20);
  
  // Sanitize numeric inputs
  const grossWeightResult = sanitizeNumericInput(data.grossWeight, 0, 10000);
  const netWeightResult = sanitizeNumericInput(data.netWeight, 0, 10000);
  
  // Collect validation results
  if (!customerNameResult.isValid) errors.push('Customer name is invalid or contains dangerous content');
  if (!customerIdResult.isValid) errors.push('Customer ID is invalid or contains dangerous content');
  if (!jewelleryDetailsResult.isValid) errors.push('Jewellery details are invalid or contain dangerous content');
  if (!grossWeightResult.isValid) errors.push('Gross weight must be a valid number');
  if (!netWeightResult.isValid) errors.push('Net weight must be a valid number');
  if (!goldPurityResult.isValid) errors.push('Gold purity is invalid or contains dangerous content');
  
  // Collect warnings
  warnings.push(...customerNameResult.warnings);
  warnings.push(...customerIdResult.warnings);
  warnings.push(...jewelleryDetailsResult.warnings);
  warnings.push(...grossWeightResult.warnings);
  warnings.push(...netWeightResult.warnings);
  warnings.push(...goldPurityResult.warnings);
  
  return {
    sanitized: {
      customerName: customerNameResult.sanitized,
      customerId: customerIdResult.sanitized,
      jewelleryDetails: jewelleryDetailsResult.sanitized,
      grossWeight: grossWeightResult.sanitized,
      netWeight: netWeightResult.sanitized,
      goldPurity: goldPurityResult.sanitized,
    },
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
