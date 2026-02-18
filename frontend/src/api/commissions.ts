import axiosInstance from "./axios";
import { Commission } from "../types";

interface BackendCommission {
  id: number;
  invoice_id: number;
  user_id: number;
  company_id: number;
  base_amount: number;
  percent: number;
  commission_amount: number;
  status: "pending" | "approved" | "paid";
  created_at: string;
  updated_at: string;
}

const mapBackendCommission = (commission: BackendCommission): Commission => ({
  id: commission.id,
  invoice_id: commission.invoice_id,
  user_id: commission.user_id,
  base_amount: Number(commission.base_amount),
  commission_percent: Number(commission.percent),
  commission_amount: Number(commission.commission_amount),
  status: commission.status,
  created_at: commission.created_at,
  updated_at: commission.updated_at,
});

export const commissionAPI = {
  getAll: async (invoiceId?: number, userId?: number) => {
    let url = "/commissions";
    const params = new URLSearchParams();
    if (invoiceId) params.append("invoice_id", invoiceId.toString());
    if (userId) params.append("user_id", userId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await axiosInstance.get<BackendCommission[]>(url);
    return response.data.map(mapBackendCommission);
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<BackendCommission>(
      `/commissions/${id}`
    );
    return mapBackendCommission(response.data);
  },

  create: async (
    data: Omit<Commission, "id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post<BackendCommission>(
      "/commissions",
      {
        invoice_id: data.invoice_id,
        user_id: data.user_id,
        percent: data.commission_percent,
        commission_amount: data.commission_amount,
      }
    );
    return mapBackendCommission(response.data);
  },

  update: async (
    id: number,
    data: Partial<Omit<Commission, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<BackendCommission>(
      `/commissions/${id}`,
      {
        percent: data.commission_percent,
        commission_amount: data.commission_amount,
      }
    );
    return mapBackendCommission(response.data);
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/commissions/${id}`);
  },

  createSnapshot: async (invoiceId: number) => {
    const response = await axiosInstance.post<BackendCommission[]>(
      `/invoices/${invoiceId}/create-commission-snapshot`
    );
    return response.data.map(mapBackendCommission);
  },

  approve: async (commissionId: number) => {
    const response = await axiosInstance.post<BackendCommission>(
      `/commissions/${commissionId}/approve`
    );
    return mapBackendCommission(response.data);
  },

  markPaid: async (commissionId: number) => {
    const response = await axiosInstance.post<BackendCommission>(
      `/commissions/${commissionId}/mark-paid`
    );
    return mapBackendCommission(response.data);
  },
};
