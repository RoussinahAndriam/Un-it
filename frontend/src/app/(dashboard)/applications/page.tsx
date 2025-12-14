// app/applications/page.tsx
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import {
  useApplication,
  ApplicationStatus,
  LicenseType,
  CreatedBy,
  CreateApplicationData,
  Account,
} from "@/hooks/useApplication";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  CheckCircle,
  Users,
  PieChart,
  Loader2,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  Building,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/constants";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function ApplicationPage() {
  // État pour gérer le checkbox "has_license"
  const [hasLicense, setHasLicense] = useState(false);

  // État pour le filtre de compte
  const [accountFilter, setAccountFilter] = useState<number | "all">("all");

  // État pour le filtre de type de création
  const [creationTypeFilter, setCreationTypeFilter] = useState<
    CreatedBy | "all"
  >("all");

  const {
    applications,
    accounts,
    createApplication,
    updateApplication,
    deleteApplication,
    fetchApplications,
    fetchAccounts,
    linkToAccount,
    loading,
    error,
    clearError,
    getTotalCost,
    getApplicationsByStatus,
    getApplicationsByCreationType,
    getApplicationsByAccount,
  } = useApplication();

  // Fonctions utilitaires
  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "suspended":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLicenseTypeColor = (licenseType: LicenseType) => {
    switch (licenseType) {
      case "subscription":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "perpetual":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "trial":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCreationTypeColor = (createdBy: CreatedBy) => {
    switch (createdBy) {
      case "company":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "external":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCreationTypeIcon = (createdBy: CreatedBy) => {
    switch (createdBy) {
      case "company":
        return <Building className="h-3 w-3" />;
      case "external":
        return <ExternalLink className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non défini";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // États du formulaire et UI
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [submitting, setSubmitting] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState<
    number | null
  >(null);

  const [formData, setFormData] = useState<CreateApplicationData>({
    name: "",
    cost: 0,
    user_id: null,
    license_type: null,
    current_users: 0,
    max_users: null,
    purchase_date: null,
    renewal_date: null,
    status: "active",
    account_id: null,
    has_license: false,
  });

  // Gestion du changement de formulaire
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === "has_license") {
        setHasLicense(checked);
        setFormData((prev) => ({
          ...prev,
          has_license: checked,
          license_type: checked ? "subscription" : null,
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "cost" || name === "current_users" || name === "max_users"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === "null" ? null : value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setHasLicense(checked);
    setFormData((prev) => ({
      ...prev,
      has_license: checked,
      license_type: checked ? "subscription" : null,
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedApplication) {
        await updateApplication(selectedApplication.id, formData);
        toast.success("Application modifiée avec succès", {
          description: `"${formData.name}" a été mise à jour`,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        });
      } else {
        await createApplication(formData);
        toast.success("Application créée avec succès", {
          description: `"${formData.name}" a été ajoutée à vos applications`,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        });
      }
      resetForm();
      setIsPopoverOpen(false);
      fetchApplications();
    } catch (err: any) {
      console.error("Erreur lors de l'opération :", err);
      toast.error("Erreur lors de l'opération", {
        description: err.message || "Une erreur est survenue",
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion des actions
  const handleViewDetails = (application: any) => {
    setSelectedApplication(application);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (application: any) => {
    setSelectedApplication(application);
    setEditingApplicationId(application.id);
    setFormData({
      name: application.name,
      cost: application.cost,
      user_id: application.user_id,
      license_type: application.license_type,
      current_users: application.current_users,
      max_users: application.max_users,
      purchase_date: application.purchase_date,
      renewal_date: application.renewal_date,
      status: application.status,
      account_id: application.account_id,
      has_license: !!application.license_type,
    });
    setHasLicense(!!application.license_type);
    setIsEditMode(true);
    setIsPopoverOpen(true);
  };

  const handleQuickDelete = (application: any) => {
    toast.custom(
      (t) => (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                Confirmer la suppression
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Êtes-vous sûr de vouloir supprimer l'application "
                {application.name}" ?
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.dismiss(t)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    toast.dismiss(t);
                    try {
                      await deleteApplication(application.id);
                      toast.success("Application supprimée", {
                        description: `"${application.name}" a été supprimée`,
                        icon: (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ),
                      });
                      fetchApplications();
                    } catch (error: any) {
                      toast.error("Erreur", {
                        description: "Impossible de supprimer l'application",
                      });
                    }
                  }}
                  className="flex-1"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: 10000,
      }
    );
  };

  const handleLinkToAccount = async (application: any, accountId: number) => {
    try {
      await linkToAccount(application.id, accountId);
      toast.success("Application liée au compte", {
        description: `"${application.name}" a été liée au compte`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
      fetchApplications();
    } catch (error: any) {
      toast.error("Erreur", {
        description: "Impossible de lier au compte",
      });
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: "",
      cost: 0,
      user_id: null,
      license_type: null,
      current_users: 0,
      max_users: null,
      purchase_date: null,
      renewal_date: null,
      status: "active",
      account_id: null,
      has_license: false,
    });
    setHasLicense(false);
    setIsEditMode(false);
    setSelectedApplication(null);
    setEditingApplicationId(null);
    clearError();
  };

  // Filtrer les applications
  const getFilteredApplications = () => {
    let filtered = applications;

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Filtre par compte
    if (accountFilter !== "all") {
      filtered = filtered.filter((app) => app.account_id === accountFilter);
    }

    // Filtre par type de création
    if (creationTypeFilter !== "all") {
      filtered = filtered.filter(
        (app) => app.created_by === creationTypeFilter
      );
    }

    return filtered;
  };

  const filteredApplications = getFilteredApplications();

  // Calcul des statistiques
  const totalCost = getTotalCost();
  const activeApplications = getApplicationsByStatus("active").length;
  const expiringApplications = applications.filter((app) => {
    if (!app.renewal_date || app.status !== "active") return false;
    const renewalDate = new Date(app.renewal_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return renewalDate <= thirtyDaysFromNow && renewalDate >= today;
  }).length;

  const companyCreatedApps = getApplicationsByCreationType("company").length;
  const externalLicensedApps = getApplicationsByCreationType("external").length;

  // Charger les données au montage
  useEffect(() => {
    fetchApplications();
    fetchAccounts();
  }, [fetchApplications, fetchAccounts]);

  // Toast de bienvenue
  useEffect(() => {
    if (!loading && applications.length > 0) {
      toast.success(`Chargement réussi`, {
        description: `${applications.length} application(s) chargée(s)`,
        duration: 3000,
      });
    }
  }, [loading, applications.length]);

  // Composant de carte de statistiques
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "text-blue-700",
    description,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    description?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color} mt-2`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Applications UN-IT
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez toutes vos applications au même endroit
          </p>
        </div>

        {/* Bouton Nouvelle Application */}
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
              Nouvelle Application
            </Button>
          </DialogTrigger>
          <DialogContent className="w-96 p-6 bg-white shadow-xl rounded-xl border-0 z-50">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier l'application" : "Nouvelle application"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Modifiez les détails de l'application"
                  : "Ajoutez une nouvelle application à votre journal"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Nom de l'application *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ex: Microsoft Office"
                  className="w-full"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="cost"
                  className="text-sm font-medium text-gray-700"
                >
                  Coût *
                </Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost || ""}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="account_id"
                  className="text-sm font-medium text-gray-700"
                >
                  Compte associé *
                </Label>
                <Select
                  value={formData.account_id?.toString() || ""}
                  onValueChange={(value) =>
                    handleSelectChange("account_id", value)
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span>{account.name}</span>
                          <span className="text-xs text-gray-500">
                            ({formatCurrency(account.balance)}{" "}
                            {account.currency})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Checkbox pour licence */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_license"
                  checked={hasLicense}
                  onCheckedChange={handleCheckboxChange}
                  disabled={submitting}
                />
                <Label
                  htmlFor="has_license"
                  className="text-sm font-medium text-gray-700"
                >
                  Cette application a une licence externe
                </Label>
              </div>

              {/* Type de licence - Conditionnel */}
              {hasLicense && (
                <div className="space-y-2">
                  <Label
                    htmlFor="license_type"
                    className="text-sm font-medium text-gray-700"
                  >
                    Type de licence *
                  </Label>
                  <Select
                    value={formData.license_type || ""}
                    onValueChange={(value) =>
                      handleSelectChange("license_type", value)
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Abonnement</SelectItem>
                      <SelectItem value="perpetual">Perpétuelle</SelectItem>
                      <SelectItem value="trial">Essai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700"
                  >
                    Statut *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expirée</SelectItem>
                      <SelectItem value="suspended">Suspendue</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="current_users"
                    className="text-sm font-medium text-gray-700"
                  >
                    Utilisateurs actuels
                  </Label>
                  <Input
                    id="current_users"
                    name="current_users"
                    type="number"
                    value={formData.current_users || ""}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="max_users"
                    className="text-sm font-medium text-gray-700"
                  >
                    Utilisateurs max
                  </Label>
                  <Input
                    id="max_users"
                    name="max_users"
                    type="number"
                    value={formData.max_users || ""}
                    onChange={handleChange}
                    placeholder="Illimité"
                    className="w-full"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="purchase_date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Date d'achat
                  </Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={formData.purchase_date || ""}
                    onChange={handleChange}
                    className="w-full"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="renewal_date"
                  className="text-sm font-medium text-gray-700"
                >
                  Date de renouvellement
                </Label>
                <Input
                  id="renewal_date"
                  name="renewal_date"
                  type="date"
                  value={formData.renewal_date || ""}
                  onChange={handleChange}
                  className="w-full"
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
                    "Modifier"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(value: ApplicationStatus | "all") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
              <SelectItem value="suspended">Suspendues</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={accountFilter.toString()}
            onValueChange={(value) =>
              setAccountFilter(value === "all" ? "all" : parseInt(value))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par compte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les comptes</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={creationTypeFilter}
            onValueChange={(value: CreatedBy | "all") =>
              setCreationTypeFilter(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type de création" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="company">
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span>Interne</span>
                </div>
              </SelectItem>
              <SelectItem value="external">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  <span>Externe</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-500">
          {filteredApplications.length} application
          {filteredApplications.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Coût Total"
          value={formatCurrency(totalCost)}
          icon={TrendingUp}
          color="text-blue-700"
        />
        <StatCard
          title="Applications Actives"
          value={activeApplications}
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatCard
          title="Interne / Externe"
          value={`${companyCreatedApps} / ${externalLicensedApps}`}
          icon={PieChart}
          color="text-purple-600"
          description="Créées par l'entreprise / Avec licence"
        />
        <StatCard
          title="Expirent bientôt"
          value={expiringApplications}
          icon={AlertTriangle}
          color="text-orange-600"
          description="Dans les 30 prochains jours"
        />
      </div>

      {/* Liste des applications */}
      <div className="space-y-4">
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
        ) : filteredApplications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <Card
                key={application.id}
                className={`group hover:shadow-lg transition-all duration-300 border hover:border-blue-200 cursor-pointer ${
                  editingApplicationId === application.id
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {application.name}
                          {editingApplicationId === application.id && (
                            <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                          )}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={getStatusColor(application.status)}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(application.status)}
                              {application.status}
                            </div>
                          </Badge>
                          {application.license_type && (
                            <Badge
                              variant="outline"
                              className={getLicenseTypeColor(
                                application.license_type
                              )}
                            >
                              {application.license_type}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={getCreationTypeColor(
                              application.created_by
                            )}
                          >
                            <div className="flex items-center gap-1">
                              {getCreationTypeIcon(application.created_by)}
                              {application.created_by === "company"
                                ? "Interne"
                                : "Externe"}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(application.cost)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Coût</p>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2">
                    {application.account && (
                      <div className="flex justify-between items-center">
                        <span>Compte:</span>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Wallet className="h-3 w-3" />
                          {application.account.name}
                        </Badge>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Utilisateurs:</span>
                      <span className="font-medium">
                        {application.current_users}
                        {application.max_users && ` / ${application.max_users}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Achat:</span>
                      <span>{formatDate(application.purchase_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Renouvellement:</span>
                      <span>{formatDate(application.renewal_date)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleViewDetails(application)}
                      disabled={editingApplicationId === application.id}
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
                          disabled={editingApplicationId === application.id}
                        >
                          {editingApplicationId === application.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Settings size={16} />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(application)}
                          disabled={editingApplicationId === application.id}
                        >
                          {editingApplicationId === application.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4 mr-2" />
                          )}
                          Modifier
                        </DropdownMenuItem>
                        {application.account_id && (
                          <DropdownMenuItem asChild>
                            <Select
                              onValueChange={(value) =>
                                handleLinkToAccount(
                                  application,
                                  parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger className="border-0 p-0 h-auto">
                                <div className="flex items-center cursor-pointer w-full px-2 py-1.5 text-sm">
                                  <Wallet className="h-4 w-4 mr-2" />
                                  Changer de compte
                                </div>
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
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleQuickDelete(application)}
                          className="text-red-600 focus:text-red-600"
                          disabled={editingApplicationId === application.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
                Aucune application trouvée
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter === "all" &&
                accountFilter === "all" &&
                creationTypeFilter === "all"
                  ? "Commencez par créer votre première application"
                  : "Aucune application avec ces critères de filtrage"}
              </p>
              <Button
                onClick={() => setIsPopoverOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus size={18} className="mr-2" />
                )}
                Créer une application
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'application</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedApplication.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      className={getStatusColor(selectedApplication.status)}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedApplication.status)}
                        {selectedApplication.status}
                      </div>
                    </Badge>
                    {selectedApplication.license_type && (
                      <Badge
                        variant="outline"
                        className={getLicenseTypeColor(
                          selectedApplication.license_type
                        )}
                      >
                        {selectedApplication.license_type}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={getCreationTypeColor(
                        selectedApplication.created_by
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getCreationTypeIcon(selectedApplication.created_by)}
                        {selectedApplication.created_by === "company"
                          ? "Interne"
                          : "Externe"}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Coût</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(selectedApplication.cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilisateurs</p>
                    <p className="text-lg font-medium">
                      {selectedApplication.current_users}
                      {selectedApplication.max_users &&
                        ` / ${selectedApplication.max_users}`}
                    </p>
                  </div>
                  {selectedApplication.account && (
                    <div>
                      <p className="text-sm text-gray-500">Compte associé</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Wallet className="h-4 w-4 text-gray-600" />
                        <p className="text-lg font-medium">
                          {selectedApplication.account.name}
                        </p>
                        <Badge variant="outline" className="ml-2">
                          {formatCurrency(selectedApplication.account.balance)}{" "}
                          {selectedApplication.account.currency}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Date d'achat</p>
                    <p className="text-lg font-medium">
                      {formatDate(selectedApplication.purchase_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Date de renouvellement
                    </p>
                    <p className="text-lg font-medium">
                      {formatDate(selectedApplication.renewal_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type de création</p>
                    <p className="text-lg font-medium">
                      {selectedApplication.created_by === "company"
                        ? "Interne (Créée par l'entreprise)"
                        : "Externe (Avec licence)"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedApplication.created_at && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">
                    Créé le{" "}
                    {new Date(
                      selectedApplication.created_at
                    ).toLocaleDateString("fr-FR")}
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
