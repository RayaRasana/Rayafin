import axiosInstance from "./axios";
import { Product } from "../types";

const companyHeader = (companyId: number) => ({
  headers: {
    "X-Company-Id": String(companyId),
  },
});

export interface ProductSearchResult {
  id: number;
  name: string;
  sku?: string;
  unit_price: number;
}

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

  /**
   * Search products by name or code (SKU) with autocomplete.
   * Returns max 10 results.
   * Used in invoice form for product input autocomplete.
   * 
   * @param q Search query (min 1 char)
   * @param companyId Company context
   * @returns List of matching products with id, name, sku, unit_price
   */
  search: async (q: string, companyId: number) => {
    const response = await axiosInstance.get<ProductSearchResult[]>(
      "/products/search-suggestions",
      {
        ...companyHeader(companyId),
        params: { q: q.trim() },
      }
    );
    return response.data;
  },

  /**
   * Get product by exact SKU code match.
   * Used when user enters product code and presses Enter or blurs field.
   * 
   * @param code Product SKU/code
   * @param companyId Company context
   * @returns Product with id, name, sku, unit_price
   * @throws 404 if not found
   */
  getByCode: async (code: string, companyId: number) => {
    const response = await axiosInstance.get<ProductSearchResult>(
      `/products/by-code/${encodeURIComponent(code.trim())}`,
      companyHeader(companyId)
    );
    return response.data;
  },
};
