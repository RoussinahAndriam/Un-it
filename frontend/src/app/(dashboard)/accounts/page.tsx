"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from "react";
import { useAccount, AccountType, CreateAccountData, Account } from "@/hooks/useAccount";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Eye,
  Settings,
  CreditCard,
  TrendingUp,
  Users,
  PieChart,
  Loader2,
  Edit,
  Trash2,
  X,
  Landmark,
  Coins,
  SmartphoneNfc,
  Search,
  Filter,
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
import { formatCurrency } from "@/constants";

// Fonctions utilitaires pour les types de compte
const getAccountTypeIcon = (type: AccountType) => {
  switch (type) {
    case "bancaire":
      return <Landmark className="h-5 w-5 text-blue-600" />;
    case "mobile_money":
      return <SmartphoneNfc className="h-5 w-5 text-green-600" />;
    case "especes":
      return <Coins className="h-5 w-5 text-yellow-600" />;
    case "autre":
      return <CreditCard className="h-5 w-5 text-gray-600" />;
    default:
      return <CreditCard className="h-5 w-5 text-gray-600" />;
  }
};

const getAccountTypeColor = (type: AccountType) => {
  switch (type) {
    case "bancaire":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "mobile_money":
      return "bg-green-100 text-green-800 border-green-200";
    case "especes":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "autre":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function AccountPage() {
  const {
    accounts,
    createAccount,
    updateAccount,
    deleteAccount,
    fetchAccounts,
    loading,
    error,
    clearError,
    getTotalBalance,
  } = useAccount();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);

  // États pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "balance" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [formData, setFormData] = useState<CreateAccountData>({
    name: "",
    type: "bancaire" as AccountType,
    balance: 0,
    currency: "MGA",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "balance" ? Number(value) : value,
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as AccountType,
    }));
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedAccount) {
        await updateAccount(selectedAccount.id, formData);
      } else {
        await createAccount(formData);
      }
      resetForm();
      setIsPopoverOpen(false);
    } catch (err) {
      // L'erreur est déjà gérée dans le hook
      console.error("Erreur lors de l'opération :", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setEditingAccountId(account.id);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
    });
    setIsEditMode(true);
    setIsPopoverOpen(true);
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete) {
      setDeleting(true);
      clearError();
      try {
        await deleteAccount(accountToDelete.id);
        setIsDeleteModalOpen(false);
        setAccountToDelete(null);
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
      } finally {
        setDeleting(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "bancaire",
      balance: 0,
      currency: "MGA",
    });
    setIsEditMode(false);
    setSelectedAccount(null);
    setEditingAccountId(null);
    clearError();
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  // Filtrage et tri des comptes
  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = accounts.filter((account) => {
      const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || account.type === typeFilter;
      return matchesSearch && matchesType;
    });

    // Tri des comptes
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "balance":
          aValue = a.balance;
          bValue = b.balance;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [accounts, searchQuery, typeFilter, sortBy, sortOrder]);

  // Calcul des statistiques
  const totalBalance = getTotalBalance();
  const activeAccounts = accounts.length;
  const accountTypes = new Set(accounts.map((acc) => acc.type)).size;

  // Statistiques filtrées
