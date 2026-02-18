// Types for the accounting system
export interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_id: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  company_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  company_id?: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  company_id: number;
  customer_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: number;
  invoice_id: number;
  user_id: number;
  commission_percent: number;
  commission_amount: number;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// Redux Store Types
export interface CompanyState {
  items: Company[];
  selectedCompany: Company | null;
  loading: boolean;
  error: string | null;
}

export interface CustomerState {
  items: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
}

export interface UserState {
  items: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

export interface InvoiceState {
  items: Invoice[];
  selectedInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
}

export interface CommissionState {
  items: Commission[];
  selectedCommission: Commission | null;
  loading: boolean;
  error: string | null;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}
