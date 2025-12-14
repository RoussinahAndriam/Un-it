"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  useAsset,
  AssetStatus,
  AssetLocation,
  CreateAssetData,
  AssetFilters,
} from "@/hooks/useAsset";
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
  Search,
  Laptop,
  Smartphone,
  Monitor,
  Server,
  Box,
  Loader2,
  Edit,
  Trash2,
  Filter,
  Download,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone as MobileIcon,
  AlertCircle,
  X,
  Calendar,
  Tag,
  MapPin,
  DollarSign,
  FileText,
  User,
  Building,
  CheckCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  Eye,
  Clock,
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non définie";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusColor = (status: AssetStatus) => {
  switch (status) {
    case "neuf":
      return "bg-green-100 text-green-800 border-green-200";
    case "en_service":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "en_maintenance":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "hors_service":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: AssetStatus) => {
  switch (status) {
    case "neuf":
      return "Neuf";
    case "en_service":
      return "En service";
    case "en_maintenance":
      return "En maintenance";
    case "hors_service":
      return "Hors service";
    default:
      return status;
  }
};

const getStatusIcon = (status: AssetStatus) => {
  switch (status) {
    case "neuf":
      return CheckCircle;
    case "en_service":
      return CheckCircle;
    case "en_maintenance":
      return Settings;
    case "hors_service":
      return AlertTriangle;
    default:
      return CheckCircle;
  }
};

const getLocationColor = (location: AssetLocation) => {
  switch (location) {
    case "en_stock":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "bureau":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "pret_employe":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getLocationLabel = (location: AssetLocation) => {
  switch (location) {
    case "en_stock":
      return "En stock";
    case "bureau":
      return "Au bureau";
    case "pret_employe":
      return "Prêté à un employé";
    default:
      return location;
  }
};

const getLocationIcon = (location: AssetLocation) => {
  switch (location) {
    case "en_stock":
      return Building;
    case "bureau":
      return Building;
    case "pret_employe":
      return User;
    default:
      return MapPin;
  }
};

const getAssetIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("ordinateur") || lowerName.includes("laptop"))
    return Laptop;
  if (lowerName.includes("téléphone") || lowerName.includes("phone"))
    return Smartphone;
  if (lowerName.includes("écran") || lowerName.includes("monitor"))
    return Monitor;
  if (lowerName.includes("serveur") || lowerName.includes("server"))
    return Server;
  return Box;
};

const getAccountIcon = (type: string) => {
  switch (type) {
    case "bancaire":
      return CreditCard;
    case "mobile_money":
      return MobileIcon;
    case "especes":
      return Banknote;
    default:
      return Wallet;
  }
};

const getAccountTypeLabel = (type: string) => {
  switch (type) {
    case "bancaire":
      return "Compte Bancaire";
    case "mobile_money":
      return "Mobile Money";
    case "especes":
      return "Espèces";
    default:
      return "Autre";
  }
};