const filteredTotalBalance = useMemo(() => {
  return filteredAndSortedAccounts.reduce((sum, account) => {
    const raw = String(account.balance ?? "0").replace(/[^\d.-]/g, "");
    const balance = Number(raw);

    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);
}, [filteredAndSortedAccounts]);


  const filteredAccountCount = filteredAndSortedAccounts.length;

  // Charger les comptes au montage
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "text-blue-700",
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color} mt-2`}>
              {typeof value === "number" && title.includes("Solde")
                ? formatCurrency(value)
                : value}
            </p>
          </div>
          <div className="p-3 rounded-full bg-gray-50">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      {/* Overlay blur lorsque le popover est ouvert */}
      {isPopoverOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40" />
      )}

      {/* Affichage des erreurs globales */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Comptes
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez tous vos comptes financiers au même endroit
          </p>
        </div>

        {/* === POPOVER AJOUT/MODIFICATION === */}
        <Dialog
          open={isPopoverOpen}
          onOpenChange={(open) => {
            setIsPopoverOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              disabled={submitting || loading}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus size={20} />
              )}
              Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="w-96 p-6 bg-white shadow-xl rounded-xl border-0 ">
             <DialogHeader>
                            <DialogTitle>
                              {isEditMode
                                ? "Modifier du compte"
                                : "Nouveau compte"}
                            </DialogTitle>
                            <DialogDescription>
                              {isEditMode
                                ? "Modifiez les détails du compte"
                                : "Ajoutez un nouveau compte à votre journal"}
                            </DialogDescription>
               </DialogHeader>
           

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Nom du compte
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ex: Compte Principal"
                  className="w-full"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="type"
                  className="text-sm font-medium text-gray-700"
                >
                  Type de compte
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bancaire">Bancaire</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="balance"
                  className="text-sm font-medium text-gray-700"
                >
                  Solde {isEditMode ? "actuel" : "initial"}
                </Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPopoverOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isEditMode ? "Modification..." : "Création..."}
                    </>
                  ) : isEditMode ? (
                    "Modifier le compte"
                  ) : (
                    "Créer le compte"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* === RÉSUMÉ STATISTIQUES === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Solde Total"
          value={totalBalance}
          icon={TrendingUp}
          color="text-blue-700"
        />
        <StatCard
          title="Comptes Actifs"
          value={activeAccounts}
          icon={Users}
          color="text-gray-900"
        />
        <StatCard
          title="Types de Comptes"
          value={accountTypes}
          icon={PieChart}
          color="text-green-600"
        />
      </div>

      {/* === BARRE DE RECHERCHE ET FILTRES === */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Barre de recherche */}
            <div className="relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un compte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full lg:w-80"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              {/* Filtre par type */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={typeFilter} onValueChange={(value: AccountType | "all") => setTypeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type de compte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="bancaire">Bancaire</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Trier par:</span>
                <Select value={sortBy} onValueChange={(value: "name" | "balance" | "type") => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="balance">Solde</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="h-10 w-10"
                >
                  {sortOrder === "asc" ? "A→Z" : "Z→A"}
                </Button>
              </div>

              {/* Bouton réinitialiser */}
              {(searchQuery || typeFilter !== "all" || sortBy !== "name") && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="whitespace-nowrap"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Résultats du filtrage */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>
              {filteredAccountCount} compte{filteredAccountCount > 1 ? "s" : ""} trouvé{filteredAccountCount > 1 ? "s" : ""}
              {searchQuery && ` pour "${searchQuery}"`}
              {typeFilter !== "all" && ` • Type: ${typeFilter}`}
            </span>
            
            {filteredAccountCount > 0 && (
              <span className="text-green-600 font-medium">
                Solde filtré: {formatCurrency(filteredTotalBalance)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === LISTE DES COMPTES === */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Mes Comptes</h2>
          <span className="text-sm text-gray-500">
            {filteredAndSortedAccounts.length} compte{filteredAndSortedAccounts.length > 1 ? "s" : ""} affiché{filteredAndSortedAccounts.length > 1 ? "s" : ""}
          </span>
        </div>

        {loading && !submitting ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-40" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedAccounts.map((account) => (
              <Card
                key={account.id}
                className={`group hover:shadow-lg transition-all duration-300 border hover:border-blue-200 cursor-pointer ${
                  editingAccountId === account.id ||
                  (accountToDelete?.id === account.id && deleting)
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {editingAccountId === account.id ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        getAccountTypeIcon(account.type)
                      )}
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {account.name}
                          {editingAccountId === account.id && (
                            <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                          )}
                          {accountToDelete?.id === account.id && deleting && (
                            <Loader2 className="h-3 w-3 text-red-600 animate-spin" />
                          )}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`mt-1 ${getAccountTypeColor(
                            account.type
                          )}`}
                        >
                          {account.type}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Actif
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Solde actuel</p>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Devise : {account.currency}</p>
                    {account.created_at && (
                      <p className="text-xs text-gray-500">
                        Créé le{" "}
                        {new Date(account.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleViewDetails(account)}
                      disabled={editingAccountId === account.id || deleting}
                    >
                      <Eye size={16} />
                      Détails
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={editingAccountId === account.id || deleting}
                        >
                          {editingAccountId === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Settings size={16} />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(account)}
                          disabled={editingAccountId === account.id || deleting}
                        >
                          {editingAccountId === account.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4 mr-2" />
                          )}
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(account)}
                          className="text-red-600 focus:text-red-600"
                          disabled={editingAccountId === account.id || deleting}
                        >
                          {accountToDelete?.id === account.id && deleting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {accounts.length === 0 ? "Aucun compte trouvé" : "Aucun résultat"}
              </h3>
              <p className="text-gray-500 mb-4">
                {accounts.length === 0 
                  ? "Commencez par créer votre premier compte financier"
                  : "Aucun compte ne correspond à vos critères de recherche"}
              </p>
              <Button
                onClick={() => {
                  if (accounts.length === 0) {
                    setIsPopoverOpen(true);
                  } else {
                    resetFilters();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus size={18} className="mr-2" />
                )}
                {accounts.length === 0 ? "Créer un compte" : "Réinitialiser les filtres"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte
              {accountToDelete?.name} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du compte</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getAccountTypeIcon(selectedAccount.type)}
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedAccount.name}
                  </h3>
                  <Badge className={getAccountTypeColor(selectedAccount.type)}>
                    {selectedAccount.type}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Solde</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(
                      selectedAccount.balance,
                      selectedAccount.currency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Devise</p>
                  <p className="text-lg font-medium">
                    {selectedAccount.currency}
                  </p>
                </div>
              </div>

              {selectedAccount.created_at && (
                <div>
                  <p className="text-sm text-gray-500">Date de création</p>
                  <p>
                    {new Date(selectedAccount.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}