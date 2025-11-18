"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  useAssetLoan,
  LoanStatus,
  CreateAssetLoanData,
} from "@/hooks/useAssetLoan";
import { useAsset } from "@/hooks/useAsset";
import { useUser } from "@/hooks/useUser";
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
  User,
  Laptop,
  Calendar,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  UserPlus,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non définie";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const getStatusColor = (status: LoanStatus) => {
  return status === "en_cours"
    ? "bg-blue-100 text-blue-800 border-blue-200"
    : "bg-green-100 text-green-800 border-green-200";
};

const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export default function EmployeeAssetsPage() {
  const {
    loans,
    loading: loansLoading,
    error: loansError,
    fetchLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    returnLoan,
    clearError: clearLoansError,
    getActiveLoans,
    getOverdueLoans,
  } = useAssetLoan();

  const { assets, fetchAssets, getAssetsAvailableForLoan } = useAsset();
  const { users, loading: usersLoading, fetchUsers } = useUser();

  const [activeTab, setActiveTab] = useState<LoanStatus | "all" | "overdue">(
    "all"
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<CreateAssetLoanData>({
    asset_id: 0,
    user_id: 0,
    loan_date: new Date().toISOString().split("T")[0],
    due_date: "",
    signature: "",
  });

  useEffect(() => {
    fetchLoans();
    fetchAssets();
    fetchUsers(); // Charger les utilisateurs
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearLoansError();

    try {
      await createLoan(formData);
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearLoansError();

    try {
      await returnLoan(selectedLoan.id, new Date().toISOString().split("T")[0]);
      setIsReturnDialogOpen(false);
      setSelectedLoan(null);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      asset_id: 0,
      user_id: 0,
      loan_date: new Date().toISOString().split("T")[0],
      due_date: "",
      signature: "",
    });
  };

  const availableAssets = getAssetsAvailableForLoan();
  console.log("Available Assets:", availableAssets);
  const activeLoans = getActiveLoans();
  const overdueLoans = getOverdueLoans();
  const activeUsers = users.filter(
    (user) =>
      user.role === "employe" ||
      user.role === "admin" ||
      user.role === "comptable"
  );

  const filteredLoans = loans
    .filter(
      (loan) =>
        loan.asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((loan) => {
      if (activeTab === "all") return true;
      if (activeTab === "overdue") return isOverdue(loan.due_date);
      return loan.status === activeTab;
    });

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    description?: string;
  }) => (
    <Card>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Matériel Employés
          </h1>
          <p className="text-gray-600 mt-2">
            Gestion des prêts de matériel aux employés
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex bg-blue-600 hover:bg-blue-700 text-white items-center gap-2"
                disabled={
                  availableAssets.length === 0 || activeUsers.length === 0
                }
              >
                <Plus className="h-4 w-4" />
                Nouveau Prêt
                {(availableAssets.length === 0 || activeUsers.length === 0) && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-yellow-100 text-yellow-800"
                  >
                    {availableAssets.length === 0
                      ? "Aucun matériel"
                      : "Aucun employé"}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau Prêt de Matériel</DialogTitle>
                <DialogDescription>
                  Attribuez un matériel à un employé pour usage professionnel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Employé *</Label>
                  <Select
                    value={formData.user_id.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_id: parseInt(value),
                      }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement...
                          </div>
                        </SelectItem>
                      ) : activeUsers.length === 0 ? (
                        <SelectItem value="no-users" disabled>
                          Aucun employé disponible
                        </SelectItem>
                      ) : (
                        activeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-xs text-gray-500">
                                {user.email} • {user.role}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Matériel *</Label>
                  <Select
                    value={formData.asset_id.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        asset_id: parseInt(value),
                      }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un matériel" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssets.length === 0 ? (
                        <SelectItem value="no-assets" disabled>
                          Aucun matériel disponible
                        </SelectItem>
                      ) : (
                        availableAssets.map((asset) => (
                          <SelectItem
                            key={asset.id}
                            value={asset.id.toString()}
                          >
                            <div className="flex flex-col">
                              <span>{asset.name}</span>
                              {asset.serial_number && (
                                <span className="text-xs text-gray-500">
                                  S/N: {asset.serial_number}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {availableAssets.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Aucun matériel disponible pour le prêt. Vérifiez que des
                      actifs sont en stock et en service.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de prêt *</Label>
                    <Input
                      type="date"
                      value={formData.loan_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          loan_date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Date de retour prévue</Label>
                    <Input
                      type="date"
                      value={formData.due_date || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                      min={formData.loan_date}
                    />
                  </div>
                </div>

                <div>
                  <Label>Signature (URL ou hash)</Label>
                  <Input
                    value={formData.signature || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        signature: e.target.value,
                      }))
                    }
                    placeholder="Optionnel - pour signature numérique"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    type="submit"
                    disabled={
                      submitting ||
                      availableAssets.length === 0 ||
                      activeUsers.length === 0
                    }
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Créer le prêt"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Prêts en cours"
          value={activeLoans.length}
          icon={Laptop}
          color="text-blue-600"
        />
        <StatCard
          title="En retard"
          value={overdueLoans.length}
          icon={AlertTriangle}
          color="text-red-600"
          description="Retour dépassé"
        />
        <StatCard
          title="Matériels disponibles"
          value={availableAssets.length}
          icon={CheckCircle}
          color="text-green-600"
        />
      </div>

      {/* Alertes */}
      {overdueLoans.length > 0 && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {overdueLoans.length} prêt(s) en retard
                </p>
                <p className="text-sm text-red-600">
                  Certains matériels n'ont pas été retournés à la date prévue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un prêt..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value: LoanStatus | "all" | "overdue") =>
            setActiveTab(value)
          }
        >
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="en_cours">En cours</TabsTrigger>
            <TabsTrigger value="overdue">En retard</TabsTrigger>
            <TabsTrigger value="termine">Terminés</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des prêts */}
      <div className="space-y-4">
        {loansLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredLoans.length > 0 ? (
          filteredLoans.map((loan) => (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status === "en_cours" ? "En cours" : "Terminé"}
                      </Badge>
                      {isOverdue(loan.due_date) &&
                        loan.status === "en_cours" && (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 border-red-200"
                          >
                            En retard
                          </Badge>
                        )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">
                            {loan.asset?.name}
                          </span>
                          {loan.asset?.serial_number && (
                            <span className="text-sm text-gray-500">
                              (S/N: {loan.asset.serial_number})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {loan.user?.name} • {loan.user?.email}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {loan.user?.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Prêt: {formatDate(loan.loan_date)}</span>
                          {loan.due_date && (
                            <span
                              className={
                                isOverdue(loan.due_date) &&
                                loan.status === "en_cours"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              Retour prévu: {formatDate(loan.due_date)}
                            </span>
                          )}
                          {loan.return_date && (
                            <span>
                              Retourné: {formatDate(loan.return_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loan.status === "en_cours" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLoan(loan);
                          setIsReturnDialogOpen(true);
                        }}
                      >
                        Retourner
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (
                              confirm(
                                "Êtes-vous sûr de vouloir supprimer ce prêt ?"
                              )
                            ) {
                              deleteLoan(loan.id);
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
              <Laptop className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun prêt enregistré
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || activeTab !== "all"
                  ? "Aucun prêt ne correspond à vos critères"
                  : "Commencez par créer votre premier prêt de matériel"}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsDialogOpen(true)}
                disabled={
                  availableAssets.length === 0 || activeUsers.length === 0
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Prêt
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de retour */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retour de Matériel</DialogTitle>
            <DialogDescription>
              Confirmez le retour du matériel "{selectedLoan?.asset?.name}" par{" "}
              {selectedLoan?.user?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturn}>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Le matériel sera marqué comme retourné et disponible pour de
                  nouveaux prêts.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReturnDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmer le retour"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
