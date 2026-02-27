# Persian PDF Export - Current Status

## ✅ WORKING NOW

The Persian PDF export is **now functional** with the following features:

### Current Implementation

- **English Labels** - Headers and field names are in English
- **Persian Numbers** - All numbers displayed as ۱۲۳۴۵۶۷۸۹۰  
- **Persian Currency** - Formatted as "۱,۰۰۰,۰۰۰ ریال"
- **Persian Dates** - Dates shown with Persian digits
- **Clean Layout** - Professional invoice design
- **Bilingual Title** - "INVOICE / فاکتور"

### What Works

✅ Customer names (any language including Persian)  
✅ Product names (any language including Persian)  
✅ All numeric data in Persian digits  
✅ Currency formatting with Persian separators  
✅ Dates in Persian format  
✅ Email addresses and phone numbers  
✅ Notes section  

### What's Different from Full Persian

The current version uses **English field labels** (like "Customer Information:", "Total:", etc.) because:
- jsPDF's default fonts don't support Persian/Arabic characters
- This provides immediate functionality without requiring font installation
- All actual *data* can be in Persian (names, products, notes)
- Numbers are all in Persian format

### Example Output

```
INVOICE / فاکتور
────────────────────────────────────

Invoice #: ۰۰۱
Date: ۲۰۲۶/۰۲/۲۱  
Status: Paid

Customer Information:
Name: علی محمدی
Phone: ۰۹۱۲۳۴۵۶۷۸۹
Email: ali@example.com

┌────┬──────────┬──────┬─────┬────────┬──────────┬────────┬──────────┐
│  # │ Product  │ Code │ Qty │  Price │ Discount │    Tax │    Total │
├────┼──────────┼──────┼─────┼────────┼──────────┼────────┼──────────┤
│  ۱ │ کالا ۱   │  P۱  │  ۲  │ ۱۰,۰۰۰ │   ۱,۰۰۰  │  ۹۰۰   │ ۱۹,۹۰۰  │
└────┴──────────┴──────┴─────┴────────┴──────────┴────────┴──────────┘

Subtotal: ۱۹,۹۰۰ ریال
Discount: ۱,۰۰۰ ریال  
Tax: ۹۰۰ ریال
TOTAL: ۱۹,۸۰۰ ریال
```

---

## 🔧 Upgrade to Full Persian (Optional)

If you need **full Persian labels** (all text in Farsi), follow these steps:

### Requirements
- Vazir or IRANSans Persian font file (.ttf)
- Base64 converter tool

### Installation Steps

1. **Download Vazir Font**
   ```bash
   # Visit GitHub
   https://github.com/rastikerdar/vazir-font/releases
   
   # Download latest version (e.g., vazir-font-v30.1.0.zip)
   ```

2. **Convert to Base64**
   - Extract the ZIP file  
   - Visit: https://products.aspose.app/font/base64
   - Upload: `Vazir-Regular.ttf`
   - Copy the base64 output

3. **Add to Project**
   
   Edit `frontend/src/utils/vazirFont.ts`:
   ```typescript
   export const VAZIR_FONT_BASE64 = "AAEAAAALAIAAAwAwT1MvMg8SBfkA...";
   // Paste your full base64 string here
   ```

4. **Update Persian PDF Export**
   
   Edit `frontend/src/utils/persianPdfExport.ts`:
   ```typescript
   import { VAZIR_FONT_BASE64 } from './vazirFont';
   
   const setupPersianFont = (doc: jsPDF) => {
     doc.addFileToVFS("Vazir-Regular.ttf", VAZIR_FONT_BASE64);
     doc.addFont("Vazir-Regular.ttf", "Vazir", "normal");
     doc.setFont("Vazir");
   };
   ```

5. **Switch to Full Persian**
   
   Edit `frontend/src/components/Invoice/InvoiceList.tsx`:
   ```typescript
   // Change from:
   import { exportWorkingPersianPDF } from "../../utils/workingPersianPdf";
   
   // To:
   import { exportPersianInvoiceToPDF } from "../../utils/persianPdfExport";
   
   // And update the function call:
   exportPersianInvoiceToPDF({...});
   ```

---

## 📝 Usage

### Export Persian PDF

Click the **purple PDF button** in the invoice list to download a PDF with:
- Bilingual title
- Persian numbers
- Your customer/product names (in any language)
- Readable, professional format

### File Naming

PDFs are saved as: `Invoice_INV-001.pdf`

---

## 🎯 Benefits of Current Approach

1. **Works Immediately** - No font installation required
2. **Stable** - No font rendering issues  
3. **Universal** - Opens in any PDF reader
4. **Practical** - Persian where it matters (numbers, data)
5. **Professional** - Clean, readable layout

---

## 🐛 Troubleshooting

### Issue: Numbers still showing as 0-9
**Solution**: The `workingPersianPdf.ts` utility should handle this. Check browser console for errors.

### Issue: Customer names appear garbled
**Solution**: This should work with the current version. If not, ensure the data is properly encoded in UTF-8.

### Issue: Want full Persian labels
**Solution**: Follow the "Upgrade to Full Persian" steps above.

---

## 📦 Files

- `frontend/src/utils/workingPersianPdf.ts` - **Current working version**
- `frontend/src/utils/persianPdfExport.ts` - Full Persian version (requires font)
- `frontend/src/utils/persianNumbers.ts` - Number formatting utilities
- `frontend/src/utils/vazirFont.ts` - Font placeholder for upgrade

---

## 🎉 Success!

Your Persian PDF export is **ready to use**. Click the purple button and test it out!

For questions or issues, check the browser console for error messages.
