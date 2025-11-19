<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport Transactions {{ $year }}</title>
    <style>
        @page {
            margin: 20px;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            color: #2c5aa0;
            margin: 0;
            font-size: 24px;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        
        .summary-table th {
            background: #2c5aa0;
            color: white;
            padding: 12px 15px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #1e3d6d;
            font-size: 13px;
        }
        
        .summary-table td {
            padding: 15px;
            text-align: center;
            border: 1px solid #dee2e6;
            font-weight: bold;
            font-size: 14px;
        }
        
        .summary-income {
            color: #28a745;
            border-left: 4px solid #28a745;
        }
        
        .summary-expense {
            color: #dc3545;
            border-left: 4px solid #dc3545;
        }
        
        .summary-net {
            color: #007bff;
            border-left: 4px solid #007bff;
        }
        
        .summary-total {
            color: #6c757d;
            border-left: 4px solid #6c757d;
        }
        
        .accounts-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        
        .accounts-table th {
            background: #34495e;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #2c3e50;
        }
        
        .accounts-table td {
            padding: 8px;
            border: 1px solid #dee2e6;
        }
        
        .accounts-table tr:nth-child(even) {
            background-color: #fff;
        }
        
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
        }
        
        .details-table th {
            background: #2c5aa0;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #1e3d6d;
        }
        
        .details-table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        
        .details-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .amount {
            text-align: right;
            font-family: 'DejaVu Sans Mono', monospace;
        }
        
        .income-amount {
            color: #28a745;
            font-weight: bold;
        }
        
        .expense-amount {
            color: #dc3545;
            font-weight: bold;
        }
        
        .balance-positive {
            color: #28a745;
            font-weight: bold;
        }
        
        .balance-negative {
            color: #dc3545;
            font-weight: bold;
        }
        
        .type-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .type-revenu {
            background: #d4edda;
            color: #155724;
        }
        
        .type-depense {
            background: #f8d7da;
            color: #721c24;
        }
        
        .account-type-badge {
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 9px;
            font-weight: bold;
            background: #e9ecef;
            color: #495057;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        
        .page-number:before {
            content: "Page " counter(page);
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
        }
        
        .transaction-date {
            white-space: nowrap;
        }
        
        .description {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .section-title {
            background: #e9ecef;
            padding: 10px 15px;
            margin: 20px 0 10px 0;
            border-left: 4px solid #2c5aa0;
            font-weight: bold;
            font-size: 14px;
            color: #2c5aa0;
        }
        
        .currency {
            font-size: 10px;
            color: #666;
            margin-left: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport des Transactions</h1>
        <div class="subtitle">Année {{ $year }}</div>
        <div class="subtitle">Généré le {{ now()->format('d/m/Y à H:i') }}</div>
    </div>

    <!-- Tableau récapitulatif -->
    <div class="section-title">Récapitulatif Annuel</div>
    <table class="summary-table">
        <thead>
            <tr>
                <th width="25%">Revenus Totaux</th>
                <th width="25%">Dépenses Totales</th>
                <th width="25%">Solde Net</th>
                <th width="25%">Total Transactions</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="summary-income">
                    {{ number_format($stats['total_income'], 2, ',', ' ') }} Ar
                </td>
                <td class="summary-expense">
                    {{ number_format($stats['total_expense'], 2, ',', ' ') }} Ar
                </td>
                <td class="summary-net" style="color: {{ $stats['net_amount'] >= 0 ? '#28a745' : '#dc3545' }};">
                    {{ number_format($stats['net_amount'], 2, ',', ' ') }} Ar
                </td>
                <td class="summary-total">
                    {{ $stats['total_transactions'] }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Tableau des comptes -->
    @if(!empty($stats['account_balances']))
    <div class="section-title">Soldes par Compte</div>
    <table class="accounts-table">
        <thead>
            <tr>
                <th width="25%">Compte</th>
                <th width="15%">Type</th>
                <th width="15%">Solde Actuel</th>
                <th width="15%">Revenus {{ $year }}</th>
                <th width="15%">Dépenses {{ $year }}</th>
                <th width="15%">Solde {{ $year }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stats['account_balances'] as $account)
            <tr>
                <td>
                    <strong>{{ $account['name'] }}</strong>
                </td>
                <td>
                    <span class="account-type-badge">{{ $account['type'] }}</span>
                </td>
                <td class="amount {{ $account['balance'] >= 0 ? 'balance-positive' : 'balance-negative' }}">
                    {{ number_format($account['balance'], 2, ',', ' ') }} 
                    <span class="currency">{{ $account['currency'] }}</span>
                </td>
                <td class="amount income-amount">
                    {{ number_format($account['year_income'], 2, ',', ' ') }} 
                    <span class="currency">{{ $account['currency'] }}</span>
                </td>
                <td class="amount expense-amount">
                    {{ number_format($account['year_expense'], 2, ',', ' ') }} 
                    <span class="currency">{{ $account['currency'] }}</span>
                </td>
                <td class="amount {{ $account['year_net'] >= 0 ? 'balance-positive' : 'balance-negative' }}">
                    {{ number_format($account['year_net'], 2, ',', ' ') }} 
                    <span class="currency">{{ $account['currency'] }}</span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Tableau de détails des transactions -->
    <div class="section-title">Détail des Transactions</div>
    <table class="details-table">
        <thead>
            <tr>
                <th width="70">Date</th>
                <th width="70">Type</th>
                <th width="90">Compte</th>
                <th width="110">Catégorie</th>
                <th width="90" style="text-align: right;">Montant</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            @if($transactions->count() > 0)
                @foreach($transactions as $transaction)
                    <tr>
                        <td class="transaction-date">{{ $transaction->transaction_date->format('d/m/Y') }}</td>
                        <td>
                            <span class="type-badge type-{{ $transaction->type }}">
                                {{ $transaction->type === 'revenu' ? 'Revenu' : 'Dépense' }}
                            </span>
                        </td>
                        <td>{{ $transaction->account->name ?? 'N/A' }}</td>
                        <td>{{ $transaction->category->name ?? 'Non catégorisé' }}</td>
                        <td class="amount {{ $transaction->type }}-amount">
                            {{ $transaction->type === 'revenu' ? '+' : '-' }}{{ number_format($transaction->amount, 2, ',', ' ') }} Ar
                        </td>
                        <td class="description">{{ $transaction->description ?? 'Aucune description' }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="6" class="no-data">
                        Aucune transaction trouvée pour l'année {{ $year }}
                    </td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Tableau de synthèse par type -->
    @if($transactions->count() > 0)
    <div class="section-title">Synthèse par Type</div>
    <table class="summary-table">
        <thead>
            <tr>
                <th width="50%">Type de Transaction</th>
                <th width="25%">Nombre</th>
                <th width="25%">Montant Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align: left; padding-left: 20px;">Revenus</td>
                <td>{{ $transactions->where('type', 'revenu')->count() }}</td>
                <td class="income-amount">{{ number_format($stats['total_income'], 2, ',', ' ') }} Ar</td>
            </tr>
            <tr>
                <td style="text-align: left; padding-left: 20px;">Dépenses</td>
                <td>{{ $transactions->where('type', 'depense')->count() }}</td>
                <td class="expense-amount">{{ number_format($stats['total_expense'], 2, ',', ' ') }} Ar</td>
            </tr>
        </tbody>
    </table>
    @endif

    <div class="footer">
        <div class="page-number"></div>
        <div>Rapport généré automatiquement par le système</div>
    </div>
</body>
</html>