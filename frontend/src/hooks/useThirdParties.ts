import api from "@/lib/api";
import { useState, useCallback } from "react";

export interface ThirdParty {
  id: number;
  name: string;
  type: "client" | "fournisseur";
  email?: string;
  details?: string;
  created_at: string;
  updated_at: string;
  invoices?: any[];
}

export const useThirdParties = () => {
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThirdParties = useCallback(
    async (type?: "client" | "fournisseur") => {
      setLoading(true);
      setError(null);
      try {
        const params = type ? `?type=${type}` : "";
        const response = await api.get(`/third-parties${params}`);
        setThirdParties(response.data.data);
      } catch (err) {
        setError("Erreur lors du chargement des tiers");
        console.error("Error fetching third parties:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createThirdParty = useCallback(
    async (thirdPartyData: Partial<ThirdParty>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(
          "/third-parties",
          thirdPartyData
        );
        setThirdParties((prev) => [response.data.data, ...prev]);
        return response.data.data;
      } catch (err) {
        setError("Erreur lors de la création du tiers");
        console.error("Error creating third party:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateThirdParty = useCallback(
    async (id: number, thirdPartyData: Partial<ThirdParty>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.put(
          `/third-parties/${id}`,
          thirdPartyData
        );
        setThirdParties((prev) =>
          prev.map((tp) => (tp.id === id ? response.data.data : tp))
        );
        return response.data.data;
      } catch (err) {
        setError("Erreur lors de la mise à jour du tiers");
        console.error("Error updating third party:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteThirdParty = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/third-parties/${id}`);
      setThirdParties((prev) => prev.filter((tp) => tp.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du tiers");
      console.error("Error deleting third party:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    thirdParties,
    loading,
    error,
    fetchThirdParties,
    createThirdParty,
    updateThirdParty,
    deleteThirdParty,
  };
};
