/**
 * Persian Invoice PDF Export Utility
 * Generates PDF invoices with full Persian/Farsi language support
 * Includes RTL layout, Persian fonts, and Persian number formatting
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatPersianNumber, formatPersianCurrency, toPersianDigits } from './persianNumbers';
import { loadVazirFont } from './fontLoader';

// Process Persian text for PDF (reverses for RTL display)
const processPersianTextForPDF = (text: string): string => {
  if (!text) return '';
  return text.split('').reverse().join('');
};

// Persian labels for invoice
const PERSIAN_LABELS = {
  invoice: 'فاکتور فروش',
  invoiceNumber: 'شماره فاکتور',
  invoiceDate: 'تاریخ صدور',
  dueDate: 'سررسید',
  status: 'وضعیت',
  customerInfo: 'مشخصات مشتری',
  customerName: 'نام مشتری',
  customerPhone: 'تلفن',
  customerEmail: 'ایمیل',
  customerAddress: 'آدرس',
  items: 'اقلام فاکتور',
  row: 'ردیف',
  productName: 'نام کالا/خدمت',
  productCode: 'کد کالا',
  quantity: 'تعداد',
  unitPrice: 'قیمت واحد',
  discount: 'تخفیف',
  tax: 'مالیات',
  totalPrice: 'مبلغ کل',
  subtotal: 'جمع کل',
  totalDiscount: 'جمع تخفیف',
  totalTax: 'جمع مالیات',
  finalAmount: 'مبلغ قابل پرداخت',
  notes: 'یادداشت‌ها',
  footer: 'این فاکتور توسط سیستم حسابداری صادر شده است',
  paid: 'پرداخت شده',
  pending: 'در انتظار پرداخت',
  cancelled: 'لغو شده',
  overdue: 'سررسید گذشته',
  rial: 'ریال',
};

// Status mapping
const STATUS_MAP: Record<string, string> = {
  PAID: PERSIAN_LABELS.paid,
  PENDING: PERSIAN_LABELS.pending,
  CANCELLED: PERSIAN_LABELS.cancelled,
  OVERDUE: PERSIAN_LABELS.overdue,
};

interface InvoiceItem {
  id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
}

interface Customer {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Invoice {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  total_discount: number;
  total_tax: number;
  final_amount: number;
  notes?: string;
  company_name?: string;
}

/**
 * Setup Persian font
 * Attempts to load Vazir font, falls back to Times if unavailable
 */
const setupPersianFont = async (doc: jsPDF): Promise<boolean> => {
  // Try to load Vazir font from public/fonts directory
  const fontLoaded = await loadVazirFont(doc);
  
  if (!fontLoaded) {
    // Fallback to Times which has better Unicode support than Helvetica
    doc.setFont('times', 'normal');
    console.warn('Vazir font not found. Using fallback font. Place Vazir-Regular-FD.ttf in public/fonts/ for proper Persian support.');
  }
  
  doc.setLanguage('fa');
  return fontLoaded;
};

/**
 * Format Persian date from ISO string
 */
const formatPersianDateFromISO = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return toPersianDigits(`${year}/${month}/${day}`);
};

/**
 * Add invoice header with company info
 */
const addPersianHeader = (doc: jsPDF, invoice: Invoice) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company name (if available)
  if (invoice.company_name) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const companyText = processPersianTextForPDF(invoice.company_name);
    const companyWidth = doc.getTextWidth(companyText);
    doc.text(companyText, pageWidth - companyWidth - 20, 20);
  }
  
  // Invoice title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const title = processPersianTextForPDF(PERSIAN_LABELS.invoice);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - titleWidth - 20, 35);
  
  // Add line separator
  doc.setLineWidth(0.5);
  doc.line(20, 40, pageWidth - 20, 40);
};

/**
 * Add invoice metadata (number, date, status)
 */
