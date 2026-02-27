/**
 * Persian Font Configuration for pdfmake
 * This file configures Persian fonts (Vazir, IRANSans, Shabnam) for use with pdfmake
 */

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Extend pdfMake type to include vfs and fonts
declare module 'pdfmake/build/pdfmake' {
  interface TCreatedPdf {
    vfs?: any;
    fonts?: any;
  }
}

/**
 * Initialize default fonts for pdfmake
 */
const initializeDefaultFonts = () => {
  try {
    // Debug: Log pdfFonts structure
    console.log('📦 pdfFonts structure:', {
      type: typeof pdfFonts,
      hasVfs: !!(pdfFonts as any).vfs,
      hasPdfMake: !!(pdfFonts as any).pdfMake,
      hasPdfMakeVfs: !!((pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs),
    });
    
    // Set default virtual file system for fonts
    if (typeof pdfFonts === 'object' && pdfFonts !== null) {
      // Try different possible structures
      if ((pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
        (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
        console.log('✅ Default pdfMake fonts loaded successfully');
      } else if ((pdfFonts as any).vfs) {
        (pdfMake as any).vfs = (pdfFonts as any).vfs;
        console.log('✅ Default pdfMake fonts loaded successfully (alternate structure)');
      } else {
        console.warn('⚠️ Could not find vfs in pdfFonts. PDF generation may not work properly.');
        // Initialize with empty vfs to prevent errors
        (pdfMake as any).vfs = {};
      }
    } else {
      console.error('❌ pdfFonts module not loaded properly');
      (pdfMake as any).vfs = {};
    }
  } catch (error) {
    console.error('❌ Error initializing default fonts:', error);
    // Ensure vfs exists even if empty
    (pdfMake as any).vfs = {};
  }
};

/**
 * Custom fonts configuration with Persian font
 * To use this, you need to add the Base64-encoded font to vfs
 */
export const configurePersianFonts = async (): Promise<void> => {
  // First, initialize default fonts
  initializeDefaultFonts();
  
  try {
    // Try to load Vazir font from public directory
    const response = await fetch('/fonts/Vazir-Regular-FD.ttf');
    
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            
            // Add Vazir font to pdfMake virtual file system
            // Merge with existing vfs instead of recreating it
            const currentVfs = (pdfMake as any).vfs || {};
            (pdfMake as any).vfs = {
              ...currentVfs,
              'Vazir-Regular.ttf': base64,
            };
            
            // Configure fonts
            (pdfMake as any).fonts = {
              Roboto: {
                normal: 'Roboto-Regular.ttf',
                bold: 'Roboto-Medium.ttf',
                italics: 'Roboto-Italic.ttf',
                bolditalics: 'Roboto-MediumItalic.ttf'
              },
              Vazir: {
                normal: 'Vazir-Regular.ttf',
                bold: 'Vazir-Regular.ttf',
                italics: 'Vazir-Regular.ttf',
                bolditalics: 'Vazir-Regular.ttf'
              }
            };
            
            console.log('✅ Vazir font loaded successfully for pdfmake');
            resolve();
          } catch (error) {
            console.error('Error configuring Vazir font:', error);
            reject(error);
          }
        };
        
        reader.onerror = () => {
          console.error('Error reading Vazir font file');
          reject(new Error('Failed to read font file'));
        };
        
        reader.readAsDataURL(blob);
      });
    } else {
      console.warn('⚠️ Vazir font not found at /fonts/Vazir-Regular-FD.ttf');
      console.log('📝 Using default Roboto font. For Persian support, add Vazir font to public/fonts/');
    }
  } catch (error) {
    console.error('Error loading Vazir font:', error);
  }
};

/**
 * Initialize pdfMake with Persian font support
 * Call this before generating PDFs
 */
export const initializePdfMake = async (): Promise<boolean> => {
  // Ensure default fonts are loaded first
  initializeDefaultFonts();
  
  // Set default font configuration if not already set
  if (!(pdfMake as any).fonts) {
    (pdfMake as any).fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
  }
  
  // Then try to load Persian fonts
  await configurePersianFonts();
  return true;
};

// Export pdfMake instance for use in other modules
export { pdfMake };
