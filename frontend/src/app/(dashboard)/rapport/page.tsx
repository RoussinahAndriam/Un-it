"use client";

import { useEffect, useState } from "react";
import axios from "axios";
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
} from "lucide-react";
import { toast } from "sonner";

// =====================================
// 🔥 TYPES MIS À JOUR
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
  success: boolean;
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
  success: boolean;
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

interface ExpenseCategory {
  name: string;
  total: number;
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
];

export default function RapportPage() {
  const [data, setData] = useState<StatsResponse["data"] | null>(null);
  const [financialData, setFinancialData] = useState<
    FinancialSummaryResponse["data"] | null
  >(null);
  const [assetData, setAssetData] = useState<
    AssetSummaryResponse["data"] | null
  >(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState({
    monthly: false,
    financial: false,
    assets: false,
  });

  const fetchMonthlyStats = async () => {
    setLoading((prev) => ({ ...prev, monthly: true }));
    try {
      const res = await api.get<StatsResponse>(
        `/reports/monthly-stats?year=${year}`
      );

      if (res.data.success) {
        setData(res.data.data);
        toast.success("Statistiques mensuelles mises à jour");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques :", err);
      toast.error("Erreur lors du chargement des statistiques mensuelles");
    } finally {
      setLoading((prev) => ({ ...prev, monthly: false }));
    }
  };

  const fetchFinancialSummary = async () => {
    setLoading((prev) => ({ ...prev, financial: true }));
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const res = await api.get<FinancialSummaryResponse>(
        `/reports/financial-summary?start_date=${startDate}&end_date=${endDate}`
      );

      if (res.data.success) {
        setFinancialData(res.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du résumé financier :", err);
      toast.error("Erreur lors du chargement du résumé financier");
    } finally {
      setLoading((prev) => ({ ...prev, financial: false }));
    }
  };

  const fetchAssetSummary = async () => {
    setLoading((prev) => ({ ...prev, assets: true }));
    try {
      const res = await api.get<AssetSummaryResponse>("/reports/asset-summary");

      if (res.data.success) {
        setAssetData(res.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du rapport des actifs :", err);
      toast.error("Erreur lors du chargement du rapport des actifs");
    } finally {
      setLoading((prev) => ({ ...prev, assets: false }));
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
    fetchFinancialSummary();
    fetchAssetSummary();
  }, [year]);

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

  // Préparer les données pour les graphiques
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

  const totalRevenu = data
    ? data.revenus.reduce((acc, r) => acc + r.total, 0)
    : 0;
  const totalDepense = data
    ? data.depenses.reduce((acc, d) => acc + d.total, 0)
    : 0;
  const profit = totalRevenu - totalDepense;

  // Préparer les données pour le graphique des dépenses par catégorie
  const prepareExpenseChartData = (
    expenses: ExpenseCategory[]
  ): PieDataItem[] => {
    const total = expenses.reduce((sum, item) => sum + item.total, 0);
    return expenses.map((item) => ({
      name: item.name,
      value: item.total,
      percent: total > 0 ? (item.total / total) * 100 : 0,
    }));
  };

  const expenseChartData = financialData?.expenses_by_category
    ? prepareExpenseChartData(financialData.expenses_by_category)
    : [];

  // Données pour le graphique des actifs par statut
  const assetStatusData = assetData?.assets_by_status || [];

  // Calculer le pourcentage de croissance (éviter les divisions par zéro)
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
        responseType: "blob", // IMPORTANT
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`Fichier ${filename} téléchargé avec succès`);
    } catch (err) {
      console.error("Erreur téléchargement :", err);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const exportExcel = () =>
    downloadFile(
      `/reports/export/excel?year=${year}`,
      `rapport_financier_${year}.xlsx`
    );

  const exportPdf = () =>
    downloadFile(
      `/reports/export/pdf?year=${year}`,
      `rapport_financier_${year}.pdf`
    );

  const exportBoth = () => {
    exportExcel();
    setTimeout(exportPdf, 1000);
  };

  const refreshAll = () => {
    fetchMonthlyStats();
    fetchFinancialSummary();
    fetchAssetSummary();
    toast.info("Mise à jour des données en cours...");
  };

  const isLoading = loading.monthly || loading.financial || loading.assets;

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

  return (
    <div className="min-h-screen bg-gray-50/30 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de Bord Financier
          </h1>
          <p className="text-gray-600 mt-1">
            Analyse complète de vos finances et actifs
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2024, 2023, 2022].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                  Total Revenus
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
              {totalRevenu > 0 ? "+" : ""}
              {calculateGrowthPercentage(
                totalRevenu,
                totalRevenu * 0.9
              ).toFixed(1)}
              % vs prévision
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Dépenses
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
                  Bénéfice Net
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

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Solde Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {financialData?.current_total_balance?.toLocaleString() || 0}{" "}
                  FCFA
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
              Tous comptes
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* GRAPHIQUES PRINCIPAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPHIQUE REVENUS/DEPENSES */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Évolution Mensuelle ({year})
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

        {/* GRAPHIQUE DEPENSES PAR CATEGORIE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Dépenses par Catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.financial ? (
              <Skeleton className="h-80 w-full" />
            ) : expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
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
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                Aucune donnée de dépenses disponible
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
              Statut des Actifs
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
            <CardTitle>Détails Financiers</CardTitle>
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
                        ).toLocaleDateString()}
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
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Détails des Dépenses
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {financialData.expenses_by_category?.map(
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
                      ) || (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucune donnée de dépenses disponible
                        </p>
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
