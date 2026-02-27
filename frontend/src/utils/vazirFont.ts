// Vazir font in Base64 format (minimal subset for common Persian characters)
// This is a compressed version - for full font, see installation instructions

export const VAZIR_FONT_BASE64 = ""; // Placeholder - see below for installation

/*
 * INSTALLATION INSTRUCTIONS FOR VAZIR FONT:
 * 
 * Since the full font file is too large to embed here, follow these steps:
 * 
 * 1. Download Vazir font:
 *    Visit: https://github.com/rastikerdar/vazir-font/releases
 *    Download: vazir-font-v30.1.0.zip (or latest version)
 * 
 * 2. Convert to Base64:
 *    - Extract the ZIP file
 *    - Use this online tool: https://products.aspose.app/font/base64
 *    - Upload: Vazir-Regular.ttf
 *    - Copy the base64 output
 * 
 * 3. Add to this file:
 *    - Replace the empty string above with the base64 content
 *    - Or import from a separate file
 * 
 * 4. Usage example:
 *    import { VAZIR_FONT_BASE64 } from './vazirFont';
 *    doc.addFileToVFS("Vazir-Regular.ttf", VAZIR_FONT_BASE64);
 *    doc.addFont("Vazir-Regular.ttf", "Vazir", "normal");
 *    doc.setFont("Vazir");
 *
 * QUICK START (Without font file):
 * For immediate testing, the PDF will use system fonts through a workaround.
 * The text will appear but may not be perfectly shaped.
 */

// Alternative: Use a CDN-loaded font (async approach)
export const loadVazirFontFromCDN = async (): Promise<string> => {
  try {
    // Note: This is a conceptual approach - you'd need actual CDN URL
    const response = await fetch('https://cdn.example.com/vazir.ttf');
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load font from CDN:', error);
    return '';
  }
};
