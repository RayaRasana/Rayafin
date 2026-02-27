/**
 * Persian Invoice PDF Generator using pdfmake
 * Supports RTL layout, Persian fonts, and proper Persian text rendering
 */

import { pdfMake, initializePdfMake } from './pdfmakeFonts';
import { formatPersianNumber, formatPersianCurrency, toPersianDigits } from './persianNumbers';

interface InvoiceItem {
  id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
  total_price: number;
}

interface Customer {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface PersianInvoiceData {
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

// Persian labels
const LABELS = {
  invoice: 'فاکتور فروش',
  invoiceNumber: 'شماره فاکتور',
  invoiceDate: 'تاریخ صدور',
  dueDate: 'سررسید',
  status: 'وضعیت',
  customerInfo: 'مشخصات مشتری',
  customerName: 'نام مشتری',
  phone: 'تلفن',
  email: 'ایمیل',
  address: 'آدرس',
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
  rial: 'ریال',
};

// Status mapping
const STATUS_MAP: Record<string, string> = {
  PAID: 'پرداخت شده',
  PENDING: 'در انتظار پرداخت',
  CANCELLED: 'لغو شده',
  OVERDUE: 'سررسید گذشته',
  draft: 'پیش‌نویس',
};

/**
 * Format date to Persian
 */
const formatPersianDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return toPersianDigits(`${year}/${month}/${day}`);
};

/**
 * Create header section
 */
const createHeader = (invoice: PersianInvoiceData): any[] => {
  const headerContent: any[] = [];
  
  // Company name if available
  if (invoice.company_name) {
    headerContent.push({
      text: invoice.company_name,
      style: 'companyName',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Invoice title
  headerContent.push({
    text: LABELS.invoice,
    style: 'header',
    alignment: 'center',
    margin: [0, 0, 0, 5]
  });
  
  // Divider line
  headerContent.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 1,
        lineColor: '#2e5090'
      }
    ],
    margin: [0, 5, 0, 15]
  });
  
  return headerContent;
};

/**
 * Create metadata section
 */
const createMetadata = (invoice: PersianInvoiceData): any => {
  return {
    columns: [
      {
        width: '*',
        text: ''
      },
      {
        width: 'auto',
        stack: [
          {
            text: [
              { text: `${LABELS.invoiceNumber}: `, bold: true },
              { text: toPersianDigits(invoice.invoice_number) }
            ],
            alignment: 'right',
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: `${LABELS.invoiceDate}: `, bold: true },
              { text: formatPersianDate(invoice.issue_date) }
            ],
            alignment: 'right',
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: `${LABELS.dueDate}: `, bold: true },
              { text: formatPersianDate(invoice.due_date) }
            ],
            alignment: 'right',
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: `${LABELS.status}: `, bold: true },
              { text: STATUS_MAP[invoice.status] || invoice.status }
            ],
            alignment: 'right'
          }
        ]
      }
    ],
    margin: [0, 0, 0, 20]
  };
};

/**
 * Create customer information section
 */
const createCustomerInfo = (invoice: PersianInvoiceData): any => {
  const customerLines: any[] = [
    {
      text: LABELS.customerInfo,
      style: 'sectionHeader',
      alignment: 'right',
      margin: [0, 0, 0, 10]
    }
  ];
  
  customerLines.push({
    text: [
      { text: `${LABELS.customerName}: `, bold: true },
      { text: invoice.customer.name }
    ],
    alignment: 'right',
    margin: [0, 0, 0, 5]
  });
  
  if (invoice.customer.phone) {
    customerLines.push({
      text: [
        { text: `${LABELS.phone}: `, bold: true },
        { text: toPersianDigits(invoice.customer.phone) }
      ],
      alignment: 'right',
      margin: [0, 0, 0, 5]
    });
  }
  
  if (invoice.customer.email) {
    customerLines.push({
      text: [
        { text: `${LABELS.email}: `, bold: true },
        { text: invoice.customer.email }
      ],
      alignment: 'right',
      margin: [0, 0, 0, 5]
    });
  }
  
  if (invoice.customer.address) {
    customerLines.push({
      text: [
        { text: `${LABELS.address}: `, bold: true },
        { text: invoice.customer.address }
      ],
      alignment: 'right',
      margin: [0, 0, 0, 5]
    });
  }
  
  return {
    stack: customerLines,
    margin: [0, 0, 0, 20]
  };
};

/**
 * Create items table
 */
