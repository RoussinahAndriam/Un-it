import api from "@/lib/api"; // Votre instance axios existante
import { User, UserRole } from "@/hooks/useUsers";

export interface SecuritySettings {
  password_min_length: number;
  password_requires_numbers: boolean;
  password_requires_special_chars: boolean;
  max_login_attempts: number;
  session_timeout: number;
}

export interface AppSettings {
  site_name: string;
  maintenance_mode: boolean;
  max_users: number;
  email_notifications: boolean;
}

export const adminAPI = {
  // Sécurité
  getSecurityLogs: () => api.get("/admin/security/logs"),
  updatePasswordPolicy: (policy: Partial<SecuritySettings>) =>
    api.post("/admin/security/password-policy", policy),

  // Paramètres
  getSettings: () => api.get<{ data: AppSettings }>("/admin/settings"),
  updateSettings: (settings: Partial<AppSettings>) =>
    api.put("/admin/settings", settings),

  // Utilisateurs (utilise votre hook existant)
  resetPassword: (userId: number, password: string) =>
    api.post(`/admin/users/${userId}/reset-password`, { password }),
};
