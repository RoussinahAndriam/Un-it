"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "@/lib/api";
import {
  RefreshCcw,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

// =====================================
// 🔥 TYPES
// =====================================
interface ChartItem {
  mois: number;
  total: number;
}

interface StatsResponse {
  success: boolean;
  data: {
    revenus: ChartItem[];
    depenses: ChartItem[];
    year: number;
  };
  message: string;
}

interface FinancialSummaryResponse {
  data: {
    period: {
      start: string;
      end: string;
    };
    total_revenues: number;
    total_expenses: number;
    net_profit: number;
    current_total_balance: number;
    expenses_by_category: Array<{
      name: string;
      total: number;
    }>;
  };
}

interface AssetSummaryResponse {
  data: {
    assets_by_status: Array<{
      status: string;
      count: number;
    }>;
    total_inventory_value: number;
    assets_on_loan_count: number;
    assets_on_loan_details: Array<any>;
  };
}

interface Account {
  id: number;
  name: string;
  balance: number;
  account_type: string;
}

interface PieDataItem {
  name: string;
  value: number;
  percent?: number;
}

// Couleurs pour les graphiques
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
];

// 🔥 LISTE DES MOIS
const MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export default function RapportPage() {
  const [data, setData] = useState<StatsResponse["data"] | null>(null);
  const [financialData, setFinancialData] = useState<
    FinancialSummaryResponse["data"] | null
  >(null);
  const [assetData, setAssetData] = useState<
    AssetSummaryResponse["data"] | null
  >(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 🔥 ÉTAT POUR LE MOIS ET L'ANNÉE SÉLECTIONNÉS
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  // 🔥 GÉNÉRER LES ANNÉES DISPONIBLES (3 ans en arrière, année courante, 1 an en avant)
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return {
      value: year.toString(),
      label: year.toString(),
    };
  });

  const [loading, setLoading] = useState({
    monthly: false,
    financial: false,
    assets: false,
    accounts: false,
  });

  // 🔥 FONCTION POUR RÉCUPÉRER LES COMPTES
  const fetchAccounts = async () => {
    setLoading((prev) => ({ ...prev, accounts: true }));
    try {
      const res = await api.get<{ data: Account[] }>("/accounts");
      setAccounts(res.data.data);
    } catch (err: any) {
      console.error("Erreur lors du chargement des comptes :", err);
      if (err.response?.status !== 404) {
        toast.error("Erreur lors du chargement des comptes");
      }
    } finally {
      setLoading((prev) => ({ ...prev, accounts: false }));
    }
  };

  // 🔥 FONCTION POUR RÉCUPÉRER LE RÉSUMÉ FINANCIER POUR UN MOIS ET UNE ANNÉE
  const fetchFinancialSummary = async () => {
    setLoading((prev) => ({ ...prev, financial: true }));
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);

      // Calculer les dates de début et fin du mois
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Dernier jour du mois

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const res = await api.get<FinancialSummaryResponse>(
        `/reports/financial-summary?start_date=${startDateStr}&end_date=${endDateStr}`
      );

      setFinancialData(res.data.data);
      toast.success(
        `Données mises à jour pour ${MONTHS[month - 1]?.label} ${year}`
      );
    } catch (err: any) {
      console.error("Erreur lors du chargement du résumé financier :", err);
      toast.error("Erreur lors du chargement du résumé financier");
    } finally {
      setLoading((prev) => ({ ...prev, financial: false }));
    }
  };

  // 🔥 FONCTION POUR RÉCUPÉRER LES STATS MENSUELLES (pour l'année sélectionnée)
  const fetchMonthlyStats = async () => {
    setLoading((prev) => ({ ...prev, monthly: true }));
    try {
      const res = await api.get<StatsResponse>(
        `/reports/monthly-stats?year=${selectedYear}`
      );

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des statistiques :", err);
      toast.error("Erreur lors du chargement des statistiques mensuelles");
    } finally {
      setLoading((prev) => ({ ...prev, monthly: false }));
    }
  };

  // 🔥 FONCTION POUR RÉCUPÉRER LES ACTIFS (ne dépend pas de l'année)
  const fetchAssetSummary = async () => {
    setLoading((prev) => ({ ...prev, assets: true }));
    try {
      const res = await api.get<AssetSummaryResponse>("/reports/asset-summary");
      setAssetData(res.data.data);
    } catch (err: any) {
      console.error("Erreur lors du chargement du rapport des actifs :", err);
      toast.error("Erreur lors du chargement du rapport des actifs");
    } finally {
      setLoading((prev) => ({ ...prev, assets: false }));
    }
  };

  // 🔥 EFFET POUR CHARGER LES DONNÉES QUAND LE MOIS OU L'ANNÉE CHANGE
  useEffect(() => {
    fetchMonthlyStats();
    fetchFinancialSummary();
    fetchAssetSummary();
    fetchAccounts();
  }, [selectedMonth, selectedYear]);

  // 🔥 MISE À JOUR DE L'ANNÉE PAR DÉFAUT SI L'ANNÉE N'EXISTE PAS DANS LA LISTE
  useEffect(() => {
    const yearExists = YEARS.some((year) => year.value === selectedYear);
    if (!yearExists) {
      setSelectedYear(currentYear.toString());
    }
  }, []);

  const moisLabels = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];

  // Préparer les données pour les graphiques annuels
  const chartData = data
    ? moisLabels.map((mois, index) => ({
        mois,
        revenus: data.revenus[index]?.total || 0,
        depenses: data.depenses[index]?.total || 0,
        profit:
          (data.revenus[index]?.total || 0) -
          (data.depenses[index]?.total || 0),
      }))
    : [];

  // 🔥 UTILISER LES DONNÉES DU MOIS SÉLECTIONNÉ
  const totalRevenu = financialData?.total_revenues || 0;
  const totalDepense = financialData?.total_expenses || 0;
  const profit = financialData?.net_profit || totalRevenu - totalDepense;

  // 🔥 CALCUL DU SOLDE TOTAL
  const totalBalance =
    financialData?.current_total_balance ||
    accounts.reduce((sum, account) => sum + account.balance, 0);

  // Préparer les données pour le graphique des dépenses par catégorie
  const prepareExpenseChartData = (
    expenses: Array<{ name: string; total: number }>
  ): PieDataItem[] => {
    const total = expenses.reduce((sum, item) => sum + item.total, 0);
    return expenses.map((item) => ({
      name:
        item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
      value: item.total,
      percent: total > 0 ? (item.total / total) * 100 : 0,
    }));
  };

  const expenseChartData = financialData?.expenses_by_category
    ? prepareExpenseChartData(financialData.expenses_by_category)
    : [];

  // Données pour le graphique des actifs par statut
  const assetStatusData = assetData?.assets_by_status || [];

  // Calculer le pourcentage de croissance
  const calculateGrowthPercentage = (
    current: number,
    previous: number
  ): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // ==========================
  // 📌 Fonctions export
  // ==========================
  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await api.get(url, {
        responseType: "blob",
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
      });

      // Vérifier si c'est un JSON (erreur) ou un vrai fichier
      if (res.headers["content-type"]?.includes("application/json")) {
        const errorData = JSON.parse(await res.data.text());
        toast.error(errorData.message || "Erreur lors de l'export");
        return;
      }

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Fichier ${filename} téléchargé avec succès`);
    } catch (err: any) {
      console.error("Erreur téléchargement :", err);

      // Si c'est une erreur 500 avec des données JSON
      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorData = JSON.parse(errorText);
          toast.error(errorData.message || "Erreur lors du téléchargement");
        } catch {
          toast.error("Erreur lors du téléchargement");
        }
      } else {
        toast.error("Erreur lors du téléchargement");
      }
    }
  };

  const exportExcel = () => {
    const monthName =
      MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    downloadFile(
      `/reports/export/excel`,
      `rapport_${monthName}_${selectedYear}.xlsx`
    );
  };

  const exportPdf = () => {
    const monthName =
      MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    downloadFile(
      `/reports/export/pdf?year=${selectedYear}&month=${selectedMonth}`,
      `rapport_${monthName}_${selectedYear}.pdf`
    );
  };

  const exportBoth = () => {
    exportExcel();
    setTimeout(exportPdf, 1000);
  };

  const refreshAll = () => {
    fetchMonthlyStats();
    fetchFinancialSummary();
    fetchAssetSummary();
    fetchAccounts();
    toast.info("Mise à jour des données en cours...");
  };

  const isLoading =
    loading.monthly || loading.financial || loading.assets || loading.accounts;

  // Fonction de rendu pour le label du pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent === 0) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 🔥 COMPOSANT POUR LES DÉTAILS DES COMPTES
  const AccountBalancesList = () => (
    <div className="mt-4 space-y-3">
      <h4 className="font-semibold text-gray-900 mb-2">Détails par compte</h4>
      {accounts.length > 0 ? (
        accounts.map((account) => (
          <div
            key={account.id}
            className="flex justify-between items-center py-2 border-b"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{account.name}</span>
              <Badge variant="outline" className="text-xs">
                {account.account_type}
              </Badge>
            </div>
            <Badge
              variant={account.balance >= 0 ? "default" : "destructive"}
              className={
                account.balance >= 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {account.balance.toLocaleString()} FCFA
            </Badge>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Aucun compte trouvé</p>
          <p className="text-sm mt-1">
            Créez des comptes dans la section Comptes
          </p>
        </div>
      )}
    </div>
  );

  // 🔥 NOM DU MOIS SÉLECTIONNÉ
  const selectedMonthName =
    MONTHS.find((m) => m.value === selectedMonth)?.label || "Mois inconnu";

  return (
    <div className="min-h-screen bg-gray-50/30 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de Bord Financier
          </h1>
          <p className="text-gray-600 mt-1">
            Analyse de vos finances pour {selectedMonthName} {selectedYear}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* 🔥 FILTRES MOIS ET ANNÉE */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              {/* FILTRE MOIS */}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* FILTRE ANNÉE */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={refreshAll}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCcw
              size={18}
              className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Chargement..." : "Actualiser"}
          </Button>

          {/* BOUTON EXPORT */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2">
                <Download size={18} className="mr-2" />
                Exporter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-white border rounded-lg shadow-lg p-2">
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  className="justify-start px-3 py-2 hover:bg-blue-50 rounded"
                  onClick={exportExcel}
                >
                  📊 Excel
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-3 py-2 hover:bg-blue-50 rounded"
                  onClick={exportPdf}
                >
                  📄 PDF
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-3 py-2 hover:bg-blue-50 rounded"
                  onClick={exportBoth}
                >
                  📦 Les deux formats
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* CARDS STATISTIQUES PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Revenus {selectedMonthName} {selectedYear}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalRevenu.toLocaleString()} FCFA
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Badge
              variant="secondary"
              className="mt-2 bg-blue-50 text-blue-700"
            >
              {selectedMonthName} {selectedYear}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dépenses {selectedMonthName} {selectedYear}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalDepense.toLocaleString()} FCFA
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2 bg-red-50 text-red-700">
              {totalRevenu > 0
                ? ((totalDepense / totalRevenu) * 100).toFixed(1)
                : 0}
              % des revenus
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Bénéfice {selectedMonthName} {selectedYear}
                </p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    profit >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {profit.toLocaleString()} FCFA
                </p>
              </div>
              <div
                className={`p-2 rounded-full ${
                  profit >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {profit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`mt-2 ${
                profit >= 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              Marge:{" "}
              {totalRevenu > 0 ? ((profit / totalRevenu) * 100).toFixed(1) : 0}%
            </Badge>
          </CardContent>
        </Card>

        {/* 🔥 CARTE SOLDE TOTAL */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Solde Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalBalance.toLocaleString()} FCFA
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <Badge
              variant="secondary"
              className="mt-2 bg-purple-50 text-purple-700"
            >
              {accounts.length} compte(s)
            </Badge>
            <AccountBalancesList />
          </CardContent>
        </Card>
      </div>

      {/* GRAPHIQUES PRINCIPAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPHIQUE ANNUEL REVENUS/DEPENSES */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Évolution Annuelle ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.monthly ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `${Number(value).toLocaleString()} FCFA`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenus"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Revenus"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="depenses"
                    stroke="#dc2626"
                    strokeWidth={3}
                    name="Dépenses"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 🔥 GRAPHIQUE DEPENSES PAR CATEGORIE POUR LE MOIS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Dépenses par Catégorie ({selectedMonthName} {selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.financial ? (
              <Skeleton className="h-80 w-full" />
            ) : expenseChartData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${Number(value).toLocaleString()} FCFA`,
                        props.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* LÉGENDE DÉTAILLÉE */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {financialData?.expenses_by_category?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {item.total.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p>
                  Aucune dépense pour {selectedMonthName} {selectedYear}
                </p>
                <p className="text-sm mt-2">Aucune transaction ce mois-ci</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* STATISTIQUES DES ACTIFS ET DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATUT DES ACTIFS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              Statut des Actifs ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.assets ? (
              <Skeleton className="h-64 w-full" />
            ) : assetStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={assetStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Nombre d'actifs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Aucune donnée d'actifs disponible
              </div>
            )}

            {assetData && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Valeur totale inventaire:
                  </span>
                  <span className="font-bold text-purple-700">
                    {assetData.total_inventory_value?.toLocaleString() || 0}{" "}
                    FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Actifs prêtés:</span>
                  <Badge variant="outline" className="bg-orange-50">
                    {assetData.assets_on_loan_count || 0} actifs
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DETAILS FINANCIERS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Détails Financiers - {selectedMonthName} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financialData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Période d'analyse
                      </h4>
                      <p className="text-sm text-gray-600">
                        Du{" "}
                        {new Date(
                          financialData.period.start
                        ).toLocaleDateString()}{" "}
                        au{" "}
                        {new Date(
                          financialData.period.end
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Indicateurs Clés
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Ratio Dépenses/Revenus:
                          </span>
                          <Badge variant="secondary">
                            {totalRevenu > 0
                              ? ((totalDepense / totalRevenu) * 100).toFixed(1)
                              : 0}
                            %
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Marge nette:</span>
                          <Badge
                            variant={profit >= 0 ? "default" : "destructive"}
                          >
                            {totalRevenu > 0
                              ? ((profit / totalRevenu) * 100).toFixed(1)
                              : 0}
                            %
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Solde total comptes:</span>
                          <Badge
                            variant="default"
                            className="bg-purple-100 text-purple-800"
                          >
                            {totalBalance.toLocaleString()} FCFA
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Détails des Dépenses
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {financialData.expenses_by_category?.length > 0 ? (
                        financialData.expenses_by_category.map(
                          (category, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-2 border-b"
                            >
                              <span className="text-sm">{category.name}</span>
                              <span className="font-medium">
                                {category.total.toLocaleString()} FCFA
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>Aucune dépense catégorisée</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
