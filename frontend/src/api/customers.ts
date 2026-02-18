import axiosInstance from "./axios";
import { Customer } from "../types";

const companyHeader = (companyId?: number) =>
  companyId ? { headers: { "X-Company-Id": String(companyId) } } : undefined;

export const customerAPI = {
  getAll: async (companyId: number) => {
    const response = await axiosInstance.get<Customer[]>(
      `/customers?company_id=${companyId}`,
      companyHeader(companyId)
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<Customer, "id" | "created_at" | "updated_at">,
    companyId?: number
  ) => {
    const response = await axiosInstance.post<Customer>(
      "/customers",
      data,
      companyHeader(companyId ?? data.company_id)
    );
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Customer, "id" | "created_at" | "updated_at">>,
    companyId?: number
  ) => {
    const response = await axiosInstance.put<Customer>(
      `/customers/${id}`,
      data,
      companyHeader(companyId)
    );
    return response.data;
  },

  delete: async (id: number, companyId?: number) => {
    await axiosInstance.delete(`/customers/${id}`, companyHeader(companyId));
  },
};
