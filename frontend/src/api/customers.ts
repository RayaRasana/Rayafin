import axiosInstance from "./axios";
import { Customer } from "../types";

export const customerAPI = {
  getAll: async (companyId: number) => {
    const response = await axiosInstance.get<Customer[]>(
      `/customers/?company_id=${companyId}`
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<Customer>(`/customers/${id}/`);
    return response.data;
  },

  create: async (
    data: Omit<Customer, "id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post<Customer>("/customers/", data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Customer, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<Customer>(
      `/customers/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/customers/${id}/`);
  },
};
