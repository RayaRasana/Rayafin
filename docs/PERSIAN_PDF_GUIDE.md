# راهنمای صدور فاکتور PDF فارسی
# Persian Invoice PDF Export Guide

## Overview

The RR-Accounting application now supports **full Persian/Farsi PDF invoice generation** with:

✅ **Right-to-Left (RTL) Layout** - Proper Persian text direction  
✅ **Persian Numerals** - All numbers displayed as ۱۲۳۴۵۶۷۸۹۰  
✅ **Persian Labels** - Complete Persian translation of invoice fields  
✅ **Persian Currency Formatting** - Rial formatting with thousand separators  
✅ **Professional Styling** - Modern, clean invoice design  

---

## Features

### 1. Persian Number Formatting

The utility includes comprehensive Persian number formatting:

```typescript
import { formatPersianNumber, formatPersianCurrency, toPersianDigits } from './utils/persianNumbers';

// Convert digits: 12345 → ۱۲۳۴۵
formatPersianNumber(12345);  // "۱۲,۳۴۵"

// Currency with Rial: 1000000 → "۱,۰۰۰,۰۰۰ ریال"
formatPersianCurrency(1000000);

// Just digits: "Invoice #123" → "Invoice #۱۲۳"
toPersianDigits("Invoice #123");
```

### 2. PDF Invoice Components

Each Persian PDF invoice includes:

- **Header**: Company name + "فاکتور فروش" title
- **Metadata**: Invoice number, dates, status (all in Persian)
- **Customer Info**: Name, phone (Persian digits), email, address
- **Items Table**: RTL table with Persian headers
  - ردیف (Row)
  - نام کالا/خدمت (Product Name)
  - کد کالا (Product Code)
  - تعداد (Quantity)
  - قیمت واحد (Unit Price)
  - تخفیف (Discount)
  - مالیات (Tax)
  - مبلغ کل (Total)
- **Totals Section**: Subtotal, discounts, tax, final amount
- **Notes**: Optional Persian notes
- **Footer**: "این فاکتور توسط سیستم حسابداری صادر شده است"

### 3. Status Translation

Invoice statuses are automatically translated:

| English   | Persian (فارسی)      |
|-----------|---------------------|
| PAID      | پرداخت شده          |
| PENDING   | در انتظار پرداخت    |
| CANCELLED | لغو شده             |
| OVERDUE   | سررسید گذشته        |

---

## Usage

### In Invoice List

The **InvoiceList** component now has **two PDF export buttons** for each invoice:

1. **Purple Button (فارسی)** - Persian PDF with RTL layout
2. **Green Button (English)** - Original English PDF

```tsx
// Persian PDF Export
<IconButton
  size="small"
  onClick={() => handleExportPersianPDF(invoice)}
  color="secondary"
  title="دانلود PDF فارسی"
>
  <PictureAsPdf fontSize="small" />
</IconButton>
```

### Programmatic Usage

```typescript
import { exportPersianInvoiceToPDF } from './utils/persianPdfExport';

// Export invoice to Persian PDF
exportPersianInvoiceToPDF({
  invoice_number: "INV-001",
  issue_date: "2024-01-15",
  due_date: "2024-02-15",
  status: "PAID",
  customer: {
    name: "علی محمدی",
    phone: "09123456789",
    email: "ali@example.com",
    address: "تهران، خیابان ولیعصر"
  },
  items: [...],
  subtotal: 1000000,
  total_discount: 50000,
  total_tax: 90000,
  final_amount: 1040000,
  notes: "لطفا مبلغ را تا پایان ماه واریز نمایید",
  company_name: "شرکت نمونه"
}, true); // true = download, false = preview in new tab
```

---

## Files Structure

```
frontend/src/utils/
├── persianNumbers.ts       # Persian number formatting utilities
├── persianPdfExport.ts     # Main Persian PDF generation
├── pdfExport.ts            # Original English PDF (unchanged)
└── persian.ts              # General Persian labels
```

### Key Files:

#### 1. `persianNumbers.ts`
Handles all number conversions:
- `toPersianDigits()` - Convert 123 → ۱۲۳
- `formatPersianNumber()` - Format with separators
- `formatPersianCurrency()` - Add currency unit
- `formatPersianDate()` - Persian date formatting

#### 2. `persianPdfExport.ts`
Main PDF generator with:
- `exportPersianInvoiceToPDF()` - Generate and download/preview
- `previewPersianInvoicePDF()` - Quick preview helper
- Multiple layout functions (header, items table, totals, etc.)

---

## Font Support

### Current Implementation

The PDF uses **Helvetica** (jsPDF default) with RTL text direction. While Helvetica displays Persian characters, for **production use** you should embed a proper Persian font.

### Adding Custom Persian Fonts (Optional Enhancement)

To use fonts like **Vazir**, **IRANSans**, or **Tahoma**:

1. **Download Persian Font**:
   ```bash
   # Example: Vazir font
   wget https://github.com/rastikerdar/vazir-font/releases/download/v30.1.0/vazir-font-v30.1.0.zip
   ```

