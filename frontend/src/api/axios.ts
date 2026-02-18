import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptors for request/response handling
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as { company_id?: number };
        const existingCompanyHeader = config.headers["X-Company-Id"];
        if (
          typeof user.company_id === "number" &&
          (existingCompanyHeader === undefined || existingCompanyHeader === null)
        ) {
          config.headers["X-Company-Id"] = String(user.company_id);
        }
      } catch {
        // Ignore malformed local storage payload.
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error("Unauthorized - please login");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
