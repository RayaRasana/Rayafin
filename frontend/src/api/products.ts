import axiosInstance from "./axios";
import { Product } from "../types";

const companyHeader = (companyId: number) => ({
  headers: {
    "X-Company-Id": String(companyId),
  },
});

export const productAPI = {
  getAll: async (companyId: number) => {
    const response = await axiosInstance.get<Product[]>(
      "/products",
      companyHeader(companyId)
    );
    return response.data;
  },

  getById: async (id: number, companyId: number) => {
    const response = await axiosInstance.get<Product>(
      `/products/${id}`,
      companyHeader(companyId)
    );
    return response.data;
  },

  create: async (
    data: Omit<Product, "id" | "created_at" | "updated_at">,
    companyId: number
  ) => {
    const response = await axiosInstance.post<Product>(
      "/products",
      data,
      companyHeader(companyId)
    );
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<Product, "id" | "created_at" | "updated_at">>,
    companyId: number
  ) => {
    const response = await axiosInstance.put<Product>(
      `/products/${id}`,
      data,
      companyHeader(companyId)
    );
    return response.data;
  },

  delete: async (id: number, companyId: number) => {
    await axiosInstance.delete(`/products/${id}`, companyHeader(companyId));
  },

  importFromFile: async (file: File, companyId: number) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{
      success: boolean;
      imported: number;
      errors: string[];
      message: string;
    }>("/products/import", formData, {
      headers: {
        "X-Company-Id": String(companyId),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
