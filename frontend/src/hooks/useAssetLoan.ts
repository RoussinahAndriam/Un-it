import { useState, useCallback } from "react";
import api from "@/lib/api";

export type LoanStatus = "en_cours" | "termine";

export interface AssetLoan {
  id: number;
  asset_id: number;
  user_id: number;
  loan_date: string;
  due_date: string | null;
  return_date: string | null;
  status: LoanStatus;
  signature: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations chargées
  asset?: {
    id: number;
    name: string;
    serial_number: string | null;
    status: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateAssetLoanData {
  asset_id: number;
  user_id: number;
  loan_date: string;
  due_date?: string | null;
  signature?: string | null;
}

export interface UpdateAssetLoanData extends Partial<CreateAssetLoanData> {
  return_date?: string | null;
  status?: LoanStatus;
}

interface UseAssetLoanReturn {
  // State
  loans: AssetLoan[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchLoans: (filters?: LoanFilters) => Promise<void>;
  createLoan: (data: CreateAssetLoanData) => Promise<AssetLoan>;
  updateLoan: (id: number, data: UpdateAssetLoanData) => Promise<AssetLoan>;
  deleteLoan: (id: number) => Promise<void>;
  returnLoan: (id: number, returnDate: string) => Promise<AssetLoan>;

  // Utilitaires
  clearError: () => void;
  getLoanById: (id: number) => AssetLoan | undefined;
  getLoansByStatus: (status: LoanStatus) => AssetLoan[];
  getActiveLoans: () => AssetLoan[];
  getOverdueLoans: () => AssetLoan[];
  getUserLoans: (userId: number) => AssetLoan[];
}

export interface LoanFilters {
  status?: LoanStatus;
  user_id?: number;
  asset_id?: number;
}

export const useAssetLoan = (): UseAssetLoanReturn => {
  const [loans, setLoans] = useState<AssetLoan[]>([]);
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

  const fetchLoans = useCallback(
    async (filters?: LoanFilters): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        const params = new URLSearchParams();
        if (filters?.status) params.append("status", filters.status);
        if (filters?.user_id)
          params.append("user_id", filters.user_id.toString());
        if (filters?.asset_id)
          params.append("asset_id", filters.asset_id.toString());

        const response = await api.get(`/asset-loans?${params.toString()}`);
        setLoans(response.data.data);
      } catch (error: any) {
        handleError(error, "Erreur lors du chargement des prêts");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const createLoan = useCallback(
    async (data: CreateAssetLoanData): Promise<AssetLoan> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post("/asset-loans", data);
        const newLoan = response.data.data;

        setLoans((prev) => [...prev, newLoan]);
        return newLoan;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la création du prêt");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const updateLoan = useCallback(
    async (id: number, data: UpdateAssetLoanData): Promise<AssetLoan> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/asset-loans/${id}`, data);
        const updatedLoan = response.data.data;

        setLoans((prev) =>
          prev.map((loan) => (loan.id === id ? updatedLoan : loan))
        );
        return updatedLoan;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la mise à jour du prêt");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const deleteLoan = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/asset-loans/${id}`);

        setLoans((prev) => prev.filter((loan) => loan.id !== id));
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la suppression du prêt");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const returnLoan = useCallback(
    async (id: number, returnDate: string): Promise<AssetLoan> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/asset-loans/${id}/return`, {
          return_date: returnDate,
          status: "termine",
        });
        const returnedLoan = response.data.data;

        setLoans((prev) =>
          prev.map((loan) => (loan.id === id ? returnedLoan : loan))
        );
        return returnedLoan;
      } catch (error: any) {
        throw handleError(error, "Erreur lors du retour du matériel");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const getLoanById = useCallback(
    (id: number): AssetLoan | undefined => {
      return loans.find((loan) => loan.id === id);
    },
    [loans]
  );

  const getLoansByStatus = useCallback(
    (status: LoanStatus): AssetLoan[] => {
      return loans.filter((loan) => loan.status === status);
    },
    [loans]
  );

  const getActiveLoans = useCallback((): AssetLoan[] => {
    return getLoansByStatus("en_cours");
  }, [getLoansByStatus]);

  const getOverdueLoans = useCallback((): AssetLoan[] => {
    const today = new Date().toISOString().split("T")[0];
    return loans.filter(
      (loan) =>
        loan.status === "en_cours" && loan.due_date && loan.due_date < today
    );
  }, [loans]);

  const getUserLoans = useCallback(
    (userId: number): AssetLoan[] => {
      return loans.filter((loan) => loan.user_id === userId);
    },
    [loans]
  );

  return {
    loans,
    loading,
    error,
    fetchLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    returnLoan,
    clearError,
    getLoanById,
    getLoansByStatus,
    getActiveLoans,
    getOverdueLoans,
    getUserLoans,
  };
};
