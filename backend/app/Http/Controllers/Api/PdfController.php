<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
  use Barryvdh\DomPDF\Facade\Pdf;
  
use App\Models\Transaction;

class PdfController extends Controller
{
   




  

public function exportPdf(Request $request)
{
    $year = $request->year ?? date('Y');
    $transactions = Transaction::whereYear('transaction_date', $year)
        ->get();

    $pdf = Pdf::loadView('exports.transactions', [
        'transactions' => $transactions,
        'year' => $year,
    ]);
//
}
}


