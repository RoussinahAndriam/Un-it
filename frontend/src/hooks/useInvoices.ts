import api from "@/lib/api";
import { useState, useCallback } from "react";

export interface ThirdParty {
  id: number;
  name: string;
  type: "client" | "fournisseur";
  email?: string;
  details?: string;
}

export interface InvoiceLine {
  id?: number;
  designation: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
}

export interface Invoice {
  id: number;
  type: "client" | "depense";
  third_party_id: number;
  third_party?: ThirdParty;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  status:
    | "brouillon"
    | "envoye"
    | "partiellement_paye"
    | "paye"
    | "en_retard"
    | "annule";
  payment_terms?: string;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
  documents: AttachedDocument[];
  created_at: string;
  updated_at: string;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  transaction_id?: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  created_at: string;
}

export interface AttachedDocument {
  id: number;
  invoice_id: number;
  file_path: string;
  file_name: string;
  file_type?: string;
  created_at: string;
}

export interface InvoiceFilters {
  status?: string;
  type?: string;
  third_party_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (filters: InvoiceFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Nettoyage des filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      console.log("Fetching invoices with filters:", filters); // Debug
      const response = await api.get(`/invoices?${params}`);
      setInvoices(response.data.data || response.data); // Adaptez selon votre API
    } catch (err) {
      setError("Erreur lors du chargement des factures");
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (invoiceData: Partial<Invoice>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/invoices", invoiceData);
      setInvoices((prev) => [response.data.data, ...prev]);
      return response.data.data;
    } catch (err) {
      setError("Erreur lors de la création de la facture");
      console.error("Error creating invoice:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvoice = useCallback(
    async (id: number, invoiceData: Partial<Invoice>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.put(`/invoices/${id}`, invoiceData);
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? response.data.data : inv))
        );
        return response.data.data;
      } catch (err) {
        setError("Erreur lors de la mise à jour de la facture");
        console.error("Error updating invoice:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteInvoice = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la facture");
      console.error("Error deleting invoice:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = useCallback(
    async (invoiceId: number, paymentData: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(
          `/invoices/${invoiceId}/payments`,
          paymentData
        );

        // Mettre à jour la facture avec le nouveau paiement
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === invoiceId) {
              return {
                ...inv,
                payments: [...inv.payments, response.data.data],
                amount_paid: inv.amount_paid + paymentData.amount,
                status:
                  response.data.data.amount === inv.total_amount
                    ? "paye"
                    : "partiellement_paye",
              };
            }
            return inv;
          })
        );

        return response.data.data;
      } catch (err) {
        setError("Erreur lors de l'ajout du paiement");
        console.error("Error adding payment:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendInvoice = useCallback(async (invoiceId: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/invoices/${invoiceId}/send`);

      // Mettre à jour le statut de la facture
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === invoiceId) {
            return { ...inv, status: "envoye" as const };
          }
          return inv;
        })
      );
    } catch (err) {
      setError("Erreur lors de l'envoi de la facture");
      console.error("Error sending invoice:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocument = useCallback(async (documentId: number) => {
    try {
      const response = await api.get(`/invoices/documents/${documentId}`, {
        responseType: "blob",
      });

      // Créer un URL temporaire pour le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `document-${documentId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      throw err;
    }
  }, []);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    sendInvoice,
    downloadDocument,
  };
};
