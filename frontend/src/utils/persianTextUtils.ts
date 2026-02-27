/**
 * Persian Text Utilities for PDF Export
 * Handles Persian text rendering in jsPDF which doesn't natively support RTL/Persian
 */

/**
 * Reverse Persian text for proper RTL display in PDF
 * jsPDF doesn't support RTL/Arabic shaping, so we reverse the text manually
 */
export const reversePersianText = (text: string): string => {
  // Split by spaces to preserve word boundaries
  const words = text.split(' ');
  
  // Reverse the order of words
  const reversedWords = words.reverse();
  
  // Join back together
  return reversedWords.join(' ');
};

/**
 * Prepare Persian text for PDF rendering
 * This function handles the limitations of jsPDF with Persian text
 */
export const preparePersianForPDF = (text: string): string => {
  if (!text) return '';
  
  // For now, reverse the text for RTL display
  // In production, you would use arabic-reshaper or a similar library
  return reversePersianText(text);
};

/**
 * Map of Persian characters to their isolated forms (for better display)
 * This is a simplified version - for production use a proper Arabic shaping library
 */
const PERSIAN_ISOLATED_FORMS: Record<string, string> = {
  'ا': '\uFE8D',
  'ب': '\uFE8F',
  'پ': '\uFB56',
  'ت': '\uFE95',
  'ث': '\uFE99',
  'ج': '\uFE9D',
  'چ': '\uFB7A',
  'ح': '\uFEA1',
  'خ': '\uFEA5',
  'د': '\uFEA9',
  'ذ': '\uFEAB',
  'ر': '\uFEAD',
  'ز': '\uFEAF',
  'ژ': '\uFB8A',
  'س': '\uFEB1',
  'ش': '\uFEB5',
  'ص': '\uFEB9',
  'ض': '\uFEBD',
  'ط': '\uFEC1',
  'ظ': '\uFEC5',
  'ع': '\uFEC9',
  'غ': '\uFECD',
  'ف': '\uFED1',
  'ق': '\uFED5',
  'ک': '\uFED9',
  'گ': '\uFB92',
  'ل': '\uFEDD',
  'م': '\uFEE1',
  'ن': '\uFEE5',
  'و': '\uFEED',
  'ه': '\uFEEB',
  'ی': '\uFEF1',
};

/**
 * Convert Persian text to isolated forms for better PDF display
 */
export const toIsolatedForms = (text: string): string => {
  return text.split('').map(char => PERSIAN_ISOLATED_FORMS[char] || char).join('');
};

/**
 * Main function to process Persian text for PDF
 * Combines isolated forms and text reversal
 */
export const processPersianTextForPDF = (text: string): string => {
  if (!text) return '';
  
  // Convert to isolated forms for better character display
  const isolated = toIsolatedForms(text);
  
  // Reverse for RTL display
  return isolated.split('').reverse().join('');
};
