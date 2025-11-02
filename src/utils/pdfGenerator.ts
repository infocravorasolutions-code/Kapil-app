import { InvoiceData } from '../database/db';
import RNFS from 'react-native-fs';
import { Alert } from 'react-native';
import jsPDF from 'jspdf';

// Polyfill for TextDecoder if not available
declare const global: any;
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input: any) {
      if (input instanceof ArrayBuffer) {
        return String.fromCharCode.apply(null, Array.from(new Uint8Array(input)));
      } else if (input instanceof Uint8Array) {
        return String.fromCharCode.apply(null, Array.from(input));
      }
      return String.fromCharCode.apply(null, Array.from(new Uint8Array(input)));
    }
  };
}

// Polyfill for TextEncoder if not available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input: string) {
      const bytes = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        bytes[i] = input.charCodeAt(i);
      }
      return bytes;
    }
  };
}

// Helper function to sanitize customer name for file naming
const sanitizeCustomerName = (name: string): string => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
    .substring(0, 20); // Limit to 20 characters
};

export const generateInvoicePDF = async (data: InvoiceData, logoImage?: string | null, stampImage?: string | null, customerSignature?: string | null, customerImage?: string | null, documentType?: string): Promise<string> => {
  try {
    // Create PDF with exact dimensions (824x500 points)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [824, 500]
    });

    // Set colors
    const darkPurple = '#280029';
    const gold = '#d4af37';
    const purple = '#9b59b6';
    const lightGray = '#f5f5f5';
    const white = '#ffffff';

    // Draw main border
    pdf.setDrawColor(darkPurple);
    pdf.setLineWidth(3);
    pdf.rect(10, 10, 804, 480);

    // Header background (at the TOP)
    pdf.setFillColor(darkPurple);
    pdf.rect(10, 10, 804, 80, 'F');

    // Logo circle in header (white background) - increased size
    pdf.setFillColor(white);
    pdf.setDrawColor(white);
    pdf.setLineWidth(2);
    pdf.circle(50, 50, 30, 'FD'); // Increased circle radius from 20 to 30
    
    // Try to add logo image, fallback to text if fails
    try {
      // Try multiple paths for the logo file
      const possiblePaths = [
        '/Users/darshanpatel/Documents/KAPIL_SONI_APK/logo.png',
        `${RNFS.DocumentDirectoryPath}/logo.png`,
        `${RNFS.MainBundlePath}/logo.png`,
        'file:///android_asset/logo.png'
      ];
      
      let logoData = null;
      let logoPath = '';
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to read logo from: ${path}`);
          if (path.startsWith('file:///android_asset/')) {
            // For Android assets, we need to use a different approach
            const assetPath = path.replace('file:///android_asset/', '');
            logoData = await RNFS.readFileAssets(assetPath, 'base64');
            logoPath = path;
            break;
          } else {
            const exists = await RNFS.exists(path);
            if (exists) {
              logoData = await RNFS.readFile(path, 'base64');
              logoPath = path;
              break;
            }
          }
        } catch (pathError) {
          console.log(`Failed to read from ${path}:`, pathError);
          continue;
        }
      }
      
      if (logoData) {
        const logoBase64 = `data:image/png;base64,${logoData}`;
        
        // Add logo image with increased size
        // Position: x=20, y=20, width=60, height=60 (larger logo in header)
        pdf.addImage(logoBase64, 'PNG', 20, 20, 60, 60);
        console.log(`Logo image added successfully from: ${logoPath}`);
      } else {
        throw new Error('Logo file not found in any of the possible paths');
      }
    } catch (error) {
      console.log('Could not add logo image, using default text:', error);
      // Fallback to text logo with increased size
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24); // Increased from 16 to 24
      pdf.setFont('helvetica', 'bold');
      pdf.text('BP', 35, 58); // Adjusted position for larger text
    }

    // Header text based on document type
    if (documentType === 'certificate') {
      // Certificate header - NO subtitle
      pdf.setTextColor(gold);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CERTIFICATE', 90, 45);

      // Business name and phone
      pdf.setTextColor(gold);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('SONI BHAVARLAL PRHLADJI - MO. 9428419514', 90, 68);
    } else if (documentType === 'jewellery-report') {
      // Jewellery Report header - NO subtitle
      pdf.setTextColor(gold);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('JEWELLERY REPORT', 90, 45);

      // Business name and phone
      pdf.setTextColor(gold);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('SONI BHAVARLAL PRHLADJI - MO. 9428419514', 90, 68);
    } else {
      // Default: Show only business name with certificateTitle styling
      pdf.setTextColor(gold);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SONI BHAVARLAL PRHLADJI - MO. 9428419514', 90, 50);
    }

    // Add HeaderSideElement.png to the top right corner
    try {
      // Try multiple approaches to load the HeaderSideElement.png
      let headerBase64 = null;
      let headerPath = '';
      
      // Method 1: Try absolute path
      const absolutePath = '/Users/darshanpatel/Documents/KAPIL_SONI_APK/HeaderSideElement.png';
      console.log(`Trying absolute path: ${absolutePath}`);
      
      try {
        const fileExists = await RNFS.exists(absolutePath);
        console.log(`File exists at absolute path: ${fileExists}`);
        
        if (fileExists) {
          const headerData = await RNFS.readFile(absolutePath, 'base64');
          headerBase64 = `data:image/png;base64,${headerData}`;
          headerPath = absolutePath;
          console.log('Successfully loaded HeaderSideElement from absolute path');
        }
      } catch (error) {
        console.log('Failed to load from absolute path:', error);
      }
      
      // Method 2: Try relative path if absolute failed
      if (!headerBase64) {
        try {
          const relativePath = './HeaderSideElement.png';
          console.log(`Trying relative path: ${relativePath}`);
          
          const fileExists = await RNFS.exists(relativePath);
          console.log(`File exists at relative path: ${fileExists}`);
          
          if (fileExists) {
            const headerData = await RNFS.readFile(relativePath, 'base64');
            headerBase64 = `data:image/png;base64,${headerData}`;
            headerPath = relativePath;
            console.log('Successfully loaded HeaderSideElement from relative path');
          }
        } catch (error) {
          console.log('Failed to load from relative path:', error);
        }
      }
      
      // Method 3: Try require() approach
      if (!headerBase64) {
        try {
          console.log('Trying require() approach');
          const headerImage = require('../../HeaderSideElement.png');
          headerBase64 = headerImage;
          headerPath = 'require() bundled asset';
          console.log('Successfully loaded HeaderSideElement using require()');
        } catch (error) {
          console.log('Failed to load using require():', error);
        }
      }
      
      if (headerBase64) {
        // Position in top right corner
        const headerX = 700;
        const headerY = 15;
        const headerWidth = 100;
        const headerHeight = 60;
        
        // Add HeaderSideElement image to top right
        pdf.addImage(headerBase64, 'PNG', headerX, headerY, headerWidth, headerHeight);
        console.log(`HeaderSideElement image added successfully from: ${headerPath} at position (${headerX}, ${headerY})`);
      } else {
        console.log('Could not load HeaderSideElement.png from any method');
        // Only show decorative element if image completely fails to load
        const headerX = 700;
        const headerY = 15;
        const headerWidth = 100;
        const headerHeight = 60;
        
        // Draw a decorative rectangle with company colors
        pdf.setFillColor(darkPurple);
        pdf.setDrawColor(gold);
        pdf.setLineWidth(2);
        pdf.rect(headerX, headerY, headerWidth, headerHeight, 'FD');
        
        // Add decorative text
        pdf.setTextColor(gold);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SONI', headerX + 10, headerY + 20);
        pdf.text('JEWELLERY', headerX + 10, headerY + 35);
        pdf.text('CERTIFIED', headerX + 10, headerY + 50);
        
        console.log('Added decorative element as fallback');
      }
    } catch (error) {
      console.log('Could not add HeaderSideElement:', error);
    }

    // Left sidebar
    pdf.setFillColor(darkPurple);
    pdf.rect(10, 90, 50, 400, 'F');

    // Main content area - Customer details (adjusted for wider left sidebar)
    const leftMargin = 80;
    const colonPos = 240;
    const valuePos = 260;
    let currentY = 140;
    const lineSpacing = 35;

    // Helper function to add a field
    const addField = (label: string, value: string, y: number) => {
      pdf.setTextColor(darkPurple);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, y);
      
      pdf.setTextColor(51, 51, 51);
      pdf.text(':', colonPos, y);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, valuePos, y);
    };

    // Add all fields
    addField('NAME', data.customer_name, currentY);
    currentY += lineSpacing;
    
    addField('CUSTOMER ID', data.customer_id, currentY);
    currentY += lineSpacing;
    
    addField('DESCRIPTION', data.jewellery_details, currentY);
    currentY += lineSpacing;
    
    addField('GROSS WEIGHT', `${data.gross_weight} gm`, currentY);
    currentY += lineSpacing;
    
    addField('NET WEIGHT', `${data.net_weight} gm`, currentY);
    currentY += lineSpacing;
    
    addField('GOLD PURITY', data.gold_purity, currentY);

    // Right side - Images section (only show if images are provided)
    const imagesX = 580;
    const imagesY = 120;
    
    // Determine sizes based on what images are available
    let stampSize = 0;
    let customerImageSize = 0;
    let maxHeight = 0;
    
    // Only show images section if at least one image is provided
    if (stampImage || customerImage) {
      let currentX = imagesX;
      
      // Calculate sizes based on what's available
      if (stampImage && customerImage) {
        // Both images: make them bigger since we have more space
        stampSize = 100;
        customerImageSize = 100;
      } else if (stampImage) {
        // Only stamp: make it larger
        stampSize = 180;
      } else if (customerImage) {
        // Only customer: make it larger
        customerImageSize = 180;
      }

      // Stamp image section (only if stamp image is provided)
      if (stampImage && stampImage !== 'default') {
        // Stamp box with border
        pdf.setFillColor(white);
        pdf.setDrawColor(darkPurple);
        pdf.setLineWidth(2);
        pdf.rect(currentX, imagesY, stampSize, stampSize, 'FD');
        
        // Add "STAMP" label
        pdf.setTextColor(darkPurple);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        // pdf.text('STAMP', currentX + 5, imagesY + 12);

        try {
          // Convert image to base64 if it's a file URI
          let imageBase64 = '';
          if (stampImage.startsWith('file://')) {
            // Read the image file and convert to base64
            const imageData = await RNFS.readFile(stampImage, 'base64');
            imageBase64 = `data:image/jpeg;base64,${imageData}`;
          } else if (stampImage.startsWith('data:')) {
            // Already base64
            imageBase64 = stampImage;
          } else {
            // Try to read as file path
            const imageData = await RNFS.readFile(stampImage, 'base64');
            imageBase64 = `data:image/jpeg;base64,${imageData}`;
          }
          
          // Add the user's stamp image to the PDF
          pdf.addImage(imageBase64, 'JPEG', currentX + 10, imagesY + 20, stampSize - 20, stampSize - 30);
          console.log('Stamp image added successfully');
        } catch (error) {
          console.log('Could not add stamp image, using default text:', error);
          // Fallback to text stamp
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(stampSize > 100 ? 70 : 35);
          pdf.setFont('helvetica', 'bold');
          pdf.text('S', currentX + stampSize/2 - 10, imagesY + stampSize/2 + 10);
          
          pdf.setFontSize(stampSize > 100 ? 11 : 8);
          pdf.setFont('helvetica', 'bold');
          pdf.text('SONI BHAVARLAL', currentX + 10, imagesY + 30);
          pdf.text('PRHLAD', currentX + 15, imagesY + 45);
          pdf.text('JEWELLERY', currentX + 10, imagesY + stampSize - 20);
          // pdf.text('STAMP', currentX + 15, imagesY + stampSize - 5);
        }
        
        currentX += stampSize + 10; // Move to next position
        maxHeight = Math.max(maxHeight, stampSize);
      }

      // Customer image section (only if customer image is provided)
      if (customerImage) {
        // Customer image box with border
        pdf.setFillColor(white);
        pdf.setDrawColor(darkPurple);
        pdf.setLineWidth(2);
        pdf.rect(currentX, imagesY, customerImageSize, customerImageSize, 'FD');
        
        // Add "CUSTOMER PHOTO" label
        pdf.setTextColor(darkPurple);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        // pdf.text('CUSTOMER PHOTO', currentX + 5, imagesY + 12);
        
        try {
          // Convert customer image to base64 if it's a file URI
          let customerImageBase64 = '';
          if (customerImage.startsWith('file://')) {
            const imageData = await RNFS.readFile(customerImage, 'base64');
            customerImageBase64 = `data:image/jpeg;base64,${imageData}`;
          } else if (customerImage.startsWith('data:')) {
            customerImageBase64 = customerImage;
          } else {
            const imageData = await RNFS.readFile(customerImage, 'base64');
            customerImageBase64 = `data:image/jpeg;base64,${imageData}`;
          }
          
          // Add the customer image to the PDF
          pdf.addImage(customerImageBase64, 'JPEG', currentX + 10, imagesY + 20, customerImageSize - 20, customerImageSize - 30);
          console.log('Customer image added successfully');
        } catch (error) {
          console.log('Could not add customer image:', error);
          // Fallback to text
          pdf.setTextColor(darkPurple);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          // pdf.text('Customer Photo', currentX + 10, imagesY + customerImageSize/2);
        }
        
        maxHeight = Math.max(maxHeight, customerImageSize);
      }
    }

    // Customer signature section (only show if signature is provided)
    if (customerSignature && customerSignature !== 'default') {
      // Fixed bottom position for signature box (same as single image layout)
      const sigY = 335; // Fixed Y position at bottom of PDF
      
      // Adjust signature box width and position based on available images
      let sigBoxWidth = 180;
      let sigBoxX = imagesX;
      
      if (stampImage && customerImage) {
        // When both images are present, make signature box span both image boxes
        sigBoxWidth = (stampSize + 10 + customerImageSize); // Total width of both image boxes
      } else if (stampImage || customerImage) {
        // When only one image is present, match that image width
        sigBoxWidth = Math.max(stampSize, customerImageSize);
      }
      
      const sigBoxHeight = 80;
      
      // Draw signature box border
      pdf.setDrawColor(darkPurple);
      pdf.setLineWidth(1);
      pdf.rect(sigBoxX, sigY, sigBoxWidth, sigBoxHeight);
      
      // Add "Customer Signature" label at the top of the box
      pdf.setTextColor(darkPurple);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Customer Signature', sigBoxX + 5, sigY + 12);
      
      // Handle customer signature image
      try {
        // Convert image to base64 if it's a file URI
        let signatureBase64 = '';
        if (customerSignature.startsWith('file://')) {
          // Read the image file and convert to base64
          const imageData = await RNFS.readFile(customerSignature, 'base64');
          signatureBase64 = `data:image/jpeg;base64,${imageData}`;
        } else if (customerSignature.startsWith('data:')) {
          // Already base64
          signatureBase64 = customerSignature;
        } else {
          // Try to read as file path
          const imageData = await RNFS.readFile(customerSignature, 'base64');
          signatureBase64 = `data:image/jpeg;base64,${imageData}`;
        }
        
        // Add the customer signature image to the PDF (inside the box)
        pdf.addImage(signatureBase64, 'JPEG', sigBoxX + 5, sigY + 20, sigBoxWidth - 10, 40);
        console.log('Customer signature image added successfully');
      } catch (error) {
        console.log('Could not add customer signature image, using default text:', error);
        // Fallback to text signature
        pdf.setTextColor(darkPurple);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Signature', sigBoxX + 10, sigY + 40);
      }
      
      // Add customer name below the signature box
      pdf.setTextColor(darkPurple);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.customer_name, sigBoxX + 5, sigY + sigBoxHeight + 15);
    }

    // Add large semi-transparent logo in the center of the certificate
    try {
      // Try multiple paths for the logo file
      const possiblePaths = [
        '/Users/darshanpatel/Documents/KAPIL_SONI_APK/logo.png',
        `${RNFS.DocumentDirectoryPath}/logo.png`,
        `${RNFS.MainBundlePath}/logo.png`,
        'file:///android_asset/logo.png'
      ];
      
      let logoData = null;
      let logoPath = '';
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to read logo from: ${path}`);
          if (path.startsWith('file:///android_asset/')) {
            // For Android assets, we need to use a different approach
            const assetPath = path.replace('file:///android_asset/', '');
            logoData = await RNFS.readFileAssets(assetPath, 'base64');
            logoPath = path;
            break;
          } else {
            const exists = await RNFS.exists(path);
            if (exists) {
              logoData = await RNFS.readFile(path, 'base64');
              logoPath = path;
              break;
            }
          }
        } catch (pathError) {
          console.log(`Failed to read from ${path}:`, pathError);
          continue;
        }
      }
      
      if (logoData) {
        const logoBase64 = `data:image/png;base64,${logoData}`;
        
        // Calculate center position for 300x300 logo
        const centerX = (824 - 300) / 2; // (total width - logo width) / 2
        const centerY = (500 - 300) / 2; // (total height - logo height) / 2
        
        // Create a semi-transparent overlay for the logo
        // First, save the current graphics state
        pdf.saveGraphicsState();
        
        // Set global alpha to 15% (0.15)
        pdf.setGState(pdf.GState({opacity: 0.15}));
        
        // Add large semi-transparent logo in the center
        pdf.addImage(logoBase64, 'PNG', centerX, centerY, 300, 300);
        
        // Restore the graphics state
        pdf.restoreGraphicsState();
        
        console.log(`Large center logo with 15% opacity added successfully from: ${logoPath}`);
      } else {
        console.log('Could not find logo file for center watermark');
      }
    } catch (error) {
      console.log('Could not add center logo watermark:', error);
    }

    // Footer section (at the BOTTOM)
    pdf.setFillColor(lightGray);
    pdf.rect(10, 440, 804, 50, 'F');
    
    // Footer border line
    pdf.setDrawColor(gold);
    pdf.setLineWidth(2);
    pdf.line(10, 440, 814, 440);

    // Footer text - Address
    pdf.setTextColor(darkPurple);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('283/6/1, PREMDARWAJA OPP BABASDEHLA AHM-380002', 60, 465);


    // Save PDF with organized folder structure using customer name
    const sanitizedCustomerName = sanitizeCustomerName(data.customer_name);
    const documentTypeFolder = documentType === 'certificate' ? 'certificate' : 
                             documentType === 'jewellery-report' ? 'jewellery-report' : 'bills';
    
    // Create descriptive file names based on document type
    let pdfFileName = '';
    if (documentType === 'certificate') {
      pdfFileName = `${sanitizedCustomerName}_certificate.pdf`;
    } else if (documentType === 'jewellery-report') {
      pdfFileName = `${sanitizedCustomerName}_report.pdf`;
    } else {
      pdfFileName = `${sanitizedCustomerName}_invoice.pdf`;
    }
    let filePath = '';
    let successMessage = '';
    
    try {
      // Generate PDF as base64 string using datauristring method
      const pdfDataUri = pdf.output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];
      
      // Create organized folder structure: Download/KAPIL_SONI_APP/invoices/certificate/ or /jewellery-report/
      const baseFolder = `${RNFS.ExternalStorageDirectoryPath}/Download/KAPIL_SONI_APP/invoices`;
      const documentFolder = `${baseFolder}/${documentTypeFolder}`;
      const downloadsPath = `${documentFolder}/${pdfFileName}`;
      
      // Create all necessary directories
      await RNFS.mkdir(baseFolder);
      await RNFS.mkdir(documentFolder);
      await RNFS.writeFile(downloadsPath, base64Data, 'base64');
      filePath = downloadsPath;
      
      const documentTypeName = documentType === 'jewellery-report' ? 'Jewellery Report' : 
                              documentType === 'certificate' ? 'Certificate' : 'Invoice';
      successMessage = `✅ PDF ${documentTypeName} Generated Successfully!\n\nFile: ${pdfFileName}\n\nLocation: Downloads/KAPIL_SONI_APP/invoices/${documentTypeFolder}/\n\n📱 Ready to use!\n\n💡 Format: 824×500px landscape ${documentTypeName.toLowerCase()}`;
    } catch (error) {
      console.log('Downloads folder failed, trying app storage:', error);
      try {
        // Fallback to app storage with organized structure
        const pdfDataUri = pdf.output('datauristring');
        const base64Data = pdfDataUri.split(',')[1];
        const appBaseFolder = `${RNFS.DocumentDirectoryPath}/KAPIL_SONI_APP/invoices`;
        const appDocumentFolder = `${appBaseFolder}/${documentTypeFolder}`;
        
        // Create app storage directories
        await RNFS.mkdir(appBaseFolder);
        await RNFS.mkdir(appDocumentFolder);
        filePath = `${appDocumentFolder}/${pdfFileName}`;
        await RNFS.writeFile(filePath, base64Data, 'base64');
        
        const documentTypeName = documentType === 'jewellery-report' ? 'Jewellery Report' : 
                                documentType === 'certificate' ? 'Certificate' : 'Bill';
        successMessage = `✅ PDF ${documentTypeName} Generated Successfully!\n\nFile: ${pdfFileName}\n\nLocation: App Documents/KAPIL_SONI_APP/invoices/${documentTypeFolder}/\n\n📱 Ready to use!\n\n💡 Format: 824×500px landscape ${documentTypeName.toLowerCase()}`;
      } catch (fallbackError) {
        console.error('Both storage methods failed:', fallbackError);
        throw new Error('Failed to save PDF to any storage location');
      }
    }
    
    console.log('PDF generated:', filePath);
    
    const documentTypeName = documentType === 'jewellery-report' ? 'Jewellery Report' : 
                            documentType === 'certificate' ? 'Certificate' : 'Bill';
    
    Alert.alert(
      `🎉 ${documentTypeName} Generated!`,
      successMessage,
      [
        { text: 'OK' },
        { 
          text: 'Copy Path', 
          onPress: () => {
            console.log('PDF path:', filePath);
          }
        }
      ]
    );
    
    return filePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert(
      'Error',
      'Failed to generate PDF certificate. Please try again.',
      [{ text: 'OK' }]
    );
    throw error;
  }
};

