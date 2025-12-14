// hooks/useApplication.ts
import { useState, useCallback } from "react";
import api from "@/lib/api";

export type ApplicationStatus = "active" | "expired" | "suspended" | "pending";
export type LicenseType = "subscription" | "perpetual" | "trial" | null;
export type CreatedBy = "company" | "external";

export interface Account {
  id: number;
  name: string;
  type: "bancaire" | "mobile_money" | "especes" | "autre";
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  name: string;
  cost: number;
  user_id: number | null;
  license_type: LicenseType;
  current_users: number;
  max_users: number | null;
  purchase_date: string | null;
  renewal_date: string | null;
  status: ApplicationStatus;
  account_id: number | null;
  account?: Account;
  created_by: CreatedBy;
  created_at?: string;
  updated_at?: string;
}

export interface CreateApplicationData {
  name: string;
  cost: number;
  user_id?: number | null;
  license_type: LicenseType;
  current_users?: number;
  max_users?: number | null;
  purchase_date?: string | null;
  renewal_date?: string | null;
  status?: ApplicationStatus;
  account_id?: number | null;
  has_license?: boolean;
  created_by?: CreatedBy;
}

export interface UpdateApplicationData extends Partial<CreateApplicationData> {}

interface UseApplicationReturn {
  // State
  applications: Application[];
  accounts: Account[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchApplications: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  createApplication: (data: CreateApplicationData) => Promise<Application>;
  updateApplication: (
    id: number,
    data: UpdateApplicationData
  ) => Promise<Application>;
  deleteApplication: (id: number) => Promise<void>;
  linkToAccount: (
    applicationId: number,
    accountId: number
  ) => Promise<Application>;

  // Utilitaires
  clearError: () => void;
  getApplicationById: (id: number) => Application | undefined;
  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
  getApplicationsByLicenseType: (licenseType: LicenseType) => Application[];
  getApplicationsByCreationType: (type: CreatedBy) => Application[];
  getApplicationsByAccount: (accountId: number) => Application[];
  getTotalCost: () => number;
  getExpiringApplications: (days?: number) => Application[];
}

export const useApplication = (): UseApplicationReturn => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = (error: any, defaultMessage: string) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      defaultMessage;

    setError(message);
    console.error(`❌ ${defaultMessage}:`, error);
    throw new Error(message);
  };

  // Récupérer tous les comptes
  const fetchAccounts = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get("/accounts");
      setAccounts(response.data.data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des comptes:", error);
    }
  }, []);

  // Récupérer toutes les applications
  const fetchApplications = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await api.get("/applications");
      setApplications(response.data.data);
    } catch (error: any) {
      handleError(error, "Erreur lors du chargement des applications");
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Créer une application
  const createApplication = useCallback(
    async (data: CreateApplicationData): Promise<Application> => {
      try {
        setLoading(true);
        clearError();

        // Déterminer si l'application a une licence
        const hasLicense = data.has_license || !!data.license_type;

        // Préparer les données avec created_by automatique
        const applicationData = {
          ...data,
          current_users: data.current_users || 0,
          status: data.status || "active",
          created_by: hasLicense ? "external" : "company",
          license_type: hasLicense ? data.license_type : null,
          // Lier automatiquement au premier compte si aucun spécifié
          account_id: data.account_id || accounts[0]?.id || null,
        };

        // Supprimer le champ has_license
        delete applicationData.has_license;

        const response = await api.post("/applications", applicationData);
        const newApplication = response.data.data;

        setApplications((prev) => [...prev, newApplication]);
        return newApplication;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la création de l'application");
      } finally {
        setLoading(false);
      }
    },
    [clearError, accounts]
  );

  // Mettre à jour une application
  const updateApplication = useCallback(
    async (id: number, data: UpdateApplicationData): Promise<Application> => {
      try {
        setLoading(true);
        clearError();

        // Mettre à jour created_by si license_type est modifié
        if (data.license_type !== undefined) {
          data.created_by = data.license_type ? "external" : "company";
        }

        // Supprimer has_license si présent
        if (data.has_license !== undefined) {
          delete data.has_license;
        }

        const response = await api.put(`/applications/${id}`, data);
        const updatedApplication = response.data.data;

        setApplications((prev) =>
          prev.map((app) => (app.id === id ? updatedApplication : app))
        );
        return updatedApplication;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la mise à jour de l'application"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // Supprimer une application
  const deleteApplication = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/applications/${id}`);

        setApplications((prev) => prev.filter((app) => app.id !== id));
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la suppression de l'application"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // Lier une application à un compte
  const linkToAccount = useCallback(
    async (applicationId: number, accountId: number): Promise<Application> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post(
          `/applications/${applicationId}/link-account`,
          {
            account_id: accountId,
          }
        );
        const updatedApplication = response.data.data;

        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? updatedApplication : app
          )
        );
        return updatedApplication;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la liaison au compte");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // Récupérer une application par ID
  const getApplicationById = useCallback(
    (id: number): Application | undefined => {
      return applications.find((app) => app.id === id);
    },
    [applications]
  );

  // Récupérer les applications par statut
  const getApplicationsByStatus = useCallback(
    (status: ApplicationStatus): Application[] => {
      return applications.filter((app) => app.status === status);
    },
    [applications]
  );

  // Récupérer les applications par type de licence
  const getApplicationsByLicenseType = useCallback(
    (licenseType: LicenseType): Application[] => {
      return applications.filter((app) => app.license_type === licenseType);
    },
    [applications]
  );

  // Récupérer les applications par type de création
  const getApplicationsByCreationType = useCallback(
    (type: CreatedBy): Application[] => {
      return applications.filter((app) => app.created_by === type);
    },
    [applications]
  );

  // Récupérer les applications par compte
  const getApplicationsByAccount = useCallback(
    (accountId: number): Application[] => {
      return applications.filter((app) => app.account_id === accountId);
    },
    [applications]
  );

  // Calculer le coût total
  const getTotalCost = useCallback((): number => {
    return applications.reduce((sum, app) => sum + Number(app.cost || 0), 0);
  }, [applications]);

  // Récupérer les applications qui expirent bientôt
  const getExpiringApplications = useCallback(
    (days: number = 30): Application[] => {
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + days);

      return applications.filter((app) => {
        if (!app.renewal_date || app.status !== "active") return false;

        const renewalDate = new Date(app.renewal_date);
        return renewalDate <= thresholdDate && renewalDate >= today;
      });
    },
    [applications]
  );

  return {
    // State
    applications,
    accounts,
    loading,
    error,

    // Actions
    fetchApplications,
    fetchAccounts,
    createApplication,
    updateApplication,
    deleteApplication,
    linkToAccount,

    // Utilitaires
    clearError,
    getApplicationById,
    getApplicationsByStatus,
    getApplicationsByLicenseType,
    getApplicationsByCreationType,
    getApplicationsByAccount,
    getTotalCost,
    getExpiringApplications,
  };
};
