import { useState, useCallback } from "react";
import api from "@/lib/api";

export type TransactionType = "revenu" | "depense";

export interface TransactionCategory {
  id: number;
  name: string;
  type: TransactionType;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransactionCategoryData {
  name: string;
  type: TransactionType;
}

export interface UpdateTransactionCategoryData
  extends Partial<CreateTransactionCategoryData> {}

interface UseTransactionCategoryReturn {
  // State
  categories: TransactionCategory[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  createCategory: (
    data: CreateTransactionCategoryData
  ) => Promise<TransactionCategory>;
  updateCategory: (
    id: number,
    data: UpdateTransactionCategoryData
  ) => Promise<TransactionCategory>;
  deleteCategory: (id: number) => Promise<void>;

  // Utilitaires
  clearError: () => void;
  getCategoryById: (id: number) => TransactionCategory | undefined;
  getCategoriesByType: (type: TransactionType) => TransactionCategory[];
}

export const useTransactionCategory = (): UseTransactionCategoryReturn => {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
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

  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await api.get("/transaction-categories");
      setCategories(response.data.data);
    } catch (error: any) {
      handleError(error, "Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const createCategory = useCallback(
    async (
      data: CreateTransactionCategoryData
    ): Promise<TransactionCategory> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post("/transaction-categories", data);
        const newCategory = response.data.data;

        setCategories((prev) => [...prev, newCategory]);
        return newCategory;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la création de la catégorie");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const updateCategory = useCallback(
    async (
      id: number,
      data: UpdateTransactionCategoryData
    ): Promise<TransactionCategory> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/transaction-categories/${id}`, data);
        const updatedCategory = response.data.data;

        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? updatedCategory : cat))
        );
        return updatedCategory;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la mise à jour de la catégorie"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const deleteCategory = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/transaction-categories/${id}`);

        setCategories((prev) => prev.filter((cat) => cat.id !== id));
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la suppression de la catégorie"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const getCategoryById = useCallback(
    (id: number): TransactionCategory | undefined => {
      return categories.find((cat) => cat.id === id);
    },
    [categories]
  );

  const getCategoriesByType = useCallback(
    (type: TransactionType): TransactionCategory[] => {
      return categories.filter((cat) => cat.type === type);
    },
    [categories]
  );

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    getCategoryById,
    getCategoriesByType,
  };
};
