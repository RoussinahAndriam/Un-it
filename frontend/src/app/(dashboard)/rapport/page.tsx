"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "recharts";
import { RefreshCcw } from "lucide-react";

// =====================================
// 🔥 TYPES MIS À JOUR POUR LE BACKEND
// =====================================
interface ChartItem {
  mois: number; // 1 → 12
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

export default function RapportPage() {
  const [data, setData] = useState<StatsResponse["data"] | null>(null);
  const [financialData, setFinancialData] = useState<
    FinancialSummaryResponse["data"] | null
  >(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  // Fonction pour récupérer les statistiques mensuelles
  const fetchMonthlyStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get<StatsResponse>(
        `http://127.0.0.1:8000/api/reports/monthly-stats?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques :", err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer le résumé financier (optionnel)
  const fetchFinancialSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const res = await axios.get<FinancialSummaryResponse>(
        `http://127.0.0.1:8000/api/reports/financial-summary?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.data.success) {
        setFinancialData(res.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du résumé financier :", err);
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
    fetchFinancialSummary();
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
      }))
    : [];

  const totalRevenu = data
    ? data.revenus.reduce((acc, r) => acc + r.total, 0)
    : 0;
  const totalDepense = data
    ? data.depenses.reduce((acc, d) => acc + d.total, 0)
    : 0;
  const profit = totalRevenu - totalDepense;

  // ==========================
  // 📌 Fonctions export
  // ==========================
  const downloadFile = async (url: string, filename: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur téléchargement :", err);
    }
  };

  const exportExcel = () =>
    downloadFile(
      `http://127.0.0.1:8000/api/reports/export/excel?year=${year}`,
      `transactions_${year}.xlsx`
    );

  const exportPdf = () =>
    downloadFile(
      `http://127.0.0.1:8000/api/reports/export/pdf?year=${year}`,
      `transactions_${year}.pdf`
    );

  const exportBoth = () => {
    exportExcel();
    setTimeout(exportPdf, 500);
  };

  const refreshAll = () => {
    fetchMonthlyStats();
    fetchFinancialSummary();
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rapport Mensuel</h1>

        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={(v) => setYear(v)}>
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

          <Button onClick={refreshAll} className="bg-blue-600 text-white">
            <RefreshCcw size={18} className="mr-2" /> Actualiser
          </Button>

          {/* BOUTON EXPORT */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-green-600 text-white px-4 py-2 rounded">
                Exporter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 bg-white border rounded shadow-lg p-2">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-center hover:bg-blue-100 rounded"
                  onClick={exportExcel}
                >
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-center hover:bg-blue-100 rounded"
                  onClick={exportPdf}
                >
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-center hover:bg-blue-100 rounded"
                  onClick={exportBoth}
                >
                  Les deux
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* CARDS STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-blue-500 border-l-4">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Total Revenus</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">
              {totalRevenu.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500 border-l-4">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Total Dépenses</p>
            <p className="text-2xl font-bold text-red-700 mt-2">
              {totalDepense.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500 border-l-4">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Bénéfice Net</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                profit >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {profit.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500 border-l-4">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Année analysée</p>
            <p className="text-2xl font-bold text-purple-700 mt-2">{year}</p>
          </CardContent>
        </Card>
      </div>

      {/* GRAPHIQUE COMBINÉ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Revenus et Dépenses par mois ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} FCFA`,
                    "",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenus"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Revenus"
                />
                <Line
                  type="monotone"
                  dataKey="depenses"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Dépenses"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* RÉSUMÉ FINANCIER (Optionnel) */}
      {financialData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Résumé Financier Détaillé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Période:</strong> {financialData.period.start} à{" "}
                  {financialData.period.end}
                </p>
                <p>
                  <strong>Solde total des comptes:</strong>{" "}
                  {financialData.current_total_balance.toLocaleString()} FCFA
                </p>
              </div>
              <div>
                <p className="font-semibold">Dépenses par catégorie:</p>
                {financialData.expenses_by_category.map((category, index) => (
                  <p key={index} className="text-sm">
                    {category.name}: {category.total.toLocaleString()} FCFA
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
