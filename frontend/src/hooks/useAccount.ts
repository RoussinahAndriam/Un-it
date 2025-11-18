import { useState, useCallback } from "react";
import api from "@/lib/api";

export type AccountType = "bancaire" | "mobile_money" | "especes" | "autre";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAccountData {
  name: string;
  type: AccountType;
  balance: number;
  currency?: string;
}

export interface UpdateAccountData extends Partial<CreateAccountData> {}

interface UseAccountReturn {
  // State
  accounts: Account[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAccounts: () => Promise<void>;
  createAccount: (data: CreateAccountData) => Promise<Account>;
  updateAccount: (id: number, data: UpdateAccountData) => Promise<Account>;
  deleteAccount: (id: number) => Promise<void>;

  // Utilitaires
  clearError: () => void;
  getAccountById: (id: number) => Account | undefined;
  getAccountsByType: (type: AccountType) => Account[];
  getTotalBalance: () => number;
}

export const useAccount = (): UseAccountReturn => {
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
      setLoading(true);
      clearError();

      const response = await api.get("/accounts");
      setAccounts(response.data.data);
    } catch (error: any) {
      handleError(error, "Erreur lors du chargement des comptes");
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Créer un compte
  const createAccount = useCallback(
    async (data: CreateAccountData): Promise<Account> => {
      try {
        setLoading(true);
        clearError();

        const accountData = {
          ...data,
          currency: data.currency || "MGA",
        };

        const response = await api.post("/accounts", accountData);
        const newAccount = response.data.data;

        setAccounts((prev) => [...prev, newAccount]);
        return newAccount;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la création du compte");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // Mettre à jour un compte
  const updateAccount = useCallback(
    async (id: number, data: UpdateAccountData): Promise<Account> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/accounts/${id}`, data);
        const updatedAccount = response.data.data;

        setAccounts((prev) =>
          prev.map((acc) => (acc.id === id ? updatedAccount : acc))
        );
        return updatedAccount;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la mise à jour du compte");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // Supprimer un compte
  const deleteAccount = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/accounts/${id}`);

        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la suppression du compte");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  // Récupérer un compte par ID
  const getAccountById = useCallback(
    (id: number): Account | undefined => {
      return accounts.find((acc) => acc.id === id);
    },
    [accounts]
  );

  // Récupérer les comptes par type
  const getAccountsByType = useCallback(
    (type: AccountType): Account[] => {
      return accounts.filter((acc) => acc.type === type);
    },
    [accounts]
  );

  // Calculer le solde total
  const getTotalBalance = useCallback((): number => {
    return accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
  }, [accounts]);

  return {
    // State
    accounts,
    loading,
    error,

    // Actions
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,

    // Utilitaires
    clearError,
    getAccountById,
    getAccountsByType,
    getTotalBalance,
  };
};
