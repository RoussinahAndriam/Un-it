"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import {
  useTransaction,
  TransactionType,
  CreateTransactionData,
  TransactionFilters,
} from "@/hooks/useTransaction";
import { useTransactionCategory } from "@/hooks/useTransactionCategory";
import { useAccount } from "@/hooks/useAccount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EllipsisVertical } from "lucide-react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Filter,
  Loader2,
  Edit,
  Trash2,
  Search,
  X,
  Calendar,
  Landmark,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/constants";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const getTransactionTypeColor = (type: TransactionType) => {
  return type === "revenu"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";
};

const getTransactionTypeText = (type: TransactionType) => {
  return type === "revenu" ? "Revenu" : "Dépense";
};

export default function TransactionsPage() {
  const { accounts, fetchAccounts } = useAccount();
  const { categories, fetchCategories } = useTransactionCategory();
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearError,
    getMonthlySummary,
  } = useTransaction();

  const [activeTab, setActiveTab] = useState<TransactionType>("depense");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // États pour les notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
    title?: string;
  } | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>({
    type: "depense",
  });

  const [formData, setFormData] = useState<CreateTransactionData>({
    account_id: accounts[0]?.id || 0,
    transaction_category_id: null,
    type: "depense",
    amount: 0,
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // Afficher une notification
  const showNotification = (
    type: "success" | "error" | "info" | "warning",
    message: string,
    title?: string
  ) => {
    setNotification({ type, message, title });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, type: activeTab }));
  }, [activeTab]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedTransaction) {
        await updateTransaction(selectedTransaction.id, formData);
        showNotification(
          "success",
          `Transaction "${
            formData.description || "sans description"
          }" modifiée avec succès`,
          "Modification réussie"
        );
      } else {
        await createTransaction(formData);
        showNotification(
          "success",
          `Nouvelle transaction "${
            formData.description || "sans description"
          }" créée avec succès`,
          "Création réussie"
        );
      }
      resetForm();
      setIsDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error("Erreur:", err);
      showNotification(
        "error",
        "Une erreur est survenue lors de l'opération",
        "Erreur"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      account_id: accounts[0]?.id || 0,
      transaction_category_id: null,
      type: activeTab,
      amount: 0,
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setIsEditMode(false);
    setSelectedTransaction(null);
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setAccountFilter("all");
    setDateRange({ start: "", end: "" });
    setAmountRange({ min: "", max: "" });
    setSortBy("date");
    setSortOrder("desc");
  };

  // Filtrer et trier les transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      // Filtre par type (tab actif)
      if (transaction.type !== activeTab) return false;

      // Filtre par recherche
      const matchesSearch =
        transaction.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.account?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filtre par catégorie
      const matchesCategory =
        categoryFilter === "all" ||
        transaction.transaction_category_id?.toString() === categoryFilter;

      // Filtre par compte
      const matchesAccount =
        accountFilter === "all" ||
        transaction.account_id.toString() === accountFilter;

      // Filtre par date
      const transactionDate = new Date(transaction.transaction_date);
      const matchesDateRange =
        (!dateRange.start || transactionDate >= new Date(dateRange.start)) &&
        (!dateRange.end || transactionDate <= new Date(dateRange.end));

      // Filtre par montant
      const matchesAmountRange =
        (!amountRange.min ||
          transaction.amount >= parseFloat(amountRange.min)) &&
        (!amountRange.max || transaction.amount <= parseFloat(amountRange.max));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAccount &&
        matchesDateRange &&
        matchesAmountRange
      );
    });

    // Trier les transactions
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "description":
          aValue = a.description?.toLowerCase() || "";
          bValue = b.description?.toLowerCase() || "";
          break;
        default:
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    transactions,
    activeTab,
    searchTerm,
    categoryFilter,
    accountFilter,
    dateRange,
    amountRange,
    sortBy,
    sortOrder,
  ]);

  // Statistiques filtrées
  const filteredStats = useMemo(() => {
    const filtered = filteredAndSortedTransactions;
    const totalAmount = filtered.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const averageAmount =
      filtered.length > 0 ? totalAmount / filtered.length : 0;

    return {
      count: filtered.length,
      totalAmount,
      averageAmount,
    };
  }, [filteredAndSortedTransactions]);

  const monthlySummary = getMonthlySummary(
    new Date().getFullYear(),
    new Date().getMonth() + 1
  );

  const revenueCategories = categories.filter((cat) => cat.type === "revenu");
  const expenseCategories = categories.filter((cat) => cat.type === "depense");

  // Catégories et comptes pour les filtres
  const currentCategories =
    activeTab === "revenu" ? revenueCategories : expenseCategories;

  // Fonction pour gérer le clic sur une carte
  const handleCardClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  // Fonction pour modifier une transaction depuis les détails
  const handleEditFromDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setFormData({
      account_id: transaction.account_id,
      transaction_category_id: transaction.transaction_category_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description || "",
      transaction_date: transaction.transaction_date,
    });
    setIsEditMode(true);
    setIsDetailsDialogOpen(false);
    setIsDialogOpen(true);
  };

  // Fonction pour supprimer une transaction avec confirmation
  const handleDeleteTransaction = async (transaction: any) => {
    try {
      await deleteTransaction(transaction.id);
      showNotification(
        "success",
        `Transaction "${
          transaction.description || "sans description"
        }" supprimée avec succès`,
        "Suppression réussie"
      );
      setIsDetailsDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error("Erreur:", err);
      showNotification(
        "error",
        "Une erreur est survenue lors de la suppression",
        "Erreur"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : notification.type === "warning"
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" && (
              <CheckCircle className="h-5 w-5" />
            )}
            {notification.type === "error" && (
              <AlertTriangle className="h-5 w-5" />
            )}
            {notification.type === "warning" && (
              <AlertTriangle className="h-5 w-5" />
            )}
            <div>
              {notification.title && (
                <p className="font-semibold">{notification.title}</p>
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-4"
              onClick={() => setNotification(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Revenus & Dépenses
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos transactions financières quotidiennes
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex bg-blue-600 hover:bg-blue-700 text-white items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode
                    ? "Modifier la Transaction"
                    : "Nouvelle Transaction"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Modifiez les détails de cette transaction"
                    : "Ajoutez une nouvelle transaction à votre journal"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: TransactionType) =>
                        setFormData((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenu">Revenu</SelectItem>
                        <SelectItem value="depense">Dépense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Compte</Label>
                    <Select
                      value={formData.account_id.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          account_id: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={account.id.toString()}
                          >
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.transaction_category_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        transaction_category_id: value ? parseInt(value) : null,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === "revenu"
                        ? revenueCategories
                        : expenseCategories
                      ).map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value),
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description de la transaction"
                  />
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        transaction_date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEditMode ? (
                      "Modifier"
                    ) : (
                      "Créer"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Revenus du mois
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(monthlySummary.total_revenue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dépenses du mois
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(monthlySummary.total_expense)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Solde du mois
                </p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    monthlySummary.balance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(monthlySummary.balance)}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${
                  monthlySummary.balance >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {monthlySummary.balance >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Transactions filtrées
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {filteredStats.count}
                </p>
                <p className="text-xs text-gray-500">
                  Total: {formatCurrency(filteredStats.totalAmount)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Filter className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
       
            <div className="relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full lg:w-80"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              {/* Bouton filtres avancés */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {(categoryFilter !== "all" ||
                  accountFilter !== "all" ||
                  dateRange.start ||
                  dateRange.end ||
                  amountRange.min ||
                  amountRange.max) && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-blue-100 text-blue-800"
                  >
                    !
                  </Badge>
                )}
              </Button>

              {/* Tabs pour revenus/dépenses */}
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as TransactionType)
                }
              >
                <TabsList>
                  <TabsTrigger value="depense">Dépenses</TabsTrigger>
                  <TabsTrigger value="revenu">Revenus</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Trier par:
                </span>
                <Select
                  value={sortBy}
                  onValueChange={(value: "date" | "amount" | "description") =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Montant</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="h-10 w-10"
                >
                  {sortOrder === "asc" ? "A→Z" : "Z→A"}
                </Button>
              </div>

              {/* Bouton réinitialiser */}
              {(searchTerm ||
                categoryFilter !== "all" ||
                accountFilter !== "all" ||
                dateRange.start ||
                dateRange.end ||
                amountRange.min ||
                amountRange.max) && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="whitespace-nowrap"
                >
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtre par catégorie */}
                <div>
                  <Label className="text-sm font-medium">Catégorie</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {currentCategories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par compte */}
                <div>
                  <Label className="text-sm font-medium">Compte</Label>
                  <Select
                    value={accountFilter}
                    onValueChange={setAccountFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les comptes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les comptes</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id.toString()}
                        >
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par date */}
                <div>
                  <Label className="text-sm font-medium">Date de début</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Date de fin</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Filtre par montant */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                <div>
                  <Label className="text-sm font-medium">Montant minimum</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={amountRange.min}
                    onChange={(e) =>
                      setAmountRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Montant maximum</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="∞"
                    value={amountRange.max}
                    onChange={(e) =>
                      setAmountRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Résultats du filtrage */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>
              {filteredStats.count} transaction
              {filteredStats.count > 1 ? "s" : ""} trouvée
              {filteredStats.count > 1 ? "s" : ""}
              {searchTerm && ` pour "${searchTerm}"`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredAndSortedTransactions.length > 0 ? (
          filteredAndSortedTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(transaction)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={getTransactionTypeColor(transaction.type)}
                      >
                        {getTransactionTypeText(transaction.type)}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {transaction.description || "Sans description"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {transaction.category && (
                            <span>{transaction.category.name}</span>
                          )}
                          {transaction.account && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Landmark className="h-3 w-3" />
                                <span>{transaction.account.name}</span>
                              </div>
                            </>
                          )}
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(transaction.transaction_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === "revenu"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                     
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            handleEditFromDetails(transaction);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (
                              confirm(
                                "Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible."
                              )
                            ) {
                              handleDeleteTransaction(transaction);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {transactions.length === 0
                  ? "Aucune transaction"
                  : "Aucun résultat"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                categoryFilter !== "all" ||
                accountFilter !== "all" ||
                dateRange.start ||
                dateRange.end
                  ? "Aucune transaction ne correspond à vos critères de recherche"
                  : "Commencez par enregistrer votre première transaction"}
              </p>
              <Button
                onClick={() => {
                  if (transactions.length === 0) {
                    setIsDialogOpen(true);
                  } else {
                    resetFilters();
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {transactions.length === 0
                  ? "Nouvelle Transaction"
                  : "Réinitialiser les filtres"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de détails de la transaction */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Détails de la transaction</DialogTitle>
                <DialogDescription>
                  Informations complètes sur cette transaction
                </DialogDescription>
              </div>
             
            </div>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations principales */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Type et description
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={getTransactionTypeColor(
                              selectedTransaction.type
                            )}
                          >
                            {getTransactionTypeText(selectedTransaction.type)}
                          </Badge>
                          <p className="font-semibold">
                            {selectedTransaction.description ||
                              "Sans description"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Montant
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <p
                          className={`text-2xl font-bold ${
                            selectedTransaction.type === "revenu"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(selectedTransaction.amount)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Montant de la transaction
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Catégorie
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {selectedTransaction.category?.name ||
                              "Non catégorisé"}
                          </span>
                          <Badge variant="outline">Catégorie</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Compte et date
                    </h3>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {selectedTransaction.account?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(selectedTransaction.transaction_date)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 bg-blue-400"
                  onClick={() => handleEditFromDetails(selectedTransaction)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                  onClick={() => {
                    if (
                      confirm(
                        "Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible."
                      )
                    ) {
                      handleDeleteTransaction(selectedTransaction);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
