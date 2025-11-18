import { useState, useCallback } from "react";
import api from "@/lib/api";

export type TransactionType = "revenu" | "depense";
export type FrequencyType = "mensuel" | "trimestriel" | "annuel";

export interface RecurringOperation {
  id: number;
  description: string;
  type: TransactionType;
  amount: number;
  frequency: FrequencyType;
  due_day: number;
  account_id: number | null;
  transaction_category_id: number | null;
  next_due_date: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations chargées
  account?: {
    id: number;
    name: string;
    type: string;
  };
  category?: {
    id: number;
    name: string;
    type: TransactionType;
  };
}

export interface CreateRecurringOperationData {
  description: string;
  type: TransactionType;
  amount: number;
  frequency: FrequencyType;
  due_day: number;
  account_id?: number | null;
  transaction_category_id?: number | null;
}

export interface UpdateRecurringOperationData
  extends Partial<CreateRecurringOperationData> {}

interface UseRecurringOperationReturn {
  // State
  operations: RecurringOperation[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchOperations: () => Promise<void>;
  createOperation: (
    data: CreateRecurringOperationData
  ) => Promise<RecurringOperation>;
  updateOperation: (
    id: number,
    data: UpdateRecurringOperationData
  ) => Promise<RecurringOperation>;
  deleteOperation: (id: number) => Promise<void>;
  executeOperation: (id: number) => Promise<Transaction>;

  // Utilitaires
  clearError: () => void;
  getOperationById: (id: number) => RecurringOperation | undefined;
  getOperationsByType: (type: TransactionType) => RecurringOperation[];
  getUpcomingOperations: (days?: number) => RecurringOperation[];
  getOperationsByFrequency: (frequency: FrequencyType) => RecurringOperation[];
}

export const useRecurringOperation = (): UseRecurringOperationReturn => {
  const [operations, setOperations] = useState<RecurringOperation[]>([]);
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

  const fetchOperations = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await api.get("/recurring-operations");
      setOperations(response.data.data);
    } catch (error: any) {
      handleError(
        error,
        "Erreur lors du chargement des opérations récurrentes"
      );
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const createOperation = useCallback(
    async (data: CreateRecurringOperationData): Promise<RecurringOperation> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post("/recurring-operations", data);
        const newOperation = response.data.data;

        setOperations((prev) => [...prev, newOperation]);
        return newOperation;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la création de l'opération récurrente"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const updateOperation = useCallback(
    async (
      id: number,
      data: UpdateRecurringOperationData
    ): Promise<RecurringOperation> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/recurring-operations/${id}`, data);
        const updatedOperation = response.data.data;

        setOperations((prev) =>
          prev.map((operation) =>
            operation.id === id ? updatedOperation : operation
          )
        );
        return updatedOperation;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la mise à jour de l'opération récurrente"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const deleteOperation = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/recurring-operations/${id}`);

        setOperations((prev) =>
          prev.filter((operation) => operation.id !== id)
        );
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la suppression de l'opération récurrente"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const executeOperation = useCallback(
    async (id: number): Promise<any> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post(`/recurring-operations/${id}/execute`);
        return response.data.data;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de l'exécution de l'opération");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const getOperationById = useCallback(
    (id: number): RecurringOperation | undefined => {
      return operations.find((operation) => operation.id === id);
    },
    [operations]
  );

  const getOperationsByType = useCallback(
    (type: TransactionType): RecurringOperation[] => {
      return operations.filter((operation) => operation.type === type);
    },
    [operations]
  );

  const getUpcomingOperations = useCallback(
    (days: number = 7): RecurringOperation[] => {
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + days);

      return operations.filter((operation) => {
        if (!operation.next_due_date) return false;

        const dueDate = new Date(operation.next_due_date);
        return dueDate <= thresholdDate && dueDate >= today;
      });
    },
    [operations]
  );

  const getOperationsByFrequency = useCallback(
    (frequency: FrequencyType): RecurringOperation[] => {
      return operations.filter(
        (operation) => operation.frequency === frequency
      );
    },
    [operations]
  );

  return {
    operations,
    loading,
    error,
    fetchOperations,
    createOperation,
    updateOperation,
    deleteOperation,
    executeOperation,
    clearError,
    getOperationById,
    getOperationsByType,
    getUpcomingOperations,
    getOperationsByFrequency,
  };
};