2. **Convert to Base64** (or load as TTF):
   ```javascript
   import VazirBase64 from './fonts/Vazir-Regular-base64.js';
   
   doc.addFileToVFS('Vazir-Regular.ttf', VazirBase64);
   doc.addFont('Vazir-Regular.ttf', 'Vazir', 'normal');
   doc.setFont('Vazir');
   ```

3. **Update `setupPersianFont()` in persianPdfExport.ts**

---

## Testing

### Test Persian PDF Export

1. **Start Backend**:
   ```bash
   python run_backend.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Create Test Invoice**:
   - Navigate to "فاکتورها" (Invoices)
   - Create a new invoice with Persian customer name
   - Add items

4. **Export PDF**:
   - Click the **purple PDF button** (فارسی)
   - Verify downloaded file: `فاکتور_INV-۰۰۱.pdf`
   - Check RTL layout, Persian numbers, proper formatting

### Expected Output

Filename: `فاکتور_INV-۰۰۱.pdf`

Contents should show:
- All text right-aligned
- Numbers in Persian digits (۰-۹)
- Currency formatted with Persian separators
- Table headers in Persian
- Professional invoice layout

---

## Troubleshooting

### Issue: Persian text appears left-to-right
**Solution**: The text positioning in `persianPdfExport.ts` calculates RTL positions. Ensure you're using `exportPersianInvoiceToPDF()` not `exportInvoiceToPDF()`.

### Issue: Numbers show as English digits
**Solution**: All numeric values should pass through `toPersianDigits()` or `formatPersianNumber()`. Check that the invoice data is being processed by the Persian export function.

### Issue: Font looks incorrect
**Solution**: jsPDF uses Helvetica by default. For better Persian typography, embed a custom Persian font (see Font Support section above).

### Issue: Characters appear disconnected
**Solution**: This is a limitation of non-Persian fonts. Embed a proper Persian font like Vazir or IRANSans for connected letters.

---

## API Reference

### `persianNumbers.ts`

```typescript
// Convert to Persian digits
toPersianDigits(input: number | string): string

// Format with thousand separators
formatPersianNumber(num: number): string

// Format currency with optional unit
formatPersianCurrency(
  amount: number, 
  unit?: 'ریال' | 'تومان', 
  showUnit?: boolean
): string

// Format date
formatPersianDate(dateStr: string): string
```

### `persianPdfExport.ts`

```typescript
// Main export function
exportPersianInvoiceToPDF(
  invoice: Invoice, 
  download?: boolean
): void

// Preview in new tab
previewPersianInvoicePDF(invoice: Invoice): void
```

---

## Customization

### Change Currency Unit

Edit `PERSIAN_LABELS` in `persianPdfExport.ts`:

```typescript
const PERSIAN_LABELS = {
  // ... other labels
  rial: 'تومان',  // Change from 'ریال' to 'تومان'
};
```

### Modify Invoice Layout

All layout functions are modular:

- `addPersianHeader()` - Customize title/company header
- `addInvoiceMetadata()` - Modify metadata section
- `addCustomerInfo()` - Change customer display
- `addItemsTable()` - Customize table columns/styling
- `addTotalsSection()` - Adjust totals layout
- `addFooter()` - Change footer text

### Custom Colors

```typescript
// In addItemsTable() function
headStyles: {
  fillColor: [41, 128, 185], // Change header color (RGB)
  textColor: 255,
  // ...
}
```

---

## Migration from English PDF

Both PDF export options coexist:

| Feature           | English PDF          | Persian PDF                |
|-------------------|----------------------|----------------------------|
| Button Color      | Green                | Purple                     |
| Function          | `exportInvoiceToPDF` | `exportPersianInvoiceToPDF` |
| Text Direction    | LTR                  | RTL                        |
| Numbers           | 0-9                  | ۰-۹                        |
| Language          | English              | فارسی (Farsi)              |

No code changes needed - both buttons work independently.

---

## Future Enhancements

### Potential Improvements:

1. **Persian Calendar (Shamsi/Jalali)**
   - Convert Gregorian dates to Solar Hijri
   - Display as ۱۴۰۲/۱۰/۲۵

2. **Custom Persian Fonts**
   - Embed Vazir, IRANSans, or Yekan fonts
   - Better typography and connected characters

3. **QR Code Integration**
   - Add payment QR codes
   - Invoice verification codes

4. **Email Integration**
   - Send Persian PDFs via email
   - Automated invoice delivery

5. **Print Optimization**
   - A4 precise sizing
   - Print-friendly margins

6. **Watermarks**
   - "پرداخت شده" watermark for paid invoices
   - Company logo overlay

---

## License

This Persian PDF export feature is part of the RR-Accounting system.

---

## Support

For issues or questions:
- Check logs in browser console
- Review invoice data structure
- Verify customer/company data is loaded
- Test with simple invoice first

**Happy Invoicing! 🎉**
**فاکتور خوبی داشته باشید!**
