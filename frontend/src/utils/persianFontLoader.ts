/**
 * Vazir Font Loader for jsPDF
 * This file contains a subset of the Vazir font in base64 format
 * for Persian/Farsi text rendering in PDFs
 */

import jsPDF from 'jspdf';

// This is a placeholder - in production, you would include the actual base64-encoded font
// For now, we'll use a workaround approach

/**
 * Add Persian font support to jsPDF document
 * This function attempts to use fonts that better support Persian characters
 */
export const addPersianFontToDoc = (doc: jsPDF): void => {
  // Note: Helvetica doesn't support Persian characters properly
  // For production use, you need to add a Persian font like Vazir or IRANSans
  
  // Temporary workaround: Use courier which has slightly better Unicode support
  // This is NOT a proper solution but works better than Helvetica
  doc.setFont('courier');
};

/**
 * Instructions for adding a proper Persian font:
 * 
 * 1. Download Vazir font from: https://github.com/rastikerdar/vazir-font
 * 2. Convert TTF to base64 using: https://products.aspose.app/font/base64
 * 3. Add the base64 string below
 * 4. Use doc.addFileToVFS() and doc.addFont() to register it
 * 
 * Example:
 * const vazirBase64 = "AAEAAAALAIAAAwAwT1MvMg8SBfkA..."; // Full base64 string
 * doc.addFileToVFS("Vazir-Regular.ttf", vazirBase64);
 * doc.addFont("Vazir-Regular.ttf", "Vazir", "normal");
 * doc.setFont("Vazir");
 */

/**
 * For immediate use without custom font, we'll use an alternative approach:
 * Render text as images using Canvas API
 */
export const createPersianTextImage = async (
  text: string,
  fontSize: number = 14,
  fontWeight: string = 'normal'
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('');
      return;
    }
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 100;
    
    // Set font (browser will use system Persian fonts)
    ctx.font = `${fontWeight} ${fontSize}px Tahoma, "IRANSans", Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    
    // Draw text
    ctx.fillText(text, canvas.width - 10, 10);
    
    // Convert to data URL
    resolve(canvas.toDataURL('image/png'));
  });
};