export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    return await RNFS.exists(filePath);
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

export const deletePDFFile = async (filePath: string): Promise<boolean> => {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
      console.log('PDF file deleted successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting PDF file:', error);
    return false;
  }
};

export const listInvoiceFiles = async (): Promise<string[]> => {
  try {
    const possiblePaths = [
      `${RNFS.ExternalStorageDirectoryPath}/Download/KAPIL_SONI_APP/invoices/certificate`,
      `${RNFS.ExternalStorageDirectoryPath}/Download/KAPIL_SONI_APP/invoices/jewellery-report`,
      `${RNFS.ExternalStorageDirectoryPath}/Download/KAPIL_SONI_APP/invoices/bills`,
      `${RNFS.DocumentDirectoryPath}/KAPIL_SONI_APP/invoices/certificate`,
      `${RNFS.DocumentDirectoryPath}/KAPIL_SONI_APP/invoices/jewellery-report`,
      `${RNFS.DocumentDirectoryPath}/KAPIL_SONI_APP/invoices/bills`,
      // Fallback to old paths for backward compatibility
      `${RNFS.ExternalStorageDirectoryPath}/Download/KAPIL_SONI_INVOICES`,
      `${RNFS.ExternalStorageDirectoryPath}/KAPIL_SONI_INVOICES`,
      `${RNFS.DocumentDirectoryPath}`
    ];

    let allFiles: string[] = [];

    for (const path of possiblePaths) {
      try {
        const exists = await RNFS.exists(path);
        if (exists) {
          const files = await RNFS.readDir(path);
          const pdfFiles = files
            .filter(file => (file.name.includes('_certificate.pdf') || file.name.includes('_report.pdf') || file.name.includes('_invoice.pdf')) && file.name.endsWith('.pdf'))
            .map(file => file.path);
          
          if (pdfFiles.length > 0) {
            console.log(`Found ${pdfFiles.length} PDF files in: ${path}`);
            allFiles = allFiles.concat(pdfFiles);
          }
        }
      } catch (error) {
        console.log(`Path not accessible: ${path}`);
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error('Error listing PDF files:', error);
    return [];
  }
};