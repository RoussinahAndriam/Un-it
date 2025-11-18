<?php

// app/Exports/TransactionExport.php
namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TransactionExport implements FromCollection, WithHeadings
{
    protected $year;

    public function __construct($year)
    {
        $this->year = $year;
    }

    public function collection()
    {
        return Transaction::whereYear('transaction_date', $this->year)
            ->get(['transaction_date', 'type', 'amount', 'description']);
    }

    public function headings(): array
    {
        return ['Date', 'Type', 'Montant', 'Description'];
    }
}
