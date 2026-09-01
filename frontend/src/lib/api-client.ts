import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5099";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("arquiflow.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/api/auth/login");
    const isOnLoginPage = window.location.pathname === "/login";

    if (error.response?.status === 401 && !isLoginRequest && !isOnLoginPage) {
      localStorage.removeItem("arquiflow.token");
      localStorage.removeItem("arquiflow.user");
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?expired=1&from=${from}`;
    }

    return Promise.reject(error);
  }
);

export function resolveFileUrl(path: string) {
  // Local storage returns a relative path ("/uploads/x.jpg"); R2 storage
  // returns an already-absolute public URL — pass that through untouched.
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}
