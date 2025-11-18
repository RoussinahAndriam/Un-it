<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


use App\Models\Transaction;
use Carbon\Carbon;

class rapportController extends Controller
{
   




    public function index(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;

        $transactions = Transaction::whereYear('transaction_date', $year)->get();

        $revenus = [];
        $depenses = [];

        foreach ($transactions as $t) {
            $mois = Carbon::parse($t->transaction_date)->month;

            if ($t->type === 'income') {
                if (!isset($revenus[$mois])) $revenus[$mois] = 0;
                $revenus[$mois] += $t->amount;
            } else {
                if (!isset($depenses[$mois])) $depenses[$mois] = 0;
                $depenses[$mois] += $t->amount;
            }
        }

        // Formatage pour Recharts
        $revenusFormatted = [];
        foreach ($revenus as $mois => $total) {
            $revenusFormatted[] = [
                'mois' => $mois,
                'total' => $total
            ];
        }

        $depensesFormatted = [];
        foreach ($depenses as $mois => $total) {
            $depensesFormatted[] = [
                'mois' => $mois,
                'total' => $total
            ];
        }

        return response()->json([
            'revenus' => $revenusFormatted,
            'depenses' => $depensesFormatted,
        ]);
    }
}


