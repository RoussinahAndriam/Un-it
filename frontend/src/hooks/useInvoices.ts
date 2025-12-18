import api from "@/lib/api";
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { format, parseISO, differenceInDays, isAfter } from "date-fns";

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
  const [dueDateNotifications, setDueDateNotifications] = useState<Set<number>>(
    new Set()
  );

  // Fonction utilitaire pour formater les dates
  const formatDateForAPI = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return dateString;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString;
    }
  };

  // Fonction pour vérifier les dates d'échéance
  const checkDueDates = useCallback(
    (invoicesList: Invoice[]) => {
      const today = new Date();
      invoicesList.forEach((invoice) => {
        if (
          invoice.status === "paye" ||
          invoice.status === "annule" ||
          dueDateNotifications.has(invoice.id)
        ) {
          return;
        }

        const dueDate = parseISO(invoice.due_date);
        const daysUntilDue = differenceInDays(dueDate, today);

        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          if (!dueDateNotifications.has(invoice.id)) {
            setDueDateNotifications((prev) => new Set(prev).add(invoice.id));

            if (daysUntilDue === 0) {
              toast.error(
                `⚠️ Facture ${invoice.invoice_number} arrive à échéance aujourd'hui !`,
                {
                  duration: 10000,
                  icon: "⚠️",
                }
              );
            } else if (daysUntilDue === 1) {
              toast.warning(
                `📅 Facture ${invoice.invoice_number} arrive à échéance demain !`,
                {
                  duration: 8000,
                  icon: "📅",
                }
              );
            } else {
              toast.warning(
                `⏰ Facture ${invoice.invoice_number} arrive à échéance dans ${daysUntilDue} jours`,
                {
                  duration: 6000,
                  icon: "⏰",
                }
              );
            }
          }
        }

        // Marquer comme en retard si la date est passée
        if (
          isAfter(today, dueDate) &&
          invoice.status !== "paye" &&
          invoice.status !== "en_retard"
        ) {
          toast.error(`🚨 Facture ${invoice.invoice_number} est en retard !`, {
            duration: 15000,
            icon: "🚨",
          });
        }
      });
    },
    [dueDateNotifications]
  );

  const fetchInvoices = useCallback(
    async (filters: InvoiceFilters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, value.toString());
          }
        });

        const response = await api.get(`/invoices?${params}`);
        const invoicesData = response.data.data || response.data;
        setInvoices(invoicesData);

        // Vérifier les dates d'échéance après chargement
        checkDueDates(invoicesData);
      } catch (err) {
        const errorMsg = "Erreur lors du chargement des factures";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    },
    [checkDueDates]
  );

  const createInvoice = useCallback(
    async (invoiceData: Partial<Invoice>) => {
      setLoading(true);
      setError(null);

      // Validation avant envoi
      if (!invoiceData.invoice_number) {
        const errorMsg = "Le numéro de facture est requis";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      if (invoiceData.total_amount && invoiceData.total_amount <= 0) {
        const errorMsg = "Le montant total doit être supérieur à 0";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      const loadingToast = toast.loading("Création de la facture en cours...");

      try {
        // Formater les dates
        const formattedData = {
          ...invoiceData,
          issue_date: invoiceData.issue_date
            ? formatDateForAPI(invoiceData.issue_date)
            : formatDateForAPI(new Date().toISOString()),
          due_date: invoiceData.due_date
            ? formatDateForAPI(invoiceData.due_date)
            : undefined,
        };

        const response = await api.post("/invoices", formattedData);
        const newInvoice = response.data.data;

        setInvoices((prev) => [newInvoice, ...prev]);

        toast.dismiss(loadingToast);
        toast.success(
          `✅ Facture ${newInvoice.invoice_number} créée avec succès !`,
          {
            duration: 5000,
            icon: "✅",
          }
        );

        // Vérifier la date d'échéance
        checkDueDates([newInvoice]);

        return newInvoice;
      } catch (err: any) {
        toast.dismiss(loadingToast);
        const errorMsg =
          err.response?.data?.message ||
          "Erreur lors de la création de la facture";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        console.error("Error creating invoice:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkDueDates]
  );

  const updateInvoice = useCallback(
    async (id: number, invoiceData: Partial<Invoice>) => {
      setLoading(true);
      setError(null);

      // Validation
      if (
        invoiceData.total_amount !== undefined &&
        invoiceData.total_amount < 0
      ) {
        const errorMsg = "Le montant total ne peut pas être négatif";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      const loadingToast = toast.loading("Mise à jour de la facture...");

      try {
        console.log("Original data sent to update:", invoiceData);

        const formattedData = {
          ...invoiceData,
          issue_date: invoiceData.issue_date
            ? formatDateForAPI(invoiceData.issue_date)
            : undefined,
          due_date: invoiceData.due_date
            ? formatDateForAPI(invoiceData.due_date)
            : undefined,
        };

        console.log("Formatted data for API:", formattedData);

        const response = await api.put(`/invoices/${id}`, formattedData);
        const updatedInvoice = response.data.data;

        console.log("API Response:", response.data);

        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? updatedInvoice : inv))
        );

        toast.dismiss(loadingToast);
        toast.success(
          `✅ Facture ${updatedInvoice.invoice_number} mise à jour avec succès !`,
          {
            duration: 4000,
            icon: "✅",
          }
        );

        // Vérifier la nouvelle date d'échéance
        checkDueDates([updatedInvoice]);

        return updatedInvoice;
      } catch (err: any) {
        toast.dismiss(loadingToast);
        console.error("Full error details in updateInvoice:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config,
        });

        const errorMsg =
          err.response?.data?.message ||
          "Erreur lors de la mise à jour de la facture";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkDueDates]
  );

  const deleteInvoice = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      const invoice = invoices.find((inv) => inv.id === id);
      if (!invoice) {
        const errorMsg = "Facture non trouvée";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      // Vérifications spéciales
      if (
        invoice.status === "paye" ||
        invoice.status === "partiellement_paye"
      ) {
        const errorMsg =
          "Impossible de supprimer une facture avec des paiements";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "🚫" });
        throw new Error(errorMsg);
      }

      const loadingToast = toast.loading("Suppression de la facture...");

      try {
        await api.delete(`/invoices/${id}`);
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));

        toast.dismiss(loadingToast);
        toast.success(
          `🗑️ Facture ${invoice.invoice_number} supprimée avec succès`,
          {
            duration: 4000,
            icon: "🗑️",
          }
        );

        // Supprimer des notifications si présente
        setDueDateNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } catch (err: any) {
        toast.dismiss(loadingToast);
        const errorMsg =
          err.response?.data?.message ||
          "Erreur lors de la suppression de la facture";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        console.error("Error deleting invoice:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [invoices]
  );

  const addPayment = useCallback(
    async (invoiceId: number, paymentData: any) => {
      setLoading(true);
      setError(null);

      // Validation du paiement
      if (!paymentData.amount || paymentData.amount <= 0) {
        const errorMsg = "Le montant du paiement doit être supérieur à 0";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) {
        const errorMsg = "Facture non trouvée";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      // Vérifier si le paiement dépasse le montant restant
      const remainingAmount = invoice.total_amount - invoice.amount_paid;
      if (paymentData.amount > remainingAmount) {
        const errorMsg = `Le paiement (${paymentData.amount}) dépasse le montant restant (${remainingAmount})`;
        setError(errorMsg);
        toast.error(errorMsg, { icon: "⚠️" });
        throw new Error(errorMsg);
      }

      const loadingToast = toast.loading("Enregistrement du paiement...");

      try {
        const response = await api.post(
          `/invoices/${invoiceId}/payments`,
          paymentData
        );
        const newPayment = response.data.data;

        // Mettre à jour la facture localement
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === invoiceId) {
              const updatedInv = {
                ...inv,
                payments: [...inv.payments, newPayment],
                amount_paid: inv.amount_paid + paymentData.amount,
                status:
                  inv.amount_paid + paymentData.amount >= inv.total_amount
                    ? "paye"
                    : "partiellement_paye",
              };

              // Si payée, supprimer des notifications
              if (updatedInv.status === "paye") {
                setDueDateNotifications((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(invoiceId);
                  return newSet;
                });
              }

              return updatedInv;
            }
            return inv;
          })
        );

        toast.dismiss(loadingToast);

        if (invoice.amount_paid + paymentData.amount >= invoice.total_amount) {
          toast.success(
            `💳 Facture ${invoice.invoice_number} entièrement payée !`,
            {
              duration: 5000,
              icon: "💳",
            }
          );
        } else {
          toast.success(
            `💳 Paiement de ${paymentData.amount}€ enregistré pour la facture ${invoice.invoice_number}`,
            {
              duration: 4000,
              icon: "💳",
            }
          );
        }

        return newPayment;
      } catch (err) {
        toast.dismiss(loadingToast);
        const errorMsg = "Erreur lors de l'ajout du paiement";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        console.error("Error adding payment:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [invoices]
  );

  const sendInvoice = useCallback(
    async (invoiceId: number) => {
      setLoading(true);
      setError(null);

      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) {
        const errorMsg = "Facture non trouvée";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        throw new Error(errorMsg);
      }

      // Vérification de l'email du client
      if (!invoice.third_party?.email) {
        const errorMsg = "Le client n'a pas d'email renseigné";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "📧" });
        throw new Error(errorMsg);
      }

      const loadingToast = toast.loading("Envoi de la facture par email...");

      try {
        await api.post(`/invoices/${invoiceId}/send`);

        // Mettre à jour le statut localement
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === invoiceId) {
              return { ...inv, status: "envoye" as const };
            }
            return inv;
          })
        );

        toast.dismiss(loadingToast);
        toast.success(
          `📧 Facture ${invoice.invoice_number} envoyée à ${invoice.third_party.email}`,
          {
            duration: 5000,
            icon: "📧",
          }
        );
      } catch (err: any) {
        toast.dismiss(loadingToast);
        const errorMsg =
          err.response?.data?.message || "Erreur lors de l'envoi de la facture";
        setError(errorMsg);
        toast.error(errorMsg, { icon: "❌" });
        console.error("Error sending invoice:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [invoices]
  );

  const downloadDocument = useCallback(async (documentId: number) => {
    try {
      const loadingToast = toast.loading("Téléchargement du document...");

      const response = await api.get(`/invoices/documents/${documentId}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extraire le nom du fichier de la réponse
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `document-${documentId}`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(`📄 Document téléchargé : ${fileName}`, {
        duration: 3000,
        icon: "📄",
      });
    } catch (err) {
      toast.error("Erreur lors du téléchargement", { icon: "❌" });
      console.error("Error downloading document:", err);
      throw err;
    }
  }, []);

  // Fonction pour vérifier toutes les dates d'échéance (à appeler périodiquement)
  const checkAllDueDates = useCallback(() => {
    checkDueDates(invoices);
  }, [invoices, checkDueDates]);

  // Fonction pour réinitialiser les notifications d'une facture
  const clearDueDateNotification = useCallback((invoiceId: number) => {
    setDueDateNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.delete(invoiceId);
      return newSet;
    });
  }, []);

  // Fonction pour marquer une facture comme "vue" pour les notifications
  const markInvoiceAsSeen = useCallback((invoiceId: number) => {
    setDueDateNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.delete(invoiceId);
      return newSet;
    });
    toast.success("Notification marquée comme vue", { duration: 2000 });
  }, []);

  // Fonction utilitaire pour obtenir les factures nécessitant une attention
  const getAttentionNeededInvoices = useCallback(() => {
    const today = new Date();
    return invoices.filter((invoice) => {
      if (invoice.status === "paye" || invoice.status === "annule")
        return false;

      const dueDate = parseISO(invoice.due_date);
      const daysUntilDue = differenceInDays(dueDate, today);

      return daysUntilDue <= 3 || isAfter(today, dueDate);
    });
  }, [invoices]);

  return {
    invoices,
    loading,
    error,
    dueDateNotifications: Array.from(dueDateNotifications),
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    sendInvoice,
    downloadDocument,
    checkAllDueDates,
    clearDueDateNotification,
    markInvoiceAsSeen,
    getAttentionNeededInvoices,
  };
};
