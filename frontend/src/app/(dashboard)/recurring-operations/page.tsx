"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  useRecurringOperation,
  FrequencyType,
  CreateRecurringOperationData,
} from "@/hooks/useRecurringOperation";
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
  Calendar,
  Repeat,
  Bell,
  Loader2,
  Edit,
  Trash2,
  Play,
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
import { formatCurrency } from "@/constants";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non définie";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const getFrequencyColor = (frequency: FrequencyType) => {
  switch (frequency) {
    case "mensuel":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "trimestriel":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "annuel":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTransactionTypeColor = (type: string) => {
  return type === "revenu"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";
};

export default function RecurringOperationsPage() {
  const { accounts, fetchAccounts } = useAccount();
  const { categories, fetchCategories } = useTransactionCategory();
  const {
    operations,
    loading,
    error,
    fetchOperations,
    createOperation,
    updateOperation,
    deleteOperation,
    executeOperation,
    clearError,
    getUpcomingOperations,
    getOperationsByType,
  } = useRecurringOperation();

  const [activeTab, setActiveTab] = useState<"all" | "revenu" | "depense">(
    "all"
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<CreateRecurringOperationData>({
    description: "",
    type: "depense",
    amount: 0,
    frequency: "mensuel",
    due_day: 1,
    account_id: null,
    transaction_category_id: null,
  });

  useEffect(() => {
    fetchOperations();
    fetchAccounts();
    fetchCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedOperation) {
        await updateOperation(selectedOperation.id, formData);
      } else {
        await createOperation(formData);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      type: "depense",
      amount: 0,
      frequency: "mensuel",
      due_day: 1,
      account_id: null,
      transaction_category_id: null,
    });
    setIsEditMode(false);
    setSelectedOperation(null);
  };

  const handleExecuteOperation = async (id: number) => {
    try {
      await executeOperation(id);
      fetchOperations();
    } catch (err) {
      console.error("Erreur lors de l'exécution:", err);
    }
  };

  const upcomingOperations = getUpcomingOperations(7);
  const filteredOperations =
    activeTab === "all" ? operations : getOperationsByType(activeTab);

  const revenueCategories = categories.filter((cat) => cat.type === "revenu");
  const expenseCategories = categories.filter((cat) => cat.type === "depense");

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dépenses Fixes & Revenus Récurrents
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos opérations financières automatiques et recevez des alertes
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              Nouvelle Opération
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode
                  ? "Modifier l'Opération"
                  : "Nouvelle Opération Récurrente"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Modifiez les détails de cette opération récurrente"
                  : "Configurez une nouvelle opération qui se répète automatiquement"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="ex: Loyer, Salaire, Abonnement..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "revenu" | "depense") =>
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
                  <Label>Fréquence</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: FrequencyType) =>
                      setFormData((prev) => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="trimestriel">Trimestriel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jour d'échéance</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.due_day}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        due_day: parseInt(e.target.value),
                      }))
                    }
                    required
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Compte</Label>
                  <Select
                    required
                    value={formData.account_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        account_id: value ? parseInt(value) : null,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Compte" />
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
                  <Label>Catégorie</Label>
                  <Select
                    required
                    value={formData.transaction_category_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        transaction_category_id: value ? parseInt(value) : null,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categorie" />
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
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
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

      {/* Alertes des prochaines échéances */}
      {upcomingOperations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="h-5 w-5" />
              Échéances cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingOperations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge
                        className={getTransactionTypeColor(operation.type)}
                      >
                        {operation.type === "revenu" ? "Revenu" : "Dépense"}
                      </Badge>
                      <span className="font-semibold">
                        {operation.description}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(operation.amount)} • {operation.frequency}{" "}
                      • Jour {operation.due_day} • Prochaine échéance:{" "}
                      {formatDate(operation.next_due_date)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleExecuteOperation(operation.id)}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Exécuter
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(value: "all" | "revenu" | "depense") =>
            setActiveTab(value)
          }
        >
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="depense">Dépenses</TabsTrigger>
            <TabsTrigger value="revenu">Revenus</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des opérations récurrentes */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredOperations.length > 0 ? (
          filteredOperations.map((operation) => (
            <Card
              key={operation.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge
                        className={getTransactionTypeColor(operation.type)}
                      >
                        {operation.type === "revenu" ? "Revenu" : "Dépense"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getFrequencyColor(operation.frequency)}
                      >
                        {operation.frequency}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold">{operation.description}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(operation.amount)} • Jour{" "}
                          {operation.due_day}
                          {operation.next_due_date &&
                            ` • Prochaine: ${formatDate(
                              operation.next_due_date
                            )}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecuteOperation(operation.id)}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Exécuter
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOperation(operation);
                            setFormData({
                              description: operation.description,
                              type: operation.type,
                              amount: operation.amount,
                              frequency: operation.frequency,
                              due_day: operation.due_day,
                              account_id: operation.account_id,
                              transaction_category_id:
                                operation.transaction_category_id,
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
                          onClick={() => deleteOperation(operation.id)}
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
              <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune opération récurrente
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === "all"
                  ? "Configurez vos premières opérations récurrentes"
                  : `Aucune opération ${
                      activeTab === "revenu" ? "de revenu" : "de dépense"
                    } récurrente`}
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Opération
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