const formatBalance = (balance: number, currency: string) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "MGA",
  }).format(balance);
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-2`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="p-3 rounded-full bg-gray-50">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Composant pour afficher les détails d'un actif dans un dialog
const AssetDetailDialog = ({
  asset,
  accounts,
  onEdit,
  onDelete,
  onClose,
  isOpen,
}: {
  asset: any;
  accounts: any[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isOpen: boolean;
}) => {
  if (!asset) return null;

  const AssetIcon = getAssetIcon(asset.name);
  const StatusIcon = getStatusIcon(asset.status);
  const LocationIcon = getLocationIcon(asset.location);
  const account = accounts.find((acc) => acc.id === asset.account_id);
  const AccountIcon = account ? getAccountIcon(account.type) : Wallet;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-40xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <AssetIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {asset.name}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  ID: {asset.id} • Créé le {formatDate(asset.created_at)}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1  gap-6">
          {/* Section gauche : Informations principales */}
          <div className="lg:col-span-2 space-y-4">
            {/* Statut et Localisation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <LocationIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Localisation
                      </p>
                    </div>
                  </div>
                  <Badge className={getLocationColor(asset.location)}>
                    {getLocationLabel(asset.location)}
                  </Badge>
                  <div>
                    <Badge className={getStatusColor(asset.status)}>
                      {getStatusLabel(asset.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              {/* Description */}
              {asset.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-line">
                      {asset.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Informations financières */}
            <Card>
              <CardHeader>
                <CardTitle className="items-center gap-4 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Informations financières
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Valeur d'acquisition
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(asset.acquisition_value || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Date d'acquisition
                      </p>
                      <p className="text-lg font-semibold">
                        {formatDate(asset.acquisition_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations techniques */}
            <Card>
              <CardHeader>
                <CardTitle className=" items-center gap-4 text-lg">
                  <Settings className="h-5 w-5" />
                  Informations techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {asset.serial_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Numéro de série
                    </p>
                    <p className="font-mono bg-gray-50 p-2 rounded-md mt-1">
                      {asset.serial_number}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Date de création
                  </p>
                  <p className="font-medium">{formatDate(asset.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Dernière mise à jour
                  </p>
                  <p className="font-medium">{formatDate(asset.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="h-5 w-5" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={onEdit}
                  className="w-full justify-start gap-2   text-blue-600"
                  variant="outline"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  onClick={onDelete}
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
                <Separator />
                <div className="text-xs text-gray-500 pt-2">
                  <p>
                    Cliquez sur modifier pour mettre à jour les informations
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Dialog pour créer/modifier un actif
const AssetFormDialog = ({
  isOpen,
  onOpenChange,
  isEditMode,
  selectedAsset,
  formData,
  setFormData,
  accounts,
  loadingAccounts,
  balanceError,
  submitting,
  handleSubmit,
  resetForm,
}: any) => {
  const getAccountInfo = (accountId: number | null | undefined) => {
    if (!accountId) return null;
    return accounts.find((acc) => acc.id === accountId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier l'Actif" : "Nouvel Actif Matériel"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifiez les détails de cet actif matériel"
              : "Ajoutez un nouveau matériel à l'inventaire"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom de l'actif *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="ex: Ordinateur Portable Dell"
                required
              />
            </div>
            <div>
              <Label>Numéro de série</Label>
              <Input
                value={formData.serial_number || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    serial_number: e.target.value,
                  }))
                }
                placeholder="Optionnel"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description détaillée de l'actif..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date d'acquisition</Label>
              <Input
                type="date"
                value={formData.acquisition_date || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    acquisition_date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Valeur d'acquisition (MGA)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.acquisition_value || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    acquisition_value: e.target.value
                      ? parseFloat(e.target.value)
                      : 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: AssetStatus) =>
                  setFormData((prev: any) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="en_service">En service</SelectItem>
                  <SelectItem value="en_maintenance">En maintenance</SelectItem>
                  <SelectItem value="hors_service">Hors service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Localisation *</Label>
              <Select
                value={formData.location}
                onValueChange={(value: AssetLocation) =>
                  setFormData((prev: any) => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_stock">En stock</SelectItem>
                  <SelectItem value="bureau">Au bureau</SelectItem>
                  <SelectItem value="pret_employe">
                    Prêté à un employé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Compte de financement</Label>
            <Select
              value={formData.account_id?.toString() || "none"}
              onValueChange={(value) =>
                setFormData((prev: any) => ({
                  ...prev,
                  account_id: value === "none" ? undefined : parseInt(value),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un compte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun compte</SelectItem>
                {loadingAccounts ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des comptes...
                    </div>
                  </SelectItem>
                ) : (
                  accounts.map((account: any) => {
                    const AccountIcon = getAccountIcon(account.type);
                    return (
                      <SelectItem
                        key={account.id}
                        value={account.id.toString()}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <AccountIcon className="h-4 w-4" />
                            <span>{account.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatBalance(account.balance, account.currency)}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>

            {balanceError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{balanceError}</AlertDescription>
              </Alert>
            )}

            {formData.account_id && !balanceError && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Solde disponible:</span>
                  <span className="font-bold">
                    {formatBalance(
                      getAccountInfo(formData.account_id)?.balance || 0,
                      getAccountInfo(formData.account_id)?.currency || "MGA"
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || !!balanceError}
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
  );
};

export default function AssetsPage() {
  const {
    assets,
    accounts,
    loading,
    loadingAccounts,
    error,
    fetchAssets,
    fetchAccounts,
    createAsset,
    updateAsset,
    deleteAsset,
    clearError,
    getAssetsStatistics,
  } = useAsset();

  const [activeTab, setActiveTab] = useState<AssetStatus | "all">("all");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<AssetLocation | "all">(
    "all"
  );
  const [filters, setFilters] = useState<AssetFilters>({});
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAssetData>({
    name: "",
    description: "",
    serial_number: "",
    acquisition_date: "",
    acquisition_value: 0,
    status: "neuf",
    location: "en_stock",
    account_id: undefined,
  });

  useEffect(() => {
    fetchAssets(filters);
  }, [filters, fetchAssets]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const newFilters: AssetFilters = {};
    if (activeTab !== "all") newFilters.status = activeTab;
    if (locationFilter !== "all") newFilters.location = locationFilter;
    if (searchTerm) newFilters.search = searchTerm;
    setFilters(newFilters);
  }, [activeTab, locationFilter, searchTerm]);

  useEffect(() => {
    if (
      formData.account_id &&
      formData.acquisition_value &&
      formData.acquisition_value > 0
    ) {
      const selectedAccount = accounts.find(
        (acc) => acc.id === formData.account_id
      );
      if (
        selectedAccount &&
        selectedAccount.balance < formData.acquisition_value
      ) {
        setBalanceError(
          `Solde insuffisant. Solde disponible: ${formatBalance(
            selectedAccount.balance,
            selectedAccount.currency
          )}`
        );
      } else {
        setBalanceError(null);
      }
    } else {
      setBalanceError(null);
    }
  }, [formData.account_id, formData.acquisition_value, accounts]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Form data being submitted:", formData);

    if (balanceError) {
      alert("Veuillez vérifier le solde du compte sélectionné");
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedAsset) {
        console.log("Updating asset:", selectedAsset.id, formData);
        await updateAsset(selectedAsset.id, formData);
      } else {
        await createAsset(formData);
      }
      resetForm();
      setIsFormDialogOpen(false);
      setIsDetailDialogOpen(false);
    } catch (err: any) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      serial_number: "",
      acquisition_date: "",
      acquisition_value: 0,
      status: "neuf",
      location: "en_stock",
      account_id: undefined,
    });
    setIsEditMode(false);
    setSelectedAsset(null);
    setBalanceError(null);
  };

  const handleCardClick = (asset: any) => {
    console.log("Card clicked:", asset);
    setSelectedAsset(asset);
    setIsDetailDialogOpen(true);
  };

  const handleEditFromDetail = () => {
    if (selectedAsset) {
      console.log("Editing from detail:", selectedAsset);
      setFormData({
        name: selectedAsset.name,
        description: selectedAsset.description || "",
        serial_number: selectedAsset.serial_number || "",
        acquisition_date: selectedAsset.acquisition_date || "",
        acquisition_value: selectedAsset.acquisition_value || 0,
        status: selectedAsset.status,
        location: selectedAsset.location,
        account_id: selectedAsset.account_id || undefined,
      });
      setIsEditMode(true);
      setIsDetailDialogOpen(false);
      setIsFormDialogOpen(true);
    }
  };

  const handleDeleteFromDetail = () => {
    if (selectedAsset) {
      if (
        window.confirm(
          `Êtes-vous sûr de vouloir supprimer l'actif "${selectedAsset.name}" ? Cette action est irréversible.`
        )
      ) {
        deleteAsset(selectedAsset.id);
        setIsDetailDialogOpen(false);
      }
    }
  };

  const getAccountInfo = (accountId: number | null | undefined) => {
    if (!accountId) return null;
    return accounts.find((acc) => acc.id === accountId);
  };

  const statistics = getAssetsStatistics();

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Actifs Matériels</h1>
          <p className="text-gray-600 mt-2">
            Inventaire et suivi de tous les matériels UN-IT
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm();
              setIsFormDialogOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Nouvel Actif
          </Button>
        </div>
      </div>

      {/* Dialog pour créer/modifier */}
      <AssetFormDialog
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        isEditMode={isEditMode}
        selectedAsset={selectedAsset}
        formData={formData}
        setFormData={setFormData}
        accounts={accounts}
        loadingAccounts={loadingAccounts}
        balanceError={balanceError}
        submitting={submitting}
        handleSubmit={handleSubmit}
        resetForm={() => {
          resetForm();
          setIsFormDialogOpen(false);
        }}
      />

      {/* Dialog pour afficher les détails */}
      <AssetDetailDialog
        asset={selectedAsset}
        accounts={accounts}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        onClose={() => setIsDetailDialogOpen(false)}
        isOpen={isDetailDialogOpen}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Actifs"
          value={statistics.total}
          icon={Box}
          color="text-blue-600"
        />
        <StatCard
          title="En service"
          value={statistics.byStatus.en_service}
          icon={Laptop}
          color="text-green-600"
        />
        <StatCard
          title="En maintenance"
          value={statistics.byStatus.en_maintenance}
          icon={Monitor}
          color="text-yellow-600"
        />
        <StatCard
          title="Valeur totale"
          value={formatCurrency(statistics.totalValue)}
          icon={Server}
          color="text-purple-600"
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comptes</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">
                  {accounts.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingAccounts ? "Chargement..." : "Actifs"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-indigo-50">
                <CreditCard className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un actif..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={locationFilter}
            onValueChange={(value: AssetLocation | "all") =>
              setLocationFilter(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes les locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les locations</SelectItem>
              <SelectItem value="en_stock">En stock</SelectItem>
              <SelectItem value="bureau">Au bureau</SelectItem>
              <SelectItem value="pret_employe">Prêté</SelectItem>
            </SelectContent>
          </Select>

          <Tabs
            value={activeTab}
            onValueChange={(value: AssetStatus | "all") => setActiveTab(value)}
          >
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="neuf">Neufs</TabsTrigger>
              <TabsTrigger value="en_service">En service</TabsTrigger>
              <TabsTrigger value="en_maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="hors_service">Hors service</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Grille des cartes d'actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
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
          ))
        ) : assets.length > 0 ? (
          assets.map((asset) => {
            const AssetIcon = getAssetIcon(asset.name);
            const account = getAccountInfo(asset.account_id);

            return (
              <Card
                key={asset.id}
                className="hover:shadow-md transition-shadow cursor-pointer group hover:border-blue-300"
                onClick={() => handleCardClick(asset)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <AssetIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold group-hover:text-blue-700 transition-colors">
                          {asset.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getStatusColor(asset.status)}>
                            {getStatusLabel(asset.status)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getLocationColor(asset.location)}
                          >
                            {getLocationLabel(asset.location)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {asset.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {asset.description}
                    </p>
                  )}

                  {asset.serial_number && (
                    <p className="text-sm">
                      <span className="font-medium">S/N:</span>{" "}
                      {asset.serial_number}
                    </p>
                  )}

                  {asset.acquisition_value && (
                    <p className="text-lg font-bold text-blue-700">
                      {formatCurrency(asset.acquisition_value)}
                    </p>
                  )}

                  {account && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      {(() => {
                        const AccountIcon = getAccountIcon(account.type);
                        return (
                          <AccountIcon className="h-4 w-4 text-gray-600" />
                        );
                      })()}
                      <span className="text-sm font-medium">
                        {account.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatBalance(account.balance, account.currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-gray-500">
                      {asset.acquisition_date &&
                        `Acheté: ${formatDate(asset.acquisition_date)}`}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(asset);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                            setFormData({
                              name: asset.name,
                              description: asset.description || "",
                              serial_number: asset.serial_number || "",
                              acquisition_date: asset.acquisition_date || "",
                              acquisition_value: asset.acquisition_value || 0,
                              status: asset.status,
                              location: asset.location,
                              account_id: asset.account_id || undefined,
                            });
                            setIsEditMode(true);
                            setIsFormDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Êtes-vous sûr de vouloir supprimer cet actif ?"
                              )
                            ) {
                              deleteAsset(asset.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Box className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Aucun actif matériel
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || activeTab !== "all" || locationFilter !== "all"
                    ? "Aucun actif ne correspond à vos critères"
                    : "Commencez par enregistrer votre premier actif matériel"}
                </p>
                <Button onClick={() => setIsFormDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Actif
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
