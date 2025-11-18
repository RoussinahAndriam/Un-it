<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Exports\TransactionExport;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
  

  public function exportExcel(Request $request)
{
    $year = $request->year ?? date('Y');
    return Excel::download(new TransactionExport($year), "transactions_$year.xlsx");
}
}


