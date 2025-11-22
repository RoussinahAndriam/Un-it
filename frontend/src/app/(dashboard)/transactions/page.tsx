"use client";

import { useState, useEffect, FormEvent } from "react";
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
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Loader2,
  Edit,
  Trash2,
  Search,
  X,
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
import { toast } from "sonner";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const getTransactionTypeColor = (type: TransactionType) => {
  return type === "revenu"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // État séparé pour les filtres
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "depense",
    category_id: undefined,
    account_id: undefined,
    start_date: undefined,
    end_date: undefined,
  });

  const [formData, setFormData] = useState<CreateTransactionData>({
    account_id: accounts[0]?.id || 0,
    transaction_category_id: null,
    type: "depense",
    amount: 0,
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // Charger les transactions au montage et quand les filtres changent
  useEffect(() => {
    fetchTransactions(filters);
  }, [filters]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  // Mettre à jour les filtres quand l'onglet change
  const handleTabChange = (value: TransactionType) => {
    setActiveTab(value);
    setFilters((prev) => ({
      ...prev,
      type: value,
      category_id: undefined, // Réinitialiser le filtre catégorie quand on change d'onglet
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedTransaction) {
        await updateTransaction(selectedTransaction.id, formData);
        toast.success("Transaction modifiée avec succès");
      } else {
        await createTransaction(formData);
        toast.success("Transaction créée avec succès");
      }
      resetForm();
      setIsDialogOpen(false);
      // Recharger les transactions avec les filtres actuels
      fetchTransactions(filters);
    } catch (err: any) {
      console.error("Erreur:", err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (
    transactionId: string,
    description: string
  ) => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la transaction "${description}" ?`
      )
    ) {
      try {
        await deleteTransaction(transactionId);
        toast.success("Transaction supprimée avec succès");
        fetchTransactions(filters);
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
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

  const resetFilters = () => {
    setFilters({
      type: activeTab,
      category_id: undefined,
      account_id: undefined,
      start_date: undefined,
      end_date: undefined,
    });
    setSearchTerm("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Filtrer les transactions côté client pour la recherche
  const filteredTransactions = transactions.filter((transaction) => {
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

    return matchesSearch;
  });

  const monthlySummary = getMonthlySummary(
    new Date().getFullYear(),
    new Date().getMonth() + 1
  );

  const revenueCategories = categories.filter((cat) => cat.type === "revenu");
  const expenseCategories = categories.filter((cat) => cat.type === "depense");

  // Débogage - afficher les transactions actuelles
  console.log("Transactions:", transactions);
  console.log("Filtres actuels:", filters);
  console.log("Transactions filtrées:", filteredTransactions);

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
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
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                className="flex bg-blue-600 hover:bg-blue-700 text-white items-center gap-2"
                onClick={resetForm}
              >
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
                    onClick={() => handleDialogOpenChange(false)}
                    disabled={submitting}
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

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une transaction..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="depense">Dépenses</TabsTrigger>
                <TabsTrigger value="revenu">Revenus</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>

            {(filters.category_id ||
              filters.account_id ||
              filters.start_date ||
              filters.end_date) && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={filters.category_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        category_id: value ? parseInt(value) : undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      {(activeTab === "revenu"
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
                  <Label>Compte</Label>
                  <Select
                    value={filters.account_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        account_id: value ? parseInt(value) : undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les comptes" />
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

                <div>
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={filters.start_date || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        start_date: e.target.value || undefined,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={filters.end_date || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        end_date: e.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Indicateur de filtrage */}
      {(filters.type === "depense" || filters.type === "revenu") && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm">
            Affichage des {filters.type === "depense" ? "dépenses" : "revenus"}
            {filteredTransactions.length > 0 &&
              ` (${filteredTransactions.length} transaction${
                filteredTransactions.length > 1 ? "s" : ""
              })`}
          </Badge>
        </div>
      )}

      {/* Liste des transactions */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Badge
                      className={getTransactionTypeColor(transaction.type)}
                    >
                      {transaction.type === "revenu" ? "Revenu" : "Dépense"}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {transaction.description || "Sans description"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.category?.name} •{" "}
                        {transaction.account?.name} •{" "}
                        {formatDate(transaction.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
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
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setFormData({
                              account_id: transaction.account_id,
                              transaction_category_id:
                                transaction.transaction_category_id,
                              type: transaction.type,
                              amount: transaction.amount,
                              description: transaction.description || "",
                              transaction_date: transaction.transaction_date,
                            });
                            setIsEditMode(true);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction.id,
                              transaction.description || "cette transaction"
                            )
                          }
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
              <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                filters.category_id ||
                filters.account_id ||
                filters.start_date ||
                filters.end_date
                  ? "Aucune transaction ne correspond à vos critères de recherche"
                  : `Aucune ${
                      filters.type === "depense" ? "dépense" : "revenu"
                    } enregistrée`}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Transaction
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
