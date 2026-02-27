# Invoice PDF Export Feature

## Overview

This feature allows users to export invoices as professional PDF documents directly from the invoice list. The PDF includes:

- Company header with logo placeholder
- Customer billing information
- Itemized list of products/services with quantities, prices, and discounts
- Total amount calculation
- Terms & conditions footer
- Multi-page support for large invoices
- Professional formatting with proper currency display

## Installation

Before using this feature, install the required npm packages:

```bash
cd frontend
npm install jspdf jspdf-autotable
```

Or if you're using the package.json that's already updated:

```bash
cd frontend
npm install
```

## Files Created/Modified

### New Files:
1. **`src/utils/pdfExport.ts`** - Main PDF generation utility
   - `exportInvoiceToPDF()` - Downloads PDF file
   - `previewInvoicePDF()` - Opens PDF in new tab (preview mode)

### Modified Files:
1. **`package.json`** - Added jspdf dependencies
2. **`src/components/Invoice/InvoiceList.tsx`** - Added PDF export button

## Usage

### In InvoiceList Component

The PDF export button is automatically added to each invoice row in the actions column:

```tsx
<IconButton
  size="small"
  onClick={() => handleExportPDF(invoice)}
  color="success"
  title="دانلود PDF"
>
  <PictureAsPdf fontSize="small" />
</IconButton>
```

### Direct Usage in Other Components

You can use the PDF export utility in any component:

```tsx
import { exportInvoiceToPDF } from '../utils/pdfExport';
import { Invoice, Customer, Company, InvoiceItem } from '../types';

// In your component
const handlePDFExport = () => {
  const invoiceData = {
    invoice: myInvoice,        // Invoice object
    customer: myCustomer,      // Customer object
    company: myCompany,        // Company object
    items: myInvoiceItems,     // Array of InvoiceItem
  };

  exportInvoiceToPDF(invoiceData);
};
```

### Preview Mode (Optional)

To preview the PDF in a new browser tab instead of downloading:

```tsx
import { previewInvoicePDF } from '../utils/pdfExport';

const handlePDFPreview = () => {
  const invoiceData = {
    invoice: myInvoice,
    customer: myCustomer,
    company: myCompany,
    items: myInvoiceItems,
  };

  previewInvoicePDF(invoiceData);
};
```

## PDF Layout

### Header Section
- Company name (centered, bold, large font)
- Company address, phone, email (if available)
- "INVOICE" title
- Invoice number, date, due date, status

### Customer Information
- "Bill To" section
- Customer name
- Address
- Phone
- Email

### Items Table
- Columns: #, Description, Qty, Unit Price, Discount, Total
- Striped rows for readability
- Automatic pagination for many items
- Professional blue header (#2e5090)

### Totals Section
- Subtotal
- Total Amount (bold)
- Horizontal line separator

### Footer
- Terms & Conditions
- Payment instructions
- "Thank you for your business!" message
- Page numbers
- Generation date

## Features

### Multi-Page Support
- Automatically handles invoices with many items
- Page numbers on each page
- Consistent header/footer across pages

### Currency Formatting
- Properly formatted numbers with 2 decimal places
- Thousand separators (e.g., 1,234.56)

### Date Formatting
- Uses Persian date format via `formatDateToPersian()` utility
- Configurable date display

### Error Handling
- Validates invoice has items before export
- Alerts user if customer/company data missing
- Automatically fetches missing invoice items if needed

## Customization

### Company Logo
To add a company logo, modify the `addHeader` function in `pdfExport.ts`:

```typescript
// Add after company name
if (company.logo_url) {
  doc.addImage(company.logo_url, 'PNG', 14, 10, 30, 15);
}
```

### Colors/Styling
Customize colors in `pdfExport.ts`:

```typescript
headStyles: {
  fillColor: [46, 80, 144], // RGB for header background
  textColor: [255, 255, 255], // White text
}
```

### Terms & Conditions
Edit the `addFooter` function to customize terms:

```typescript
doc.text("• Your custom term here", 14, footerY + 6);
```

### Page Size
Change paper size in PDF creation:

```typescript
const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4", // Can be: "a4", "letter", "legal", etc.
});
```

## API Integration

The PDF export feature integrates with your existing invoice API:

```typescript
// If invoice items aren't loaded, automatically fetch them
if (!invoice.items || invoice.items.length === 0) {
  invoiceWithItems = await invoiceAPI.getById(invoice.id);
}
```

## Troubleshooting

### PDF Not Downloading
- Check browser console for errors
- Ensure all required data (invoice, customer, company, items) is present
- Verify jsPDF packages are installed

### Missing Data in PDF
- Verify invoice has items: `invoice.items.length > 0`
- Check customer and company objects are properly loaded
- Ensure Redux store has populated data

### Formatting Issues
- Check currency values are numbers, not strings
- Verify date formats are valid
- Ensure text doesn't contain special characters that break PDF rendering

### Installation Errors
If you get module not found errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Example: Complete Integration

```tsx
import React from 'react';
import { IconButton } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { exportInvoiceToPDF } from '../utils/pdfExport';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const MyInvoiceComponent = ({ invoice }) => {
  const customers = useSelector((state: RootState) => state.customers.items);
  const companies = useSelector((state: RootState) => state.companies.items);

  const handleExport = async () => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const company = companies.find(c => c.id === invoice.company_id);

    if (!customer || !company) {
      alert('Missing customer or company data');
      return;
    }

    if (!invoice.items || invoice.items.length === 0) {
      alert('Invoice has no items');
      return;
    }

    try {
      exportInvoiceToPDF({
        invoice,
        customer,
        company,
        items: invoice.items,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF');
    }
  };

  return (
    <IconButton onClick={handleExport} color="success">
      <PictureAsPdf />
    </IconButton>
  );
};

export default MyInvoiceComponent;
```

## Future Enhancements

Potential improvements you could add:

1. **Email Integration** - Send PDF directly via email
2. **Custom Templates** - Multiple PDF layouts to choose from
3. **Batch Export** - Export multiple invoices at once
4. **Cloud Storage** - Save PDFs to cloud storage automatically
5. **Digital Signatures** - Add signature fields for approval
6. **Watermarks** - Add "PAID" or "DRAFT" watermarks based on status
7. **QR Codes** - Add QR codes for payment links
8. **Multi-language** - Support for RTL languages like Persian/Arabic

## Support

For issues or questions, refer to:
- jsPDF documentation: https://github.com/parallax/jsPDF
- jsPDF-AutoTable: https://github.com/simonbengtsson/jsPDF-AutoTable
