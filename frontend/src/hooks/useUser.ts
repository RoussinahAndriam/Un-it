import { useState, useCallback } from "react";
import api from "@/lib/api";

export type UserRole = "admin" | "comptable" | "employe";

//udjdjdjjd
//jdjdjd

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  password_reset_token?: string | null;
  password_reset_expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserData
  extends Partial<Omit<CreateUserData, "password">> {
  password?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface UseUserReturn {
  // State
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
  createUser: (data: CreateUserData) => Promise<User>;
  updateUser: (id: number, data: UpdateUserData) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;

  // Utilitaires
  clearError: () => void;
  getUserById: (id: number) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
}

export const useUser = (): UseUserReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await api.get("/users");
      setUsers(response.data.data);
    } catch (error: any) {
      handleError(error, "Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const fetchCurrentUser = useCallback(async (): Promise<User> => {
    try {
      setLoading(true);
      clearError();

      const response = await api.get("/user");
      const user = response.data.data;
      setCurrentUser(user);
      return user;
    } catch (error: any) {
      throw handleError(
        error,
        "Erreur lors du chargement de l'utilisateur courant"
      );
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const createUser = useCallback(
    async (data: CreateUserData): Promise<User> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post("/users", data);
        const newUser = response.data.data;

        setUsers((prev) => [...prev, newUser]);
        return newUser;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la création de l'utilisateur");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const updateUser = useCallback(
    async (id: number, data: UpdateUserData): Promise<User> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/users/${id}`, data);
        const updatedUser = response.data.data;

        setUsers((prev) =>
          prev.map((user) => (user.id === id ? updatedUser : user))
        );

        // Mettre à jour l'utilisateur courant si c'est le même
        if (currentUser?.id === id) {
          setCurrentUser(updatedUser);
        }

        return updatedUser;
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la mise à jour de l'utilisateur"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError, currentUser]
  );

  const deleteUser = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/users/${id}`);

        setUsers((prev) => prev.filter((user) => user.id !== id));
      } catch (error: any) {
        throw handleError(
          error,
          "Erreur lors de la suppression de l'utilisateur"
        );
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  
  const getUserById = useCallback(
    (id: number): User | undefined => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  const getUsersByRole = useCallback(
    (role: UserRole): User[] => {
      return users.filter((user) => user.role === role);
    },
    [users]
  );


  return {
    users,
    currentUser,
    loading,
    error,
    fetchUsers,
    fetchCurrentUser,
    createUser,
    updateUser,
    deleteUser,
    clearError,
    getUserById,
    getUsersByRole,
  };
};
