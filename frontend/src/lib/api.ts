import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// === Intercepteur pour ajouter automatiquement le token ===
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Intercepteur pour gérer les erreurs globales ===
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⛔ Token expiré ou invalide !");
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        window.dispatchEvent(new Event("auth-error"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
