/**
 * Vazir Font Loader for jsPDF
 * Loads Persian font from public directory
 */

import jsPDF from 'jspdf';

/**
 * Load Vazir font from file and add to jsPDF
 */
export const loadVazirFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    // Fetch the font file from public directory
    const response = await fetch('/fonts/Vazir-Regular-FD.ttf');
    
    if (!response.ok) {
      console.error('Font file not found');
      return false;
    }
    
    // Convert to base64
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          // Add font to jsPDF
          doc.addFileToVFS('Vazir-Regular.ttf', base64);
          doc.addFont('Vazir-Regular.ttf', 'Vazir', 'normal');
          doc.setFont('Vazir');
          
          console.log('Vazir font loaded successfully');
          resolve(true);
        } catch (error) {
          console.error('Error adding font to jsPDF:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading font file');
        resolve(false);
      };
      
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading Vazir font:', error);
    return false;
  }
};

/**
 * Convert font to base64 (for embedding directly in code)
 */
export const convertFontToBase64 = async (fontPath: string): Promise<string> => {
  try {
    const response = await fetch(fontPath);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting font:', error);
    return '';
  }
};
