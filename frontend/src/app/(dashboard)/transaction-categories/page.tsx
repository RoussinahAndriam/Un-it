"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  useTransactionCategory,
  TransactionType,
  CreateTransactionCategoryData,
} from "@/hooks/useTransactionCategory";
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
  FolderTree,
  TrendingUp,
  TrendingDown,
  Loader2,
  Edit,
  Trash2,
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

const getTransactionTypeColor = (type: TransactionType) => {
  return type === "revenu"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";
};

export default function TransactionCategoriesPage() {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    getCategoriesByType,
  } = useTransactionCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<CreateTransactionCategoryData>({
    name: "",
    type: "depense",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
      } else {
        await createCategory(formData);
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
      name: "",
      type: "depense",
    });
    setIsEditMode(false);
    setSelectedCategory(null);
  };

  const revenueCategories = getCategoriesByType("revenu");
  const expenseCategories = getCategoriesByType("depense");

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Catégories de Transactions
          </h1>
          <p className="text-gray-600 mt-2">
            Organisez vos revenus et dépenses par catégories
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier la Catégorie" : "Nouvelle Catégorie"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Modifiez les détails de cette catégorie"
                  : "Créez une nouvelle catégorie pour organiser vos transactions"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la catégorie</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="ex: Salaire, Loyer, Nourriture..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Catégories de dépenses */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Catégories de Dépenses
              <Badge variant="secondary" className="ml-2">
                {expenseCategories.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : expenseCategories.length > 0 ? (
              expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FolderTree className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCategory(category);
                          setFormData({
                            name: category.name,
                            type: category.type,
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
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune catégorie de dépense</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catégories de revenus */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Catégories de Revenus
              <Badge variant="secondary" className="ml-2">
                {revenueCategories.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : revenueCategories.length > 0 ? (
              revenueCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FolderTree className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCategory(category);
                          setFormData({
                            name: category.name,
                            type: category.type,
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
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune catégorie de revenu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