const addInvoiceMetadata = (doc: jsPDF, invoice: Invoice): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 50;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const metadata = [
    { label: PERSIAN_LABELS.invoiceNumber, value: toPersianDigits(invoice.invoice_number) },
    { label: PERSIAN_LABELS.invoiceDate, value: formatPersianDateFromISO(invoice.issue_date) },
    { label: PERSIAN_LABELS.dueDate, value: formatPersianDateFromISO(invoice.due_date) },
    { label: PERSIAN_LABELS.status, value: STATUS_MAP[invoice.status] || invoice.status },
  ];
  
  metadata.forEach((item) => {
    const processedLabel = processPersianTextForPDF(item.label + ':');
    const processedValue = item.value;
    const labelWidth = doc.getTextWidth(processedLabel);
    const valueWidth = doc.getTextWidth(processedValue);
    
    // Right-aligned label and value
    doc.setFont('helvetica', 'bold');
    doc.text(processedLabel, pageWidth - labelWidth - valueWidth - 25, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(processedValue, pageWidth - valueWidth - 20, yPos);
    
    yPos += 7;
  });
  
  return yPos + 5;
};

/**
 * Add customer information section
 */
const addCustomerInfo = (doc: jsPDF, invoice: Invoice, startY: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;
  
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const titleText = processPersianTextForPDF(PERSIAN_LABELS.customerInfo);
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, pageWidth - titleWidth - 20, yPos);
  
  yPos += 8;
  
  // Customer details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const customerDetails = [
    { label: PERSIAN_LABELS.customerName, value: invoice.customer.name },
    { label: PERSIAN_LABELS.customerPhone, value: invoice.customer.phone ? toPersianDigits(invoice.customer.phone) : '-' },
    { label: PERSIAN_LABELS.customerEmail, value: invoice.customer.email || '-' },
    { label: PERSIAN_LABELS.customerAddress, value: invoice.customer.address || '-' },
  ];
  
  customerDetails.forEach((item) => {
    if (item.value && item.value !== '-') {
      const processedLabel = processPersianTextForPDF(item.label + ':');
      const processedValue = item.label === PERSIAN_LABELS.customerName || item.label === PERSIAN_LABELS.customerAddress 
        ? processPersianTextForPDF(item.value)
        : item.value;
      const labelWidth = doc.getTextWidth(processedLabel);
      const valueWidth = doc.getTextWidth(processedValue);
      
      doc.setFont('helvetica', 'bold');
      doc.text(processedLabel, pageWidth - labelWidth - valueWidth - 25, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.text(processedValue, pageWidth - valueWidth - 20, yPos);
      
      yPos += 6;
    }
  });
  
  return yPos + 5;
};

/**
 * Add items table
 */
const addItemsTable = (doc: jsPDF, invoice: Invoice, startY: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Prepare table data with Persian numbers
  const tableData = invoice.items.map((item, index) => [
    toPersianDigits(index + 1), // Row number
    processPersianTextForPDF(item.product_name),
    toPersianDigits(item.product_code),
    formatPersianNumber(item.quantity),
    formatPersianCurrency(item.unit_price, 'ریال', false),
    formatPersianCurrency(item.discount_amount, 'ریال', false),
    formatPersianCurrency(item.tax_amount, 'ریال', false),
    formatPersianCurrency(item.total_price, 'ریال', false),
  ]);
  
  // Column headers
  const headers = [
    [
      processPersianTextForPDF(PERSIAN_LABELS.row),
      processPersianTextForPDF(PERSIAN_LABELS.productName),
      processPersianTextForPDF(PERSIAN_LABELS.productCode),
      processPersianTextForPDF(PERSIAN_LABELS.quantity),
      processPersianTextForPDF(PERSIAN_LABELS.unitPrice),
      processPersianTextForPDF(PERSIAN_LABELS.discount),
      processPersianTextForPDF(PERSIAN_LABELS.tax),
      processPersianTextForPDF(PERSIAN_LABELS.totalPrice),
    ]
  ];
  
  // Generate table with RTL support
  (doc as any).autoTable({
    startY: startY,
    head: headers,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      font: 'helvetica',
      fontStyle: 'bold',
      halign: 'right',
    },
    bodyStyles: {
      fontSize: 9,
      font: 'helvetica',
      halign: 'right',
      textColor: 50,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' }, // Row number
      1: { cellWidth: 'auto' }, // Product name
      2: { cellWidth: 25 }, // Product code
      3: { cellWidth: 20, halign: 'center' }, // Quantity
      4: { cellWidth: 30 }, // Unit price
      5: { cellWidth: 25 }, // Discount
      6: { cellWidth: 25 }, // Tax
      7: { cellWidth: 35 }, // Total
    },
    margin: { right: 20, left: 20 },
    didDrawPage: function() {
      // Add page numbers
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      const pageText = processPersianTextForPDF(`صفحه ${toPersianDigits(pageNum)}`);
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, (pageWidth - pageTextWidth) / 2, doc.internal.pageSize.getHeight() - 10);
    },
  });
  
  return (doc as any).lastAutoTable.finalY + 10;
};

