import axiosInstance from "./axios";
import { Invoice, InvoiceItem } from "../types";

interface BackendInvoice {
  id: number;
  invoice_number: string;
  company_id: number;
  customer_id: number;
  sold_by_user_id?: number;
  created_by_user_id?: number;
  status: "draft" | "issued" | "paid";
  total_amount: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

interface BackendInvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_amount: number;
}

const toFrontendStatus = (
  status: BackendInvoice["status"]
): Invoice["status"] => {
  if (status === "issued") {
    return "sent";
  }
  return status;
};

const toBackendStatus = (status: Invoice["status"]): string => {
  if (status === "sent" || status === "overdue") {
    return "issued";
  }
  return status;
};

const mapBackendInvoice = (invoice: BackendInvoice): Invoice => ({
  id: invoice.id,
  company_id: invoice.company_id,
  customer_id: invoice.customer_id,
  invoice_number: invoice.invoice_number,
  invoice_date: invoice.created_at,
  due_date: invoice.created_at,
  total_amount: Number(invoice.total_amount),
  status: toFrontendStatus(invoice.status),
  is_locked: invoice.is_locked,
  created_at: invoice.created_at,
  updated_at: invoice.updated_at,
});

const mapBackendInvoiceItem = (item: BackendInvoiceItem): InvoiceItem => ({
  id: item.id,
  invoice_id: item.invoice_id,
  description: item.description,
  quantity: Number(item.quantity),
  unit_price: Number(item.unit_price),
  discount: Number(item.discount),
  total_amount: Number(item.total_amount),
  created_at: "",
  updated_at: "",
});

export const invoiceAPI = {
  getAll: async (companyId: number) => {
    const response = await axiosInstance.get<BackendInvoice[]>(
      `/invoices?company_id=${companyId}`
    );
    return response.data.map(mapBackendInvoice);
  },

  getById: async (id: number) => {
    const [invoiceResponse, itemsResponse] = await Promise.all([
      axiosInstance.get<BackendInvoice>(`/invoices/${id}`),
      axiosInstance.get<BackendInvoiceItem[]>(`/invoice-items?invoice_id=${id}`),
    ]);

    return {
      ...mapBackendInvoice(invoiceResponse.data),
      items: itemsResponse.data.map(mapBackendInvoiceItem),
    };
  },

  create: async (
    data: Omit<Invoice, "id" | "created_at" | "updated_at" | "items">
  ) => {
    const response = await axiosInstance.post<BackendInvoice>("/invoices", {
      company_id: data.company_id,
      customer_id: data.customer_id,
      invoice_number: data.invoice_number,
      status: toBackendStatus(data.status),
      total_amount: data.total_amount,
    });
    return mapBackendInvoice(response.data);
  },

  update: async (
    id: number,
    data: Partial<Omit<Invoice, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<BackendInvoice>(`/invoices/${id}`, {
      status: data.status ? toBackendStatus(data.status) : undefined,
      total_amount: data.total_amount,
    });
    return mapBackendInvoice(response.data);
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/invoices/${id}`);
  },

  createItem: async (invoiceId: number, data: Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">) => {
    const response = await axiosInstance.post<BackendInvoiceItem>(
      "/invoice-items",
      {
        invoice_id: invoiceId,
        description: data.description,
        quantity: data.quantity,
        unit_price: data.unit_price,
        discount: data.discount,
        total_amount: data.total_amount,
      }
    );
    return mapBackendInvoiceItem(response.data);
  },

  updateItem: async (invoiceId: number, itemId: number, data: Partial<Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">>) => {
    const response = await axiosInstance.put<InvoiceItem>(
      `/invoices/${invoiceId}/items/${itemId}`,
      data
    );
    return response.data;
  },

  deleteItem: async (invoiceId: number, itemId: number) => {
    await axiosInstance.delete(`/invoices/${invoiceId}/items/${itemId}`);
  },

  updateStatus: async (id: number, status: Invoice["status"]) => {
    const response = await axiosInstance.put<BackendInvoice>(`/invoices/${id}`, {
      status: toBackendStatus(status),
    });
    return mapBackendInvoice(response.data);
  },

  lock: async (id: number) => {
    const response = await axiosInstance.post<BackendInvoice>(`/invoices/${id}/lock`);
    return mapBackendInvoice(response.data);
  },

  unlock: async (id: number) => {
    const response = await axiosInstance.post<BackendInvoice>(`/invoices/${id}/unlock`);
    return mapBackendInvoice(response.data);
  },
};
