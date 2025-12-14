"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
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
  Undo2,
  Trash,
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

// Composant de signature numérique
const SignaturePad = ({
  onSave,
  onClear,
  value,
  onChange,
}: {
  onSave: (signature: string) => void;
  onClear: () => void;
  value: string;
  onChange: (value: string) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        setCtx(context);
        setupCanvas(context, canvas);

        // Charger la signature existante si elle existe
        if (value) {
          loadSignature(value);
        }
      }
    }
  }, [value]);

  const setupCanvas = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#000000";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const loadSignature = (signatureData: string) => {
    if (canvasRef.current && ctx && signatureData) {
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(
          0,
          0,
          canvasRef.current!.width,
          canvasRef.current!.height
        );
        ctx.drawImage(image, 0, 0);
        setIsEmpty(false);
      };
      image.src = signatureData;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);

    // Sauvegarder automatiquement
    saveSignature();
  };

  const saveSignature = () => {
    if (canvasRef.current && !isEmpty) {
      const signatureData = canvasRef.current.toDataURL("image/png");
      onChange(signatureData);
      onSave(signatureData);
    }
  };

  const clearSignature = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setIsEmpty(true);
      onChange("");
      onClear();
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="w-full h-40 border rounded-md cursor-crosshair bg-white touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            if (!ctx || !canvasRef.current) return;
            const touch = e.touches[0];
            const rect = canvasRef.current.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
            setIsEmpty(false);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            if (!isDrawing || !ctx || !canvasRef.current) return;
            const touch = e.touches[0];
            const rect = canvasRef.current.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            ctx.lineTo(x, y);
            ctx.stroke();
          }}
          onTouchEnd={() => {
            if (!ctx) return;
            ctx.closePath();
            setIsDrawing(false);
            saveSignature();
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">Signez dans la zone ci-dessus</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
              className="h-8"
            >
              <Trash className="h-3 w-3 mr-1" />
              Effacer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={saveSignature}
              disabled={isEmpty}
              className="h-8"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
      {value && (
        <div className="p-2 border rounded bg-gray-50">
          <p className="text-xs text-gray-600">Signature enregistrée ✓</p>
        </div>
      )}
    </div>
  );
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

  // État pour afficher les détails d'un prêt spécifique
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<any>(null);
  const [showLoanDetails, setShowLoanDetails] = useState(false);

  const [formData, setFormData] = useState<CreateAssetLoanData>({
    asset_id: 0,
    user_id: 0,
    loan_date: new Date().toISOString().split("T")[0],
    due_date: "",
    signature: "",
  });

  useEffect(() => {
    console.log("Initialisation du composant, chargement des données...");
    fetchLoans();
    fetchAssets();
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("Loans data:", loans);
    console.log("Assets data:", assets);
    console.log("Users data:", users);
    console.log("Loans loading:", loansLoading);
    console.log("Loans error:", loansError);
  }, [loans, assets, users, loansLoading, loansError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearLoansError();

    try {
      console.log("Creating loan with data:", formData);
      await createLoan(formData);
      resetForm();
      setIsDialogOpen(false);
      fetchLoans();
      fetchAssets();
    } catch (err) {
      console.error("Erreur création prêt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearLoansError();

    try {
      console.log("Returning loan:", selectedLoan?.id);
      await returnLoan(selectedLoan.id, new Date().toISOString().split("T")[0]);
      setIsReturnDialogOpen(false);
      setSelectedLoan(null);
      fetchLoans();
      fetchAssets();
    } catch (err) {
      console.error("Erreur retour prêt:", err);
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

  const availableAssets = getAssetsAvailableForLoan
    ? getAssetsAvailableForLoan()
    : [];
  console.log("Available Assets:", availableAssets);

  const activeLoans = getActiveLoans ? getActiveLoans() : [];
  const overdueLoans = getOverdueLoans ? getOverdueLoans() : [];
  const activeUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          (user.role === "employe" ||
            user.role === "admin" ||
            user.role === "comptable") &&
          user.id
      )
    : [];

  const filteredLoans = (Array.isArray(loans) ? loans : [])
    .filter((loan) => {
      if (!loan) return false;

      const assetName = loan.asset?.name || "";
      const userName = loan.user?.name || "";
      const userEmail = loan.user?.email || "";

      return (
        assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
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

  const handleSignatureSave = (signature: string) => {
    setFormData((prev) => ({
      ...prev,
      signature,
    }));
  };

  const handleSignatureClear = () => {
    setFormData((prev) => ({
      ...prev,
      signature: "",
    }));
  };

  const handleViewSignature = (signature: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <body style="margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
            <img src="${signature}" style="max-width: 100%; max-height: 90vh; border: 1px solid #ccc; border-radius: 4px;" />
          </body>
        </html>
      `);
    }
  };

  // Fonction pour afficher les détails d'un prêt
  const showLoanDetail = (loan: any) => {
    setSelectedLoanDetails(loan);
    setShowLoanDetails(true);
  };

  // Fonction pour supprimer un prêt
  const handleDeleteLoan = async (loanId: number) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer ce prêt ? Cette action est irréversible."
      )
    ) {
      try {
        await deleteLoan(loanId);
        setShowLoanDetails(false);
        setTimeout(() => fetchLoans(), 100);
      } catch (err) {
        console.error("Erreur suppression prêt:", err);
      }
    }
  };

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

        {loansError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
            <p className="font-medium">Erreur de chargement:</p>
            <p className="text-sm">{loansError.message || "Erreur inconnue"}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                clearLoansError();
                fetchLoans();
              }}
            >
              Réessayer
            </Button>
          </div>
        )}

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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau Prêt de Matériel</DialogTitle>
                <DialogDescription>
                  Attribuez un matériel à un employé pour usage professionnel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Employé *</Label>
                  <Select
                    value={
                      formData.user_id > 0 ? formData.user_id.toString() : ""
                    }
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_id: parseInt(value) || 0,
                      }))
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
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
                          <SelectItem
                            className="flex"
                            key={user.id}
                            value={user.id.toString()}
                          >
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

                <div className="space-y-2">
                  <Label>Matériel *</Label>
                  <Select
                    value={
                      formData.asset_id > 0 ? formData.asset_id.toString() : ""
                    }
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        asset_id: parseInt(value) || 0,
                      }))
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
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
                            className="flex"
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label>Signature numérique de l'employé *</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    L'employé doit signer dans la zone ci-dessous pour accepter
                    le prêt du matériel
                  </p>
                  <SignaturePad
                    onSave={handleSignatureSave}
                    onClear={handleSignatureClear}
                    value={formData.signature}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        signature: value,
                      }))
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    type="submit"
                    disabled={
                      submitting ||
                      availableAssets.length === 0 ||
                      activeUsers.length === 0 ||
                      !formData.signature
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
        ) : loansError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-500 mb-4">
                Impossible de charger les prêts. Veuillez réessayer.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  clearLoansError();
                  fetchLoans();
                }}
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : filteredLoans.length > 0 ? (
          filteredLoans.map((loan) => (
            <Card
              key={loan.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => showLoanDetail(loan)}
            >
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
                            {loan.asset?.name || "Matériel inconnu"}
                          </span>
                          {loan.asset?.serial_number && (
                            <span className="text-sm text-gray-500">
                              (S/N: {loan.asset.serial_number})
                            </span>
                          )}
                          {loan.signature && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs"
                            >
                              Signé
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {loan.user?.name || "Utilisateur inconnu"} •{" "}
                            {loan.user?.email || "Email inconnu"}
                          </span>
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
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {loan.status === "en_cours" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
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
                        {loan.signature && (
                          <DropdownMenuItem
                            onClick={() => handleViewSignature(loan.signature)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Voir la signature
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (
                              confirm(
                                "Êtes-vous sûr de vouloir supprimer ce prêt ?"
                              )
                            ) {
                              deleteLoan(loan.id);
                              setTimeout(() => fetchLoans(), 100);
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

      {/* Dialog pour afficher les détails d'un prêt spécifique */}
      <Dialog open={showLoanDetails} onOpenChange={setShowLoanDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  Détails du prêt #{selectedLoanDetails?.id}
                </DialogTitle>
                <DialogDescription>
                  Informations complètes sur ce prêt de matériel
                </DialogDescription>
              </div>
             
            </div>
          </DialogHeader>

          {selectedLoanDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                {/* Matériel */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Matériel
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Laptop className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-semibold">
                              {selectedLoanDetails.asset?.name || "N/A"}
                            </p>
                            {selectedLoanDetails.asset?.serial_number && (
                              <p className="text-sm text-gray-600">
                                N° série:{" "}
                                {selectedLoanDetails.asset.serial_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Employé
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-semibold">
                              {selectedLoanDetails.user?.name || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedLoanDetails.user?.email || "N/A"}
                            </p>
                            {selectedLoanDetails.user?.role && (
                              <Badge variant="outline" className="mt-1">
                                {selectedLoanDetails.user.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Dates et statut */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Dates
                    </h3>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Date de prêt:
                          </span>
                          <span className="font-medium">
                            {formatDate(selectedLoanDetails.loan_date)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Retour prévu:
                          </span>
                          <span
                            className={`font-medium ${
                              isOverdue(selectedLoanDetails.due_date) &&
                              selectedLoanDetails.status === "en_cours"
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {formatDate(selectedLoanDetails.due_date)}
                          </span>
                        </div>
                        {selectedLoanDetails.return_date && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Date de retour:
                            </span>
                            <span className="font-medium text-green-600">
                              {formatDate(selectedLoanDetails.return_date)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      Statut
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getStatusColor(
                                selectedLoanDetails.status
                              )}
                            >
                              {selectedLoanDetails.status === "en_cours"
                                ? "En cours"
                                : "Terminé"}
                            </Badge>
                            {isOverdue(selectedLoanDetails.due_date) &&
                              selectedLoanDetails.status === "en_cours" && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-100 text-red-800 border-red-200"
                                >
                                  En retard
                                </Badge>
                              )}
                          </div>
                          {selectedLoanDetails.signature && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Signé
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Signature */}
              {selectedLoanDetails.signature && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">
                    Signature de l'employé
                  </h3>
                  <Card>
                    <CardContent className="">
                      <div className="flex flex-col items-center">
                        <img
                          src={selectedLoanDetails.signature}
                          alt="Signature"
                          className=" max-h-20 object-contain border rounded"
                        />
                       
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedLoanDetails.status === "en_cours" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedLoan(selectedLoanDetails);
                      setShowLoanDetails(false);
                      setIsReturnDialogOpen(true);
                    }}
                  >
                    Retourner le matériel
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                  onClick={() => handleDeleteLoan(selectedLoanDetails.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
               
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de retour */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retour de Matériel</DialogTitle>
            <DialogDescription>
              Confirmez le retour du matériel "
              {selectedLoan?.asset?.name || "Matériel"}" par{" "}
              {selectedLoan?.user?.name || "Utilisateur"}
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