const createItemsTable = (invoice: PersianInvoiceData): any => {
  // Table headers
  const headers: any[] = [
    { text: LABELS.totalPrice, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.tax, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.discount, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.unitPrice, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.quantity, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.productCode, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.productName, style: 'tableHeader', alignment: 'center' },
    { text: LABELS.row, style: 'tableHeader', alignment: 'center' }
  ];
  
  // Table rows
  const rows = invoice.items.map((item, index) => [
    { text: formatPersianCurrency(item.total_price, 'ریال', false), alignment: 'center' },
    { text: formatPersianCurrency(item.tax_amount, 'ریال', false), alignment: 'center' },
    { text: formatPersianCurrency(item.discount_amount, 'ریال', false), alignment: 'center' },
    { text: formatPersianCurrency(item.unit_price, 'ریال', false), alignment: 'center' },
    { text: formatPersianNumber(item.quantity), alignment: 'center' },
    { text: toPersianDigits(item.product_code), alignment: 'center' },
    { text: item.product_name, alignment: 'right' },
    { text: toPersianDigits(index + 1), alignment: 'center' }
  ]);
  
  return {
    style: 'itemsTable',
    table: {
      headerRows: 1,
      widths: ['auto', 'auto', 'auto', 'auto', 'auto', 60, '*', 30],
      body: [headers, ...rows]
    },
    layout: {
      fillColor: (rowIndex: number) => {
        return rowIndex === 0 ? '#2e5090' : (rowIndex % 2 === 0 ? '#f5f5f5' : null);
      },
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc'
    },
    margin: [0, 0, 0, 20]
  };
};

/**
 * Create totals section
 */
const createTotals = (invoice: PersianInvoiceData): any => {
  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 200,
        stack: [
          {
            text: [
              { text: `${LABELS.subtotal}: `, bold: true },
              { text: formatPersianCurrency(invoice.subtotal) }
            ],
            alignment: 'right',
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: `${LABELS.totalDiscount}: `, bold: true },
              { text: formatPersianCurrency(invoice.total_discount) }
            ],
            alignment: 'right',
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: `${LABELS.totalTax}: `, bold: true },
              { text: formatPersianCurrency(invoice.total_tax) }
            ],
            alignment: 'right',
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              { text: `${LABELS.finalAmount}: `, bold: true, fontSize: 14 },
              { text: formatPersianCurrency(invoice.final_amount), fontSize: 14 }
            ],
            alignment: 'right',
            background: '#f0f0f0',
            margin: [5, 5, 5, 5]
          }
        ]
      }
    ],
    margin: [0, 0, 0, 20]
  };
};

/**
 * Create notes section
 */
const createNotes = (invoice: PersianInvoiceData): any => {
  if (!invoice.notes) return [];
  
  return {
    stack: [
      {
        text: `${LABELS.notes}:`,
        bold: true,
        alignment: 'right',
        margin: [0, 0, 0, 5]
      },
      {
        text: invoice.notes,
        alignment: 'right',
        margin: [0, 0, 0, 10]
      }
    ],
    margin: [0, 0, 0, 20]
  };
};

/**
 * Create footer
 */
const createFooter = (currentPage: number, pageCount: number): any => {
  return {
    columns: [
      {
        text: toPersianDigits(`صفحه ${currentPage} از ${pageCount}`),
        alignment: 'center',
        fontSize: 9,
        color: '#666666'
      }
    ],
    margin: [0, 10, 0, 0]
  };
};

/**
 * Generate Persian Invoice PDF using pdfmake
 */
export const generatePersianInvoicePDF = async (
  invoice: PersianInvoiceData,
  download: boolean = true
): Promise<void> => {
  // Initialize fonts
  await initializePdfMake();
  
  // Create document definition
  const documentDefinition: any = {
    // Use Vazir font if available, otherwise use Roboto
    defaultStyle: {
      font: 'Vazir',
      fontSize: 11
    },
    
    // Page settings
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    // Document content
    content: [
      ...createHeader(invoice) as any[],
      createMetadata(invoice),
      createCustomerInfo(invoice),
      createItemsTable(invoice),
      createTotals(invoice),
      createNotes(invoice)
    ],
    
    // Footer
    footer: (currentPage: number, pageCount: number) => {
      return createFooter(currentPage, pageCount);
    },
    
    // Styles
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        color: '#2e5090'
      },
      companyName: {
        fontSize: 16,
        bold: true
      },
      sectionHeader: {
        fontSize: 13,
        bold: true,
        color: '#2e5090'
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'white',
        fillColor: '#2e5090'
      },
      itemsTable: {
        margin: [0, 5, 0, 15]
      }
    }
  };
  
  // Generate PDF
  const pdfDocGenerator = (pdfMake as any).createPdf(documentDefinition);
  
  if (download) {
    // Download PDF
    const filename = `فاکتور_${toPersianDigits(invoice.invoice_number)}.pdf`;
    pdfDocGenerator.download(filename);
  } else {
    // Open in new window
    pdfDocGenerator.open();
  }
};

/**
 * Preview Persian Invoice PDF
 */
export const previewPersianInvoicePDF = async (invoice: PersianInvoiceData): Promise<void> => {
  await generatePersianInvoicePDF(invoice, false);
};
