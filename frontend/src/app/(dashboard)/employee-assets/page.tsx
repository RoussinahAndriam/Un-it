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

// Composant de notification personnalisé (identique aux autres pages)
const Notification = ({
  type,
  title,
  message,
  onClose,
}: {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onClose: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const colors = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "text-green-500",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-500",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-500",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-500",
    },
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertTriangle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <CheckCircle className="h-5 w-5" />,
  };

  const color = colors[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[100] w-96 p-4 rounded-lg border shadow-lg animate-slide-in ${color.bg} ${color.border}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${color.icon}`}>{icons[type]}</div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${color.text}`}>{title}</h3>
          <div className="mt-1 text-sm opacity-90">{message}</div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

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

  // États pour les notifications
  const [notifications, setNotifications] = useState<
    Array<{
      id: number;
      type: "success" | "error" | "warning" | "info";
      title: string;
      message: string;
    }>
  >([]);

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

  // Fonction pour ajouter des notifications
  const addNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    return id;
  };

  // Fonction pour supprimer des notifications
  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    console.log("Initialisation du composant, chargement des données...");
    fetchLoans();
    fetchAssets();
    fetchUsers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation avant soumission
    if (!formData.user_id || formData.user_id === 0) {
      addNotification(
        "error",
        "Erreur de validation",
        "Veuillez sélectionner un employé"
      );
      return;
    }

    if (!formData.asset_id || formData.asset_id === 0) {
      addNotification(
        "error",
        "Erreur de validation",
        "Veuillez sélectionner un matériel"
      );
      return;
    }

    if (!formData.signature) {
      addNotification(
        "error",
        "Signature requise",
        "L'employé doit signer pour accepter le prêt"
      );
      return;
    }

    setSubmitting(true);
    clearLoansError();

    try {
      console.log("Creating loan with data:", formData);
      await createLoan(formData);

      // Notification de succès
      addNotification(
        "success",
        "Prêt créé",
        "Le prêt de matériel a été créé avec succès"
      );

      resetForm();
      setIsDialogOpen(false);
      fetchLoans();
      fetchAssets();
    } catch (err: any) {
      console.error("Erreur création prêt:", err);
      addNotification(
        "error",
        "Erreur",
        err.response?.data?.message || "Impossible de créer le prêt"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (e: FormEvent) => {
    e.preventDefault();

    // Demander confirmation
    const confirmed = window.confirm("Confirmer le retour de ce matériel ?");

    if (!confirmed) {
      addNotification(
        "warning",
        "Retour annulé",
        "Le matériel n'a pas été retourné"
      );
      return;
    }

    setSubmitting(true);
    clearLoansError();

    try {
      console.log("Returning loan:", selectedLoan?.id);
      await returnLoan(selectedLoan.id, new Date().toISOString().split("T")[0]);

      // Notification de succès
      addNotification(
        "success",
        "Matériel retourné",
        `Le matériel "${selectedLoan.asset?.name}" a été retourné avec succès`
      );

      setIsReturnDialogOpen(false);
      setSelectedLoan(null);
      fetchLoans();
      fetchAssets();
    } catch (err: any) {
      console.error("Erreur retour prêt:", err);
      addNotification("error", "Erreur", "Impossible de retourner le matériel");
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
  const handleDeleteLoan = async (loanId: number, loanName?: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le prêt de "${
        loanName || "ce matériel"
      }" ? Cette action est irréversible.`
    );

    if (!confirmed) {
      addNotification(
        "warning",
        "Suppression annulée",
        "Le prêt n'a pas été supprimé"
      );
      return;
    }

    try {
      await deleteLoan(loanId);

      // Notification de succès
      addNotification(
        "success",
        "Prêt supprimé",
        "Le prêt a été supprimé avec succès"
      );

      setShowLoanDetails(false);
      setTimeout(() => fetchLoans(), 100);
    } catch (err: any) {
      console.error("Erreur suppression prêt:", err);
      addNotification("error", "Erreur", "Impossible de supprimer le prêt");
    }
  };

  // Fonction pour supprimer un prêt depuis la liste
  const handleDeleteFromList = async (loan: any, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le prêt de "${
        loan.asset?.name || "ce matériel"
      }" ?`
    );

    if (!confirmed) {
      addNotification(
        "warning",
        "Suppression annulée",
        "Le prêt n'a pas été supprimé"
      );
      return;
    }

    try {
      await deleteLoan(loan.id);

      // Notification de succès
      addNotification(
        "success",
        "Prêt supprimé",
        "Le prêt a été supprimé avec succès"
      );

      setTimeout(() => fetchLoans(), 100);
    } catch (err: any) {
      console.error("Erreur suppression prêt:", err);
      addNotification("error", "Erreur", "Impossible de supprimer le prêt");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      {/* Afficher les notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

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
                      const confirmed = window.confirm(
                        "Annuler la création du prêt ? Les données saisies seront perdues."
                      );
                      if (confirmed) {
                        resetForm();
                        setIsDialogOpen(false);
                      }
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSignature(loan.signature);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Voir la signature
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            showLoanDetail(loan);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteFromList(loan, e)}
                          className="text-red-600"
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
              <div className="mx-auto max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Laptop className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Aucun prêt trouvé" : "Aucun prêt enregistré"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Aucun résultat pour votre recherche. Essayez avec d'autres termes."
                    : "Commencez par créer un nouveau prêt de matériel."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    disabled={
                      availableAssets.length === 0 || activeUsers.length === 0
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un prêt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogue de retour de matériel */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retour de matériel</DialogTitle>
            <DialogDescription>
              Confirmer le retour du matériel emprunté
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Détails du prêt</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matériel:</span>
                    <span className="font-medium">
                      {selectedLoan.asset?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employé:</span>
                    <span className="font-medium">
                      {selectedLoan.user?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de prêt:</span>
                    <span>{formatDate(selectedLoan.loan_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Date de retour prévue:
                    </span>
                    <span
                      className={
                        isOverdue(selectedLoan.due_date)
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {formatDate(selectedLoan.due_date)}
                    </span>
                  </div>
                </div>
              </div>
              <form onSubmit={handleReturn}>
                <div className="space-y-2">
                  <Label>Date de retour effective *</Label>
                  <Input
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReturnDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirmer le retour"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de détails du prêt */}
      <Dialog open={showLoanDetails} onOpenChange={setShowLoanDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du prêt</DialogTitle>
            <DialogDescription>
              Informations complètes sur ce prêt de matériel
            </DialogDescription>
          </DialogHeader>
          {selectedLoanDetails && (
            <div className="space-y-6">
              {/* En-tête avec statut */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedLoanDetails.asset?.name}
                  </h3>
                  <p className="text-gray-600">
                    Prêt à {selectedLoanDetails.user?.name}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedLoanDetails.status)}>
                  {selectedLoanDetails.status === "en_cours"
                    ? "En cours"
                    : "Terminé"}
                </Badge>
              </div>

              {/* Dates */}
              <Card>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date de prêt</p>
                      <p className="font-medium">
                        {formatDate(selectedLoanDetails.loan_date)}
                      </p>
                    </div>
                    {selectedLoanDetails.due_date && (
                      <div>
                        <p className="text-sm text-gray-600">Retour prévu</p>
                        <p
                          className={`font-medium ${
                            isOverdue(selectedLoanDetails.due_date) &&
                            selectedLoanDetails.status === "en_cours"
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {formatDate(selectedLoanDetails.due_date)}
                        </p>
                      </div>
                    )}
                    {selectedLoanDetails.return_date && (
                      <div>
                        <p className="text-sm text-gray-600">Retour effectif</p>
                        <p className="font-medium">
                          {formatDate(selectedLoanDetails.return_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Signature */}
              {selectedLoanDetails.signature && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Signature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="border rounded  bg-white">
                        <img
                          src={selectedLoanDetails.signature}
                          alt="Signature"
                          className="max-h-32 mx-auto"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedLoanDetails.status === "en_cours" && (
                  <Button
                    onClick={() => {
                      setSelectedLoan(selectedLoanDetails);
                      setShowLoanDetails(false);
                      setIsReturnDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Retourner le matériel
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDeleteLoan(
                      selectedLoanDetails.id,
                      selectedLoanDetails.asset?.name
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLoanDetails(false);
                    setSelectedLoanDetails(null);
                  }}
                >
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
