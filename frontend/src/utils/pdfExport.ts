import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice, InvoiceItem, Customer, Company } from "../types";
import { formatDateToPersian } from "./dateUtils";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface InvoicePDFData {
  invoice: Invoice;
  customer: Customer;
  company: Company;
  items: InvoiceItem[];
}

/**
 * Format number with thousand separators and decimal places
 */
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Get status label in Persian
 */
const getStatusLabel = (status: Invoice["status"]): string => {
  const statusMap: Record<Invoice["status"], string> = {
    draft: "پیش‌نویس",
    sent: "ارسال شده",
    paid: "پرداخت شده",
    overdue: "معوق",
  };
  return statusMap[status] || status;
};

/**
 * Add header to PDF with company and invoice information
 */
const addHeader = (
  doc: jsPDF,
  company: Company,
  invoice: Invoice,
  pageNumber: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (company.address) {
    doc.text(company.address, pageWidth / 2, 28, { align: "center" });
  }
  if (company.phone || company.email) {
    const contact = [company.phone, company.email].filter(Boolean).join(" | ");
    doc.text(contact, pageWidth / 2, 34, { align: "center" });
  }
  
  // Invoice title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth / 2, 45, { align: "center" });
  
  // Invoice details box
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const detailsY = 55;
  
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, detailsY);
  doc.text(`Date: ${formatDateToPersian(invoice.invoice_date)}`, 14, detailsY + 6);
  doc.text(`Due Date: ${formatDateToPersian(invoice.due_date)}`, 14, detailsY + 12);
  doc.text(`Status: ${getStatusLabel(invoice.status)}`, 14, detailsY + 18);
  
  // Add page number if not first page
  if (pageNumber > 1) {
    doc.setFontSize(8);
    doc.text(`Page ${pageNumber}`, pageWidth - 14, 10, { align: "right" });
  }
  
  return detailsY + 25;
};

/**
 * Add customer information section
 */
const addCustomerInfo = (doc: jsPDF, customer: Customer, startY: number) => {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, startY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let currentY = startY + 7;
  
  doc.text(customer.name, 14, currentY);
  currentY += 6;
  
  if (customer.address) {
    doc.text(customer.address, 14, currentY);
    currentY += 6;
  }
  
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, 14, currentY);
    currentY += 6;
  }
  
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, 14, currentY);
    currentY += 6;
  }
  
  return currentY + 5;
};

/**
 * Add items table to PDF
 */
const addItemsTable = (
  doc: jsPDF,
  items: InvoiceItem[],
  startY: number
) => {
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    formatCurrency(item.quantity),
    formatCurrency(item.unit_price),
    formatCurrency(item.discount),
    formatCurrency(item.total_amount),
  ]);
  
  autoTable(doc, {
    startY: startY,
    head: [["#", "Description", "Qty", "Unit Price", "Discount", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [46, 80, 144], // #2e5090
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: any) => {
      // Add footer on each page
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        data.settings.margin.left,
        pageHeight - 10
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.getWidth() - 14,
        pageHeight - 10,
        { align: "right" }
      );
    },
  });
  
  return doc.lastAutoTable.finalY;
};

/**
 * Add totals section
 */
const addTotals = (doc: jsPDF, invoice: Invoice, startY: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightMargin = 14;
  const labelX = pageWidth - 70;
  const valueX = pageWidth - rightMargin;
  
  let currentY = startY + 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Subtotal (if needed, can calculate from items)
  doc.text("Subtotal:", labelX, currentY);
  doc.text(formatCurrency(invoice.total_amount), valueX, currentY, {
    align: "right",
  });
  currentY += 8;
  
  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total Amount:", labelX, currentY);
  doc.text(formatCurrency(invoice.total_amount), valueX, currentY, {
    align: "right",
  });
  
  // Add a line above total
  doc.setLineWidth(0.5);
  doc.line(labelX, currentY - 3, valueX, currentY - 3);
  
  return currentY + 10;
};

/**
 * Add footer with terms and conditions
 */
const addFooter = (doc: jsPDF, startY: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.max(startY + 15, pageHeight - 40);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions:", 14, footerY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("• Payment is due within 30 days from the invoice date.", 14, footerY + 6);
  doc.text("• Late payments may incur additional charges.", 14, footerY + 11);
  doc.text("• Please include invoice number with your payment.", 14, footerY + 16);
  
  // Thank you message
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text("Thank you for your business!", pageWidth / 2, footerY + 26, {
    align: "center",
  });
};

/**
 * Main function to export invoice as PDF
 */
export const exportInvoiceToPDF = (data: InvoicePDFData): void => {
  const { invoice, customer, company, items } = data;
  
  // Validate data
  if (!items || items.length === 0) {
    throw new Error("Invoice must have at least one item");
  }
  
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  let currentY = 0;
  
  // Add header
  currentY = addHeader(doc, company, invoice, 1);
  
  // Add customer information
  currentY = addCustomerInfo(doc, customer, currentY);
  
  // Add items table
  currentY = addItemsTable(doc, items, currentY);
  
  // Add totals
  currentY = addTotals(doc, invoice, currentY);
  
  // Add footer
  addFooter(doc, currentY);
  
  // Generate filename
  const filename = `Invoice_${invoice.invoice_number}_${new Date().getTime()}.pdf`;
  
  // Download the PDF
  doc.save(filename);
};

/**
 * Preview invoice PDF in new tab (optional feature)
 */
export const previewInvoicePDF = (data: InvoicePDFData): void => {
  const { invoice, customer, company, items } = data;
  
  if (!items || items.length === 0) {
    throw new Error("Invoice must have at least one item");
  }
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  let currentY = 0;
  currentY = addHeader(doc, company, invoice, 1);
  currentY = addCustomerInfo(doc, customer, currentY);
  currentY = addItemsTable(doc, items, currentY);
  currentY = addTotals(doc, invoice, currentY);
  addFooter(doc, currentY);
  
  // Open in new tab
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
