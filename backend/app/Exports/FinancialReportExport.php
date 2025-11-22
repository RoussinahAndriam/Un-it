
<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class FinancialReportExport implements FromCollection, WithHeadings, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data['transactions'])->map(function($transaction) {
            return [
                $transaction->transaction_date,
                $transaction->type,
                $transaction->category->name ?? 'Non catégorisé',
                $transaction->account->name,
                $transaction->amount,
                $transaction->description
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Date',
            'Type',
            'Catégorie',
            'Compte',
            'Montant',
            'Description'
        ];
    }

    public function title(): string
    {
        return 'Transactions';
    }
}