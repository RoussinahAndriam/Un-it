<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Account;
use App\Models\Asset;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Génère un rapport financier (revenus, dépenses, flux). (Fct 2.2, 3.3)
     */
    public function financialSummary(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'];

        try {
            $totalRevenues = Transaction::where('type', 'revenu')
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('amount');
                
            $totalExpenses = Transaction::where('type', 'depense')
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('amount');

            $totalBalance = Account::sum('balance');

            $expensesByCategory = Transaction::where('transactions.type', 'depense')
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id')
                ->select('transaction_categories.name', DB::raw('SUM(transactions.amount) as total'))
                ->groupBy('transaction_categories.name')
                ->get();
            
            $profit = $totalRevenues - $totalExpenses;

            return response()->json([
                'data' => [
                    'period' => ['start' => $startDate, 'end' => $endDate,],
                    'total_revenues' => $totalRevenues,
                    'total_expenses' => $totalExpenses,
                    'net_profit' => $profit,
                    'current_total_balance' => $totalBalance,
                    'expenses_by_category' => $expensesByCategory,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la génération du rapport.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Génère un rapport sur les actifs. (Fct 2.4, 3.3)
     */
    public function assetSummary(Request $request)
    {
        try {
            $assetsByStatus = Asset::select('status', DB::raw('COUNT(id) as count'))
                ->groupBy('status')
                ->get();
                
            $totalAssetValue = Asset::sum('acquisition_value');
            
            $assetsOnLoan = Asset::where('location', 'like', 'Prete%')
                ->with('loans', 'loans.user')
                ->get();

            return response()->json([
                'data' => [
                    'assets_by_status' => $assetsByStatus,
                    'total_inventory_value' => $totalAssetValue,
                    'assets_on_loan_count' => $assetsOnLoan->count(),
                    'assets_on_loan_details' => $assetsOnLoan,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la génération du rapport.', 'error' => $e->getMessage()], 500);
        }
    }


     public function monthlyStats(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2030',
        ]);

        $year = $validated['year'];

        try {
            // Revenus mensuels
            $monthlyRevenues = Transaction::where('type', 'revenu')
                ->whereYear('transaction_date', $year)
                ->select(
                    DB::raw('MONTH(transaction_date) as mois'),
                    DB::raw('SUM(amount) as total')
                )
                ->groupBy(DB::raw('MONTH(transaction_date)'))
                ->get()
                ->map(function($item) {
                    return [
                        'mois' => (int)$item->mois,
                        'total' => (float)$item->total
                    ];
                });

            // Dépenses mensuelles
            $monthlyExpenses = Transaction::where('type', 'depense')
                ->whereYear('transaction_date', $year)
                ->select(
                    DB::raw('MONTH(transaction_date) as mois'),
                    DB::raw('SUM(amount) as total')
                )
                ->groupBy(DB::raw('MONTH(transaction_date)'))
                ->get()
                ->map(function($item) {
                    return [
                        'mois' => (int)$item->mois,
                        'total' => (float)$item->total
                    ];
                });

            // Compléter avec les mois manquants (0 pour les mois sans données)
            $completeRevenues = $this->fillMissingMonths($monthlyRevenues, $year);
            $completeExpenses = $this->fillMissingMonths($monthlyExpenses, $year);

            return response()->json([
                'success' => true,
                'data' => [
                    'revenus' => $completeRevenues,
                    'depenses' => $completeExpenses,
                    'year' => $year
                ],
                'message' => 'Statistiques mensuelles générées avec succès.'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur statistiques mensuelles: ' . $e->getMessage(), [
                'year' => $year,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des statistiques.',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur'
            ], 500);
        }
    }

    /**
     * Remplit les mois manquants avec des valeurs à 0
     */
    private function fillMissingMonths($data, $year)
    {
        $completeData = [];
        
        for ($month = 1; $month <= 12; $month++) {
            $found = $data->firstWhere('mois', $month);
            $completeData[] = [
                'mois' => $month,
                'total' => $found ? $found['total'] : 0
            ];
        }
        
        return $completeData;
    }

    /**
     * Export Excel des statistiques
     */
    public function exportExcel(Request $request)
    {
        try {
            $year = $request->get('year', date('Y'));
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel.',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur'
            ], 500);
        }
    }

    /**
     * Export PDF des statistiques
     */
    public function exportPdf(Request $request)
    {
        try {
            $year = $request->get('year', date('Y'));
            
            // Récupération des transactions avec les relations
            $transactions = Transaction::with(['account', 'category'])
                ->whereYear('transaction_date', $year)
                ->orderBy('transaction_date', 'asc')
                ->get();

            // Calcul des totaux
            $totalIncome = $transactions->where('type', 'revenu')->sum('amount');
            $totalExpense = $transactions->where('type', 'depense')->sum('amount');
            $netAmount = $totalIncome - $totalExpense;

            // Récupération des comptes avec leurs soldes
            $accounts = Account::with(['transactions' => function($query) use ($year) {
                $query->whereYear('transaction_date', $year);
            }])->get();

            // Calcul des soldes par compte pour l'année
            $accountBalances = [];
            foreach ($accounts as $account) {
                $accountIncome = $account->transactions->where('type', 'revenu')->sum('amount');
                $accountExpense = $account->transactions->where('type', 'depense')->sum('amount');
                $accountNet = $accountIncome - $accountExpense;
                
                $accountBalances[] = [
                    'name' => $account->name,
                    'type' => $account->type,
                    'balance' => $account->balance,
                    'currency' => $account->currency,
                    'year_income' => $accountIncome,
                    'year_expense' => $accountExpense,
                    'year_net' => $accountNet
                ];
            }

            $stats = [
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net_amount' => $netAmount,
                'total_transactions' => $transactions->count(),
                'year' => $year,
                'account_balances' => $accountBalances
            ];

            // Génération PDF avec une vue
            $pdf = Pdf::loadView('exports.transactions', [
                'year' => $year,
                'transactions' => $transactions,
                'stats' => $stats
            ])
            ->setPaper('a4', 'portrait')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);

            $fileName = "rapport_transactions_{$year}_" . now()->format('Y-m-d') . ".pdf";

            return $pdf->download($fileName); 

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export PDF.',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne'
            ], 500);
        }
    }
}