"use client";

import { useState, useEffect, FormEvent } from "react";
import { useUser, User, UserRole, CreateUserData } from "@/hooks/useUser";
import { adminAPI, SecuritySettings, AppSettings } from "@/services/adminApi";
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
  Users,
  Shield,
  Settings,
  Download,
  Loader2,
  Edit,
  Trash2,
  Search,
  UserPlus,
  Key,
  AlertTriangle,
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
import { useRouter } from "next/navigation";

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "comptable":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "employe":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "comptable":
      return "Comptable";
    case "employe":
      return "Employé";
    default:
      return role;
  }
};

// Interface pour les statistiques utilisateurs
interface UserStats {
  total: number;
  admins: number;
  comptables: number;
  employes: number;
}

// Interface pour les données de réinitialisation de mot de passe
interface ResetPasswordData {
  password: string;
  password_confirmation: string;
}

export default function AdminPage() {
  const { 
    users, 
    currentUser, 
    loading, 
    error, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    clearError 
  } = useUser();
  
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"users" | "security" | "settings">("users");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    password_min_length: 8,
    password_requires_numbers: true,
    password_requires_special_chars: true,
    max_login_attempts: 5,
    session_timeout: 60,
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    site_name: "Mon Application",
    maintenance_mode: false,
    max_users: 100,
    email_notifications: true,
  });

  const [userFormData, setUserFormData] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    role: "employe",
  });

  const [resetPasswordData, setResetPasswordData] = useState<ResetPasswordData>({
    password: "",
    password_confirmation: "",
  });

  // Vérification d'authentification et de rôle
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchUsers();
        
        if (currentUser && currentUser.role !== "admin") {
          router.push("/unauthorized");
        }
      } catch (error) {
        console.error("Erreur d'authentification:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [currentUser, router, fetchUsers]);

  // Charger les données de l'admin
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async (): Promise<void> => {
    try {
      const [settingsRes] = await Promise.all([
        adminAPI.getSettings()
      ]);
      setAppSettings(settingsRes.data.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données admin:", error);
    }
  };

  const handleUserSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      if (isEditMode && selectedUser) {
        await updateUser(selectedUser.id, userFormData);
      } else {
        await createUser(userFormData);
      }
      resetUserForm();
      setIsUserDialogOpen(false);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSubmitting(true);
    
    try {
      await adminAPI.resetPassword(selectedUser.id, resetPasswordData.password);
      setIsResetPasswordDialogOpen(false);
      setResetPasswordData({ password: "", password_confirmation: "" });
      setSelectedUser(null);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetUserForm = (): void => {
    setUserFormData({
      name: "",
      email: "",
      password: "",
      role: "employe",
    });
    setIsEditMode(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user: User): void => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: "", // Mot de passe laissé vide en édition
      role: user.role,
    });
    setIsEditMode(true);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: number): Promise<void> => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUser(userId);
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
      }
    }
  };

  const handleSecuritySettingsUpdate = async (): Promise<void> => {
    try {
      await adminAPI.updatePasswordPolicy(securitySettings);
      // Message de succès
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const handleAppSettingsUpdate = async (): Promise<void> => {
    try {
      await adminAPI.updateSettings(appSettings);
      // Message de succès
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const filteredUsers: User[] = users.filter(
    (user: User) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userStats: UserStats = {
    total: users.length,
    admins: users.filter((user: User) => user.role === "admin").length,
    comptables: users.filter((user: User) => user.role === "comptable").length,
    employes: users.filter((user: User) => user.role === "employe").length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/30 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès Restreint</h2>
            <p className="text-gray-600 mb-4">
              Vous devez être administrateur pour accéder à cette page.
            </p>
            <Button onClick={() => router.push("/")}>Retour à l'accueil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">
            Gérez les utilisateurs, la sécurité et les paramètres de
            l'application
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex bg-blue-600 hover:bg-blue-700 text-white items-center gap-2"
                onClick={resetUserForm}
              >
                <UserPlus className="h-4 w-4" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Modifier l'Utilisateur" : "Nouvel Utilisateur"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Modifiez les informations de cet utilisateur"
                    : "Ajoutez un nouvel utilisateur au système"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={userFormData.name}
                    onChange={(e) =>
                      setUserFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) =>
                      setUserFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>
                    {isEditMode
                      ? "Nouveau mot de passe (laisser vide pour ne pas changer)"
                      : "Mot de passe"}
                  </Label>
                  <Input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required={!isEditMode}
                  />
                </div>

                <div>
                  <Label>Rôle</Label>
                  <Select
                    value={userFormData.role}
                    onValueChange={(value: UserRole) =>
                      setUserFormData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="comptable">Comptable</SelectItem>
                      <SelectItem value="employe">Employé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUserDialogOpen(false)}
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Utilisateurs
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {userStats.total}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Administrateurs
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {userStats.admins}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comptables</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {userStats.comptables}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employés</p>
                <p className="text-2xl font-bold text-gray-600 mt-2">
                  {userStats.employes}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Onglet Utilisateurs */}
        <TabsContent value="users">
          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            {user.email} • Créé le{" "}
                            {user.created_at
                              ? formatDate(user.created_at)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Réinitialiser MDP
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === currentUser?.id}
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
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun utilisateur
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? "Aucun utilisateur ne correspond à votre recherche"
                      : "Commencez par créer votre premier utilisateur"}
                  </p>
                  <Button onClick={() => setIsUserDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nouvel Utilisateur
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Longueur minimale du mot de passe</Label>
                  <Input
                    type="number"
                    value={securitySettings.password_min_length}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        password_min_length: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Timeout de session (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        session_timeout: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require-numbers"
                    checked={securitySettings.password_requires_numbers}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        password_requires_numbers: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="require-numbers">
                    Exiger des chiffres dans les mots de passe
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require-special-chars"
                    checked={securitySettings.password_requires_special_chars}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        password_requires_special_chars: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="require-special-chars">
                    Exiger des caractères spéciaux dans les mots de passe
                  </Label>
                </div>
              </div>

              <Button onClick={handleSecuritySettingsUpdate}>
                Sauvegarder les paramètres de sécurité
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de l'Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Nom du site</Label>
                <Input
                  value={appSettings.site_name}
                  onChange={(e) =>
                    setAppSettings((prev) => ({
                      ...prev,
                      site_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Nombre maximum d'utilisateurs</Label>
                <Input
                  type="number"
                  value={appSettings.max_users}
                  onChange={(e) =>
                    setAppSettings((prev) => ({
                      ...prev,
                      max_users: parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintenance-mode"
                    checked={appSettings.maintenance_mode}
                    onChange={(e) =>
                      setAppSettings((prev) => ({
                        ...prev,
                        maintenance_mode: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="maintenance-mode">Mode maintenance</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={appSettings.email_notifications}
                    onChange={(e) =>
                      setAppSettings((prev) => ({
                        ...prev,
                        email_notifications: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="email-notifications">
                    Notifications par email
                  </Label>
                </div>
              </div>

              <Button onClick={handleAppSettingsUpdate}>
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de réinitialisation de mot de passe */}
      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Définir un nouveau mot de passe pour {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={resetPasswordData.password}
                onChange={(e) =>
                  setResetPasswordData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <Label>Confirmation du mot de passe</Label>
              <Input
                type="password"
                value={resetPasswordData.password_confirmation}
                onChange={(e) =>
                  setResetPasswordData((prev) => ({
                    ...prev,
                    password_confirmation: e.target.value,
                  }))
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
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
                ) : (
                  "Réinitialiser"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
