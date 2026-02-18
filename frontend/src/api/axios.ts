import axios, { AxiosInstance } from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptors for request/response handling
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth tokens or custom headers here
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
