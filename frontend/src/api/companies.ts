import axiosInstance from "./axios";
import { Company } from "../types";

const companyHeader = (companyId: number) => ({
  headers: {
    "X-Company-Id": String(companyId),
  },
});

export const companyAPI = {
  getAll: async (companyId?: number) => {
    const response = await axiosInstance.get<Company[]>("/companies");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<Company>(
      `/companies/${id}`,
      companyHeader(id)
    );
    return response.data;
  },

  create: async (data: Omit<Company, "id" | "created_at" | "updated_at">) => {
    const response = await axiosInstance.post<Company>("/companies", data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Company, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<Company>(
      `/companies/${id}`,
      data,
      companyHeader(id)
    );
    return response.data;
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/companies/${id}`, companyHeader(id));
  },
};
