import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    console.log(
      "[api interceptor] Request:",
      config.method?.toUpperCase(),
      config.url,
    );
    console.log("[api interceptor] Has token:", !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data) {
      console.log("[api interceptor] Request body:", config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log(
      "[api interceptor] Response:",
      response.status,
      response.statusText,
    );
    return response;
  },
  (error) => {
    console.error(
      "[api interceptor] Error:",
      error.response?.status,
      error.response?.statusText,
    );
    console.error("[api interceptor] Error data:", error.response?.data);
    return Promise.reject(error);
  },
);

export default api;
