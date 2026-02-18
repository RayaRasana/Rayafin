import axiosInstance from "./axios";
import { Commission } from "../types";

export const commissionAPI = {
  getAll: async (invoiceId?: number, userId?: number) => {
    let url = "/commissions/";
    const params = new URLSearchParams();
    if (invoiceId) params.append("invoice_id", invoiceId.toString());
    if (userId) params.append("user_id", userId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await axiosInstance.get<Commission[]>(url);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<Commission>(`/commissions/${id}/`);
    return response.data;
  },

  create: async (
    data: Omit<Commission, "id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post<Commission>("/commissions/", data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Commission, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<Commission>(
      `/commissions/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/commissions/${id}/`);
  },

  createSnapshot: async (invoiceId: number) => {
    const response = await axiosInstance.post<Commission[]>(
      `/invoices/${invoiceId}/create-commission-snapshot/`
    );
    return response.data;
  },
};