/**
 * Add totals section
 */
const addTotalsSection = (doc: jsPDF, invoice: Invoice, startY: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;
  
  doc.setFontSize(11);
  
  const totals = [
    { label: PERSIAN_LABELS.subtotal, value: formatPersianCurrency(invoice.subtotal), bold: false },
    { label: PERSIAN_LABELS.totalDiscount, value: formatPersianCurrency(invoice.total_discount), bold: false },
    { label: PERSIAN_LABELS.totalTax, value: formatPersianCurrency(invoice.total_tax), bold: false },
    { label: PERSIAN_LABELS.finalAmount, value: formatPersianCurrency(invoice.final_amount), bold: true },
  ];
  
  totals.forEach((item) => {
    if (item.bold) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
    }
    
    const processedLabel = processPersianTextForPDF(item.label + ':');
    const labelWidth = doc.getTextWidth(processedLabel);
    const valueWidth = doc.getTextWidth(item.value);
    
    // Draw background for final amount
    if (item.bold) {
      doc.setFillColor(240, 240, 240);
      doc.rect(pageWidth - labelWidth - valueWidth - 35, yPos - 5, labelWidth + valueWidth + 15, 10, 'F');
    }
    
    doc.text(processedLabel, pageWidth - labelWidth - valueWidth - 25, yPos);
    doc.text(item.value, pageWidth - valueWidth - 20, yPos);
    
    yPos += item.bold ? 12 : 8;
  });
  
  return yPos + 5;
};

/**
 * Add notes section
 */
const addNotes = (doc: jsPDF, invoice: Invoice, startY: number): number => {
  if (!invoice.notes || invoice.notes.trim() === '') {
    return startY;
  }
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const notesTitle = processPersianTextForPDF(PERSIAN_LABELS.notes + ':');
  const titleWidth = doc.getTextWidth(notesTitle);
  doc.text(notesTitle, pageWidth - titleWidth - 20, yPos);
  
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Split notes into lines to fit width
  const maxWidth = pageWidth - 40;
  const processedNotes = processPersianTextForPDF(invoice.notes);
  const lines = doc.splitTextToSize(processedNotes, maxWidth);
  
  lines.forEach((line: string) => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, pageWidth - lineWidth - 20, yPos);
    yPos += 5;
  });
  
  return yPos + 5;
};

/**
 * Add footer
 */
const addFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  
  const footerText = processPersianTextForPDF(PERSIAN_LABELS.footer);
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 20);
};

/**
 * Export invoice to PDF in Persian
 * @param invoice - Invoice data
 * @param download - If true, downloads the file; if false, opens in new tab
 */
export const exportPersianInvoiceToPDF = async (invoice: Invoice, download: boolean = true): Promise<void> => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Setup Persian font (async - waits for font to load if available)
  await setupPersianFont(doc);
  
  // Add header
  addPersianHeader(doc, invoice);
  
  // Add invoice metadata
  let yPos = addInvoiceMetadata(doc, invoice);
  
  // Add customer info
  yPos = addCustomerInfo(doc, invoice, yPos);
  
  // Add items table
  yPos = addItemsTable(doc, invoice, yPos);
  
  // Add totals
  yPos = addTotalsSection(doc, invoice, yPos);
  
  // Add notes if any
  addNotes(doc, invoice, yPos);
  
  // Add footer
  addFooter(doc);
  
  // Generate filename
  const filename = `فاکتور_${toPersianDigits(invoice.invoice_number)}.pdf`;
  
  // Output
  if (download) {
    doc.save(filename);
  } else {
    window.open(doc.output('bloburl'), '_blank');
  }
};

/**
 * Preview invoice PDF in new tab (Persian)
 */
export const previewPersianInvoicePDF = async (invoice: Invoice): Promise<void> => {
  await exportPersianInvoiceToPDF(invoice, false);
};
