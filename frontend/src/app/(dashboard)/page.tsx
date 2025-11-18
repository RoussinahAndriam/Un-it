"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "@/hooks/useAccount";
import { useTransaction } from "@/hooks/useTransaction";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Landmark,
  Download,
  Calendar,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { formatCurrency } from "@/constants";

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  // Utilisation des hooks
  const {
    accounts,
    loading: accountsLoading,
    fetchAccounts,
    getTotalBalance,
  } = useAccount();

  const {
    transactions,
    loading: transactionsLoading,
    fetchTransactions,
    getMonthlySummary,
  } = useTransaction();

  // Calcul des données basées sur les hooks
  const dashboardData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const monthlySummary = getMonthlySummary(currentYear, currentMonth);

    // Calcul de la marge bénéficiaire
    const profitMargin =
      monthlySummary.total_revenue > 0
        ? (monthlySummary.balance / monthlySummary.total_revenue) * 100
        : 0;

    // Répartition des comptes
    const accountDistribution = accounts.map((account) => {
      const totalBalance = getTotalBalance();
      const percentage =
        totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;

      // Déterminer la couleur basée sur le type de compte
      let color = "bg-blue-500";
      if (account.type === "mobile_money") color = "bg-green-500";
      if (account.type === "especes") color = "bg-amber-500";
      if (account.type === "autre") color = "bg-purple-500";

      // Formater le nom du type pour l'affichage
      let typeDisplay = "Autre";
      if (account.type === "mobile_money") typeDisplay = "Mobile Money";
      if (account.type === "especes") typeDisplay = "Espèces";
      if (account.type === "bancaire") typeDisplay = "Bancaire";

      return {
        name: account.name,
        type: typeDisplay,
        balance: account.balance,
        color,
        percentage: Math.round(percentage * 10) / 10, // Arrondir à 1 décimale
      };
    });

    // Transactions récentes (5 plus récentes)
    const recentTransactions = transactions
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      )
      .slice(0, 5)
      .map((transaction) => ({
        id: transaction.id,
        description: transaction.description || "Transaction sans description",
        amount: transaction.amount,
        type: transaction.type === "revenu" ? "income" : "expense",
        date: transaction.transaction_date,
        category: transaction.category?.name || "Non catégorisé",
      }));

    return {
      totalBalance: getTotalBalance(),
      monthlyIncome: monthlySummary.total_revenue,
      monthlyExpenses: monthlySummary.total_expense,
      netProfit: monthlySummary.balance,
      profitMargin: Math.round(profitMargin * 10) / 10,
      recentTransactions,
      accountDistribution,
    };
  }, [accounts, transactions, getTotalBalance, getMonthlySummary]);

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchAccounts(),
          fetchTransactions({
            start_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            )
              .toISOString()
              .split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
          }),
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchAccounts, fetchTransactions]);

  const StatCard = ({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    subtitle: string;
    trend: "up" | "down" | "neutral";
    trendValue?: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color} mb-2`}>{value}</p>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center text-xs font-medium ${
                  trend === "up"
                    ? "text-green-600"
                    : trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
                {trendValue && <span>{trendValue}</span>}
              </div>
              <span className="text-xs text-gray-500">{subtitle}</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-xl ${color
              .replace("text", "bg")
              .replace(
                "-600",
                "-100"
              )} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TransactionItem = ({
    transaction,
  }: {
    transaction: (typeof dashboardData.recentTransactions)[0];
  }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            transaction.type === "income" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {transaction.type === "income" ? (
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          ) : (
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          <p className="text-sm text-gray-500">
            {transaction.category} •{" "}
            {new Date(transaction.date).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span
          className={`font-bold ${
            transaction.type === "income" ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const AccountDistributionItem = ({
    account,
  }: {
    account: (typeof dashboardData.accountDistribution)[0];
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${account.color}`} />
          <div>
            <p className="font-medium text-gray-900">{account.name}</p>
            <p className="text-sm text-gray-500">{account.type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">
            {formatCurrency(account.balance)}
          </p>
          <p className="text-sm text-gray-500">{account.percentage}%</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${account.color} transition-all duration-500`}
          style={{ width: `${account.percentage}%` }}
        />
      </div>
    </div>
  );

  // États de chargement combinés
  const isLoading = loading || accountsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex space-x-3">
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
                <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">Aperçu de votre situation financière</p>
        </div>

      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Solde Total"
          value={`${formatCurrency(dashboardData.totalBalance)}`}
          subtitle="Tous comptes confondus"
          trend="up"
          trendValue="+8.2%"
          icon={Wallet}
          color="text-blue-600"
        />
        <StatCard
          title="Revenus du Mois"
          value={`${formatCurrency(dashboardData.monthlyIncome)} `}
          subtitle="vs mois dernier"
          trend="up"
          trendValue="+12%"
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="Dépenses du Mois"
          value={`${formatCurrency(dashboardData.monthlyExpenses)}`}
          subtitle="vs mois dernier"
          trend="down"
          trendValue="+5%"
          icon={TrendingDown}
          color="text-red-600"
        />
        <StatCard
          title="Bénéfice Net"
          value={`${formatCurrency(dashboardData.netProfit)}`}
          subtitle={`Marge: ${dashboardData.profitMargin}%`}
          trend="up"
          trendValue="+15%"
          icon={BarChart3}
          color="text-purple-600"
        />
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transactions Récentes */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Transactions Récentes
            </CardTitle>
          
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {dashboardData.recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
              {dashboardData.recentTransactions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Aucune transaction trouvée
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <Link
                href="/transactions"
                className="w-full justify-center text-blue-600 hover:text-blue-700 text-center block"
              >
                Voir toutes les transactions
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des Comptes */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-green-600" />
              Répartition des Comptes
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Ce mois
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {dashboardData.accountDistribution.map((account, index) => (
              <AccountDistributionItem key={index} account={account} />
            ))}
            {dashboardData.accountDistribution.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Aucun compte trouvé
              </div>
            )}

            {/* Légende et total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total des actifs</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(dashboardData.totalBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section supplémentaire - Aperçu rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-90">Actifs</span>
            </div>
            <p className="text-2xl font-bold mb-2">
              {formatCurrency(dashboardData.totalBalance)}
            </p>
            <p className="text-blue-100 text-sm">Solde total disponible</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-600 to-green-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-90">Revenus</span>
            </div>
            <p className="text-2xl font-bold mb-2">
              {formatCurrency(dashboardData.monthlyIncome)}
            </p>
            <p className="text-green-100 text-sm">Ce mois</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 opacity-80" />
              <span className="text-sm opacity-90">Performance</span>
            </div>
            <p className="text-2xl font-bold mb-2">
              {dashboardData.profitMargin}%
            </p>
            <p className="text-purple-100 text-sm">Marge bénéficiaire</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
