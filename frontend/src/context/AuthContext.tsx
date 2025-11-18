"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "../lib/api";
import { User } from "../types";
import { useRouter, usePathname } from "next/navigation";

// ========================
// Types
// ========================
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions principales
  login: (data: { email: string; password: string }) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role : string
  }) => Promise<User>;
  logout: () => Promise<void>;

  // OTP / Mot de passe oublié
  sendOtp: (data: { email: string }) => Promise<void>;
  verifyOtp: (data: { email: string; otp: string }) => Promise<void>;
  forgotPassword: (data: { email: string }) => Promise<void>;
  resetPassword: (data: {
    token: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;

  // Utilitaires
  clearError: () => void;
  isAuthenticated: boolean;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  // "/forgot-password",
  // "/reset-password",
  "/verify-email",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const handleError = (error: any, defaultMessage: string) => {
    const message =
      error.response?.data?.message || error.message || defaultMessage;
    setError(message);
    console.error(`❌ ${defaultMessage}:`, error);
    throw error;
  };

  const clearError = useCallback(() => setError(null), []);

  const isAuthenticated = !!user && !!token;

  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("access_token");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      setToken(storedToken);

      const response = await api.get<User>("/user");
      setUser(response.data);
    } catch (error) {
      console.error("❌ Token invalide :", error);
      localStorage.removeItem("access_token");
      delete api.defaults.headers.common["Authorization"];
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isRootRoute = pathname === "/";

    if (isAuthenticated) {
      if (isPublicRoute) {
        router.push("/");
      }
    } else {
      if (!isPublicRoute && !isRootRoute) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (data: {
    email: string;
    password: string;
  }): Promise<User> => {
    try {
      clearError();
      setIsLoading(true);

      const res = await api.post<AuthResponse>("/login", data);
      const { access_token, user } = res.data;

      if (!access_token) {
        throw new Error("Token d'accès non reçu");
      }

      localStorage.setItem("access_token", access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(user);

      return user;
    } catch (error: any) {
      throw handleError(error, "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<User> => {
    try {
      clearError();
      setIsLoading(true);

      const res = await api.post<AuthResponse>("/register", data);
      const { user } = res.data;
      return user;
    } catch (error: any) {
      throw handleError(error, "Erreur d'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (data: { email: string }): Promise<void> => {
    try {
      clearError();
      await api.post("/send-otp", data);
    } catch (error: any) {
      throw handleError(error, "Erreur d'envoi OTP");
    }
  };

  const verifyOtp = async (data: {
    email: string;
    otp: string;
  }): Promise<void> => {
    try {
      clearError();
      await api.post("/verify-otp", data);
    } catch (error: any) {
      throw handleError(error, "Erreur de vérification OTP");
    }
  };

  const forgotPassword = async (data: { email: string }): Promise<void> => {
    try {
      clearError();
      await api.post("/forgot-password", data);
    } catch (error: any) {
      throw handleError(error, "Erreur mot de passe oublié");
    }
  };

  const resetPassword = async (data: {
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> => {
    try {
      clearError();
      await api.post("/reset-password", data);
    } catch (error: any) {
      throw handleError(error, "Erreur de réinitialisation");
    }
  };

  const logout = async (): Promise<void> => {
    try {
      clearError();
      // Appeler l'API de déconnexion si disponible
      await api.post("/logout");
    } catch (error) {
      console.warn("Erreur lors de la déconnexion (ignorée) :", error);
    } finally {
      // Nettoyer les données d'authentification quoi qu'il arrive
      localStorage.removeItem("access_token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setToken(null);
      router.push("/login");
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    clearError,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
