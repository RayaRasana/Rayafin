/**
 * Working Persian Invoice PDF Export
 * Uses English labels with Persian/Farsi numbers as a practical workaround
 * This version works immediately without requiring font installation
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatPersianNumber, formatPersianCurrency, toPersianDigits } from './persianNumbers';

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

const STATUS_MAP: Record<string, string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};

/**
 * Format date
 */
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return toPersianDigits(`${year}/${month}/${day}`);
};

export const exportWorkingPersianPDF = (invoice: Invoice, download: boolean = true): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const title = 'INVOICE / فاکتور';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPos);
  
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Company name
  if (invoice.company_name) {
    doc.setFontSize(14);
    doc.text(invoice.company_name, 20, yPos);
    yPos += 8;
  }

  // Invoice metadata
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Invoice #: ${toPersianDigits(invoice.invoice_number)}`, 20, yPos);
  yPos += 6;
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, 20, yPos);
  yPos += 6;
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 20, yPos);
  yPos += 6;
  doc.text(`Status: ${STATUS_MAP[invoice.status] || invoice.status}`, 20, yPos);
  yPos += 10;

  // Customer info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, yPos);
  yPos += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${invoice.customer.name}`, 20, yPos);
  yPos += 5;
  if (invoice.customer.phone) {
    doc.text(`Phone: ${toPersianDigits(invoice.customer.phone)}`, 20, yPos);
    yPos += 5;
  }
  if (invoice.customer.email) {
    doc.text(`Email: ${invoice.customer.email}`, 20, yPos);
    yPos += 5;
  }
  if (invoice.customer.address) {
    doc.text(`Address: ${invoice.customer.address}`, 20, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Items table
  const tableData = invoice.items.map((item, index) => [
    toPersianDigits(index + 1),
    item.product_name,
    toPersianDigits(item.product_code),
    formatPersianNumber(item.quantity),
    formatPersianCurrency(item.unit_price, 'ریال', false),
    formatPersianCurrency(item.discount_amount, 'ریال', false),
    formatPersianCurrency(item.tax_amount, 'ریال', false),
    formatPersianCurrency(item.total_price, 'ریال', false),
  ]);

  (doc as any).autoTable({
    startY: yPos,
    head: [['#', 'Product', 'Code', 'Qty', 'Price', 'Discount', 'Tax', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 30 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const totalsX = pageWidth - 70;
  doc.text(`Subtotal: ${formatPersianCurrency(invoice.subtotal)}`, totalsX, yPos);
  yPos += 6;
  doc.text(`Discount: ${formatPersianCurrency(invoice.total_discount)}`, totalsX, yPos);
  yPos += 6;
  doc.text(`Tax: ${formatPersianCurrency(invoice.total_tax)}`, totalsX, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setFillColor(240, 240, 240);
  doc.rect(totalsX - 5, yPos - 5, 65, 10, 'F');
  doc.text(`TOTAL: ${formatPersianCurrency(invoice.final_amount)}`, totalsX, yPos);

  // Notes
  if (invoice.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(lines, 20, yPos);
  }

  // Filename
  const filename = `Invoice_${invoice.invoice_number}.pdf`;

  if (download) {
    doc.save(filename);
  } else {
    window.open(doc.output('bloburl'), '_blank');
  }
};
