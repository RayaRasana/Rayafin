import axiosInstance from "./axios";
import { User } from "../types";

interface BackendUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: "OWNER" | "ACCOUNTANT" | "SALES";
  company_id?: number;
  created_at: string;
  updated_at: string;
}

interface UserCreatePayload {
  email: string;
  full_name: string;
  password: string;
}

interface UserUpdatePayload {
  email?: string;
  full_name?: string;
  password?: string;
}

const mapBackendUser = (user: BackendUser): User => ({
  id: user.id,
  username: user.email.split("@")[0] || user.email,
  email: user.email,
  full_name: user.full_name,
  role: user.role,
  company_id: user.company_id,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

export const userAPI = {
  getAll: async () => {
    const response = await axiosInstance.get<BackendUser[]>("/users");
    return response.data.map(mapBackendUser);
  },

  getById: async (id: number) => {
    const response = await axiosInstance.get<BackendUser>(`/users/${id}`);
    return mapBackendUser(response.data);
  },

  create: async (data: UserCreatePayload) => {
    const response = await axiosInstance.post<BackendUser>("/users", data);
    return mapBackendUser(response.data);
  },

  update: async (id: number, data: UserUpdatePayload) => {
    const response = await axiosInstance.put<BackendUser>(`/users/${id}`, data);
    return mapBackendUser(response.data);
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/users/${id}`);
  },

  assignToCompany: async (userId: number, companyId: number) => {
    const response = await axiosInstance.post<User>(
      `/users/${userId}/assign-company`,
      { company_id: companyId }
    );
    return response.data;
  },
};
