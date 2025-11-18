import { useState, useCallback } from "react";
import api from "@/lib/api";

export type TransactionType = "revenu" | "depense";

export interface Transaction {
  id: number;
  account_id: number;
  transaction_category_id: number | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
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

export interface CreateTransactionData {
  account_id: number;
  transaction_category_id?: number | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  transaction_date: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {}

interface UseTransactionReturn {
  // State
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<Transaction>;
  updateTransaction: (
    id: number,
    data: UpdateTransactionData
  ) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<void>;

  // Utilitaires
  clearError: () => void;
  getTransactionById: (id: number) => Transaction | undefined;
  getTransactionsByAccount: (accountId: number) => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByDateRange: (
    startDate: string,
    endDate: string
  ) => Transaction[];
  getMonthlySummary: (year: number, month: number) => MonthlySummary;
  getAnnualSummary: (year: number) => AnnualSummary;
}

export interface TransactionFilters {
  type?: TransactionType;
  account_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface MonthlySummary {
  total_revenue: number;
  total_expense: number;
  balance: number;
  transactions: Transaction[];
}

export interface AnnualSummary {
  monthly_data: {
    month: number;
    revenue: number;
    expense: number;
    balance: number;
  }[];
  total_revenue: number;
  total_expense: number;
  annual_balance: number;
}

export const useTransaction = (): UseTransactionReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const fetchTransactions = useCallback(
    async (filters?: TransactionFilters): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        const params = new URLSearchParams();
        if (filters?.type) params.append("type", filters.type);
        if (filters?.account_id)
          params.append("account_id", filters.account_id.toString());
        if (filters?.category_id)
          params.append("category_id", filters.category_id.toString());
        if (filters?.start_date)
          params.append("start_date", filters.start_date);
        if (filters?.end_date) params.append("end_date", filters.end_date);

        const response = await api.get(`/transactions?${params.toString()}`);
        setTransactions(response.data.data);
      } catch (error: any) {
        handleError(error, "Erreur lors du chargement des transactions");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const createTransaction = useCallback(
    async (data: CreateTransactionData): Promise<Transaction> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post("/transactions", data);
        const newTransaction = response.data.data;

        setTransactions((prev) => [...prev, newTransaction]);
        return newTransaction;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la création de la transaction"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const updateTransaction = useCallback(
    async (id: number, data: UpdateTransactionData): Promise<Transaction> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/transactions/${id}`, data);
        const updatedTransaction = response.data.data;

        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === id ? updatedTransaction : transaction
          )
        );
        return updatedTransaction;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la mise à jour de la transaction"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const deleteTransaction = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/transactions/${id}`);

        setTransactions((prev) =>
          prev.filter((transaction) => transaction.id !== id)
        );
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la suppression de la transaction"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const getTransactionById = useCallback(
    (id: number): Transaction | undefined => {
      return transactions.find((transaction) => transaction.id === id);
    },
    [transactions]
  );

  const getTransactionsByAccount = useCallback(
    (accountId: number): Transaction[] => {
      return transactions.filter(
        (transaction) => transaction.account_id === accountId
      );
    },
    [transactions]
  );

  const getTransactionsByType = useCallback(
    (type: TransactionType): Transaction[] => {
      return transactions.filter((transaction) => transaction.type === type);
    },
    [transactions]
  );

  const getTransactionsByDateRange = useCallback(
    (startDate: string, endDate: string): Transaction[] => {
      return transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.transaction_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return transactionDate >= start && transactionDate <= end;
      });
    },
    [transactions]
  );

  const getMonthlySummary = useCallback(
    (year: number, month: number): MonthlySummary => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const monthlyTransactions = getTransactionsByDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      let total_revenue = 0;
      let total_expense = 0;

      for (const t of monthlyTransactions) {
        const amount = Number(t.amount); // ✅ conversion explicite en nombre

        if (t.type === "revenu") {
          total_revenue += amount;
        } else if (t.type === "depense") {
          total_expense += amount;
        }
      }

      return {
        total_revenue,
        total_expense,
        balance: total_revenue - total_expense,
        transactions: monthlyTransactions,
      };
    },
    [getTransactionsByDateRange]
  );

  const getAnnualSummary = useCallback(
    (year: number): AnnualSummary => {
      const monthlyData = Array.from({ length: 12 }, (_, month) => {
        const summary = getMonthlySummary(year, month + 1);
        return {
          month: month + 1,
          revenue: summary.total_revenue,
          expense: summary.total_expense,
          balance: summary.balance,
        };
      });

      const total_revenue = monthlyData.reduce(
        (sum, data) => sum + data.revenue,
        0
      );
      const total_expense = monthlyData.reduce(
        (sum, data) => sum + data.expense,
        0
      );

      return {
        monthly_data: monthlyData,
        total_revenue,
        total_expense,
        annual_balance: total_revenue - total_expense,
      };
    },
    [getMonthlySummary]
  );

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearError,
    getTransactionById,
    getTransactionsByAccount,
    getTransactionsByType,
    getTransactionsByDateRange,
    getMonthlySummary,
    getAnnualSummary,
  };
};
