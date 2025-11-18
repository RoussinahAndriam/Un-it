import { useState, useCallback } from "react";
import api from "@/lib/api";

export type AssetStatus =
  | "neuf"
  | "en_service"
  | "en_maintenance"
  | "hors_service";
export type AssetLocation = "en_stock" | "bureau" | "pret_employe";

export interface Asset {
  id: number;
  name: string;
  description: string | null;
  serial_number: string | null;
  acquisition_date: string | null;
  acquisition_value: number | null;
  status: AssetStatus;
  location: AssetLocation;
  created_at?: string;
  updated_at?: string;
  current_loan?: AssetLoan; // Relation chargée
}

export interface CreateAssetData {
  name: string;
  description?: string | null;
  serial_number?: string | null;
  acquisition_date?: string | null;
  acquisition_value?: number | null;
  status: AssetStatus;
  location: AssetLocation;
}

export interface UpdateAssetData extends Partial<CreateAssetData> {}

interface UseAssetReturn {
  // State
  assets: Asset[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAssets: (filters?: AssetFilters) => Promise<void>;
  createAsset: (data: CreateAssetData) => Promise<Asset>;
  updateAsset: (id: number, data: UpdateAssetData) => Promise<Asset>;
  deleteAsset: (id: number) => Promise<void>;

  // Utilitaires
  clearError: () => void;
  getAssetById: (id: number) => Asset | undefined;
  getAssetsByStatus: (status: AssetStatus) => Asset[];
  getAssetsByLocation: (location: AssetLocation) => Asset[];
  getAssetsAvailableForLoan: () => Asset[];
  getAssetsStatistics: () => AssetStatistics;
}

export interface AssetFilters {
  status?: AssetStatus;
  location?: AssetLocation;
  search?: string;
}

export interface AssetStatistics {
  total: number;
  byStatus: {
    neuf: number;
    en_service: number;
    en_maintenance: number;
    hors_service: number;
  };
  byLocation: {
    en_stock: number;
    bureau: number;
    pret_employe: number;
  };
  totalValue: number;
}

export const useAsset = (): UseAssetReturn => {
  const [assets, setAssets] = useState<Asset[]>([]);
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

  const fetchAssets = useCallback(
    async (filters?: AssetFilters): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        const params = new URLSearchParams();
        if (filters?.status) params.append("status", filters.status);
        if (filters?.location) params.append("location", filters.location);
        if (filters?.search) params.append("search", filters.search);

        const response = await api.get(`/assets?${params.toString()}`);
        setAssets(response.data.data);
      } catch (error: any) {
        handleError(error, "Erreur lors du chargement des actifs");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const createAsset = useCallback(
    async (data: CreateAssetData): Promise<Asset> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.post("/assets", data);
        const newAsset = response.data.data;

        setAssets((prev) => [...prev, newAsset]);
        return newAsset;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la création de l'actif");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const updateAsset = useCallback(
    async (id: number, data: UpdateAssetData): Promise<Asset> => {
      try {
        setLoading(true);
        clearError();

        const response = await api.put(`/assets/${id}`, data);
        const updatedAsset = response.data.data;

        setAssets((prev) =>
          prev.map((asset) => (asset.id === id ? updatedAsset : asset))
        );
        return updatedAsset;
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la mise à jour de l'actif");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const deleteAsset = useCallback(
    async (id: number): Promise<void> => {
      try {
        setLoading(true);
        clearError();

        await api.delete(`/assets/${id}`);

        setAssets((prev) => prev.filter((asset) => asset.id !== id));
      } catch (error: any) {
        throw handleError(error, "Erreur lors de la suppression de l'actif");
      } finally {
        setLoading(false);
      }
    },
    [clearError]
  );

  const getAssetById = useCallback(
    (id: number): Asset | undefined => {
      return assets.find((asset) => asset.id === id);
    },
    [assets]
  );

  const getAssetsByStatus = useCallback(
    (status: AssetStatus): Asset[] => {
      return assets.filter((asset) => asset.status === status);
    },
    [assets]
  );

  const getAssetsByLocation = useCallback(
    (location: AssetLocation): Asset[] => {
      return assets.filter((asset) => asset.location === location);
    },
    [assets]
  );

  const getAssetsAvailableForLoan = useCallback((): Asset[] => {
    return assets.filter(
      (asset) =>
        asset.status === "en_service" &&
        asset.location === "en_stock" &&
        !asset.current_loan
    );
  }, [assets]);

  const getAssetsStatistics = useCallback((): AssetStatistics => {
    const byStatus = {
      neuf: getAssetsByStatus("neuf").length,
      en_service: getAssetsByStatus("en_service").length,
      en_maintenance: getAssetsByStatus("en_maintenance").length,
      hors_service: getAssetsByStatus("hors_service").length,
    };

    const byLocation = {
      en_stock: getAssetsByLocation("en_stock").length,
      bureau: getAssetsByLocation("bureau").length,
      pret_employe: getAssetsByLocation("pret_employe").length,
    };

    let totalValue = 0
    for(const a of assets){
      const amount = Number(a.acquisition_value); 
      totalValue += amount
    }


    return {
      total: assets.length,
      byStatus,
      byLocation,
      totalValue,
    };
  }, [assets, getAssetsByStatus, getAssetsByLocation]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    clearError,
    getAssetById,
    getAssetsByStatus,
    getAssetsByLocation,
    getAssetsAvailableForLoan,
    getAssetsStatistics,
  };
};
