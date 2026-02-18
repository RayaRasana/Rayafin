import axiosInstance from "./axios";
import { User } from "../types";

export const userAPI = {
  getAll: async () => {
    const response = await axiosInstance.get<User[]>("/users/");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<User>(`/users/${id}/`);
    return response.data;
  },

  create: async (
    data: Omit<User, "id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post<User>("/users/", data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<Omit<User, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await axiosInstance.put<User>(`/users/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/users/${id}/`);
  },

  assignToCompany: async (userId: number, companyId: number) => {
    const response = await axiosInstance.post<User>(
      `/users/${userId}/assign-company/`,
      { company_id: companyId }
    );
    return response.data;
  },
};
