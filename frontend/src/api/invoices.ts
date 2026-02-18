import axiosInstance from "./axios";
import { Invoice, InvoiceItem } from "../types";

export const invoiceAPI = {
  getAll: async (companyId: number) => {
    const response = await axiosInstance.get<Invoice[]>(
      `/invoices/?company_id=${companyId}`
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<Invoice>(`/invoices/${id}/`);
    return response.data;
  },

  create: async (
    data: Omit<Invoice, "id" | "created_at" | "updated_at" | "items">
  ) => {
    const response = await axiosInstance.post<Invoice>("/invoices/", data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Invoice, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<Invoice>(`/invoices/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/invoices/${id}/`);
  },

  createItem: async (invoiceId: number, data: Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">) => {
    const response = await axiosInstance.post<InvoiceItem>(
      `/invoices/${invoiceId}/items/`,
      data
    );
    return response.data;
  },

  updateItem: async (invoiceId: number, itemId: number, data: Partial<Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">>) => {
    const response = await axiosInstance.put<InvoiceItem>(
      `/invoices/${invoiceId}/items/${itemId}/`,
      data
    );
    return response.data;
  },

  deleteItem: async (invoiceId: number, itemId: number) => {
    await axiosInstance.delete(`/invoices/${invoiceId}/items/${itemId}/`);
  },

  updateStatus: async (id: number, status: Invoice["status"]) => {
    const response = await axiosInstance.patch<Invoice>(
      `/invoices/${id}/`,
      { status }
    );
    return response.data;
  },
};
