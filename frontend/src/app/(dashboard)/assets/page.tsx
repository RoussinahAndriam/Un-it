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

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non définie";
  return new Date(dateString).toLocaleDateString("fr-FR");
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

export default function AssetsPage() {
  const {
    assets,
    loading,
    error,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    clearError,
    getAssetsStatistics,
  } = useAsset();

  const [activeTab, setActiveTab] = useState<AssetStatus | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<AssetLocation | "all">(
    "all"
  );

  const [filters, setFilters] = useState<AssetFilters>({});

  const [formData, setFormData] = useState<CreateAssetData>({
    name: "",
    description: "",
    serial_number: "",
    acquisition_date: "",
    acquisition_value: 0,
    status: "neuf",
    location: "en_stock",
  });

  useEffect(() => {
    fetchAssets(filters);
  }, [filters]);

  useEffect(() => {
    const newFilters: AssetFilters = {};
    if (activeTab !== "all") newFilters.status = activeTab;
    if (locationFilter !== "all") newFilters.location = locationFilter;
    if (searchTerm) newFilters.search = searchTerm;
    setFilters(newFilters);
  }, [activeTab, locationFilter, searchTerm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedAsset) {
        await updateAsset(selectedAsset.id, formData);
      } else {
        await createAsset(formData);
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
      description: "",
      serial_number: "",
      acquisition_date: "",
      acquisition_value: 0,
      status: "neuf",
      location: "en_stock",
    });
    setIsEditMode(false);
    setSelectedAsset(null);
  };

  const statistics = getAssetsStatistics();

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                Nouvel Actif
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                    <Label>Nom de l'actif</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
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
                        setFormData((prev) => ({
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
                      setFormData((prev) => ({
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
                        setFormData((prev) => ({
                          ...prev,
                          acquisition_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Valeur d'acquisition</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.acquisition_value || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          acquisition_value: parseFloat(e.target.value),
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: AssetStatus) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neuf">Neuf</SelectItem>
                        <SelectItem value="en_service">En service</SelectItem>
                        <SelectItem value="en_maintenance">
                          En maintenance
                        </SelectItem>
                        <SelectItem value="hors_service">
                          Hors service
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Localisation</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value: AssetLocation) =>
                        setFormData((prev) => ({ ...prev, location: value }))
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

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      </div>

      {/* Filtres et recherche */}
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

      {/* Liste des actifs */}
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
            return (
              <Card
                key={asset.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <AssetIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {asset.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getLocationColor(asset.location)}
                          >
                            {asset.location}
                          </Badge>
                        </div>
                      </div>
                    </div>
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

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-gray-500">
                      {asset.acquisition_date &&
                        `Acheté: ${formatDate(asset.acquisition_date)}`}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAsset(asset);
                            setFormData({
                              name: asset.name,
                              description: asset.description || "",
                              serial_number: asset.serial_number || "",
                              acquisition_date: asset.acquisition_date || "",
                              acquisition_value: asset.acquisition_value || 0,
                              status: asset.status,
                              location: asset.location,
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
                          onClick={() => deleteAsset(asset.id)}
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
                <Button onClick={() => setIsDialogOpen(true)}>
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
