// src/lib/axios.ts
import axios from "axios";
import { toast } from "react-toastify";

// Create the instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Replace with your Env Variable
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("Token", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      localStorage.clear();
      location.replace("/");
      alert("Đã hết phiên đăng nhập, vui lòng đăng nhập lại");
      // Logic to redirect to login
    }
    return Promise.reject(error);
  }
);
