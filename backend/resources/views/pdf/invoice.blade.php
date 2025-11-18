<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
            padding: 40px 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .invoice-type {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 18px;
            opacity: 0.9;
            font-weight: 500;
        }
        
        .invoice-body {
            padding: 40px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .info-section h3 {
            color: #1e40af;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-card {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #3b82f6;
        }
        
        .info-item {
            display: flex;
            justify-content: between;
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: 500;
            color: #64748b;
            min-width: 120px;
        }
        
        .info-value {
            font-weight: 600;
            color: #1e293b;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-pending {
            background: #fef9c3;
            color: #854d0e;
        }
        
        .status-overdue {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .status-draft {
            background: #f3f4f6;
            color: #374151;
        }
        
        .amounts-section {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
        }
        
        .amount-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            text-align: center;
        }
        
        .amount-item {
            padding: 20px;
        }
        
        .amount-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .amount-value {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
        }
        
        .amount-total {
            color: #1e40af;
        }
        
        .amount-paid {
            color: #16a34a;
        }
        
        .amount-due {
            color: #dc2626;
        }
        
        .lines-section {
            margin: 40px 0;
        }
        
        .lines-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .lines-table th {
            background: #f1f5f9;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .lines-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .lines-table tr:last-child td {
            border-bottom: none;
        }
        
        .payment-terms {
            background: #fff7ed;
            border: 1px solid #fdba74;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .payment-terms h4 {
            color: #ea580c;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .invoice-footer {
            background: #f8fafc;
            padding: 30px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .footer-note {
            color: #64748b;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            
            .invoice-header {
                padding: 30px 20px;
            }
            
            .invoice-body {
                padding: 30px 20px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .amount-grid {
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .lines-table {
                font-size: 14px;
            }
            
            .lines-table th,
            .lines-table td {
                padding: 10px 8px;
            }
        }
        
        .due-date-warning {
            display: inline-flex;
            align-items: center;
            background: #fef3c7;
            color: #92400e;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-left: 10px;
        }
        
        .due-date-warning::before {
            content: '⏰';
            margin-right: 6px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- En-tête de la facture -->
        <div class="invoice-header">
            <div class="invoice-type">Facture {{ $invoice->type }}</div>
            <h1 class="invoice-title">FACTURE</h1>
            <div class="invoice-number">N° {{ $invoice->invoice_number }}</div>
        </div>
        
        <!-- Corps de la facture -->
        <div class="invoice-body">
            <!-- Informations générales -->
            <div class="info-grid">
                <!-- Informations du tiers -->
                <div class="info-section">
                    <h3>{{ $invoice->type === 'achat' ? 'Fournisseur' : 'Client' }}</h3>
                    <div class="info-card">
                        @if($invoice->thirdParty)
                        <div class="info-item">
                            <span class="info-label">Nom:</span>
                            <span class="info-value">{{ $invoice->thirdParty->name }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">{{ $invoice->thirdParty->email }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Téléphone:</span>
                            <span class="info-value">{{ $invoice->thirdParty->phone }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Adresse:</span>
                            <span class="info-value">{{ $invoice->thirdParty->address }}</span>
                        </div>
                        @else
                        <div class="info-item">
                            <span class="info-value">Aucun tiers associé</span>
                        </div>
                        @endif
                    </div>
                </div>
                
                <!-- Informations de la facture -->
                <div class="info-section">
                    <h3>Détails de la facture</h3>
                    <div class="info-card">
                        <div class="info-item">
                            <span class="info-label">Date d'émission:</span>
                            <span class="info-value">{{ $invoice->issue_date->format('d/m/Y') }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date d'échéance:</span>
                            <span class="info-value">
                                {{ $invoice->due_date->format('d/m/Y') }}
                                @if($invoice->due_date->isPast() && $invoice->status !== 'paid')
                                <span class="due-date-warning">Échue</span>
                                @endif
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Statut:</span>
                            <span class="info-value">
                                @php
                                    $statusClass = match($invoice->status) {
                                        'paid' => 'status-paid',
                                        'pending' => 'status-pending',
                                        'overdue' => 'status-overdue',
                                        default => 'status-draft'
                                    };
                                @endphp
                                <span class="status-badge {{ $statusClass }}">
                                    {{ $invoice->status }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Montants -->
            <div class="amounts-section">
                <div class="amount-grid">
                    <div class="amount-item">
                        <div class="amount-label">Sous-total</div>
                        <div class="amount-value">{{ number_format($invoice->subtotal, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="amount-item">
                        <div class="amount-label">TVA</div>
                        <div class="amount-value">{{ number_format($invoice->tax_amount, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="amount-item">
                        <div class="amount-label amount-total">Total</div>
                        <div class="amount-value amount-total">{{ number_format($invoice->total_amount, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="amount-item">
                        <div class="amount-label amount-paid">Payé</div>
                        <div class="amount-value amount-paid">{{ number_format($invoice->amount_paid, 2, ',', ' ') }} €</div>
                    </div>
                </div>
                
                <!-- Solde restant -->
                @php
                    $balance_due = $invoice->total_amount - $invoice->amount_paid;
                @endphp
                @if($balance_due > 0)
                <div style="text-align: center; margin-top: 20px;">
                    <div class="amount-label amount-due">SOLDE RESTANT À PAYER</div>
                    <div class="amount-value amount-due" style="font-size: 28px;">
                        {{ number_format($balance_due, 2, ',', ' ') }} €
                    </div>
                </div>
                @else
                <div style="text-align: center; margin-top: 20px;">
                    <div class="amount-label amount-paid">FACTURE PAYÉE</div>
                    <div class="amount-value amount-paid" style="font-size: 28px;">
                        Solde réglé
                    </div>
                </div>
                @endif
            </div>
            
            <!-- Lignes de facture -->
            @if($invoice->lines->count() > 0)
            <div class="lines-section">
                <h3 style="color: #1e40af; margin-bottom: 20px;">DÉTAIL DES ARTICLES</h3>
                <table class="lines-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoice->lines as $line)
                        <tr>
                            <td>{{ $line->description }}</td>
                            <td>{{ $line->quantity }}</td>
                            <td>{{ number_format($line->unit_price, 2, ',', ' ') }} €</td>
                            <td>{{ number_format($line->total, 2, ',', ' ') }} €</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @endif
            
            <!-- Conditions de paiement -->
            @if($invoice->payment_terms)
            <div class="payment-terms">
                <h4>📋 Conditions de Paiement</h4>
                <p>{{ $invoice->payment_terms }}</p>
            </div>
            @endif
            
            <!-- Documents attachés -->
            @if($invoice->documents->count() > 0)
            <div class="info-section">
                <h3>Documents attachés</h3>
                <div class="info-card">
                    @foreach($invoice->documents as $document)
                    <div class="info-item">
                        <span class="info-label">Document:</span>
                        <span class="info-value">{{ $document->file_name }}</span>
                    </div>
                    @endforeach
                </div>
            </div>
            @endif
        </div>
        
        <!-- Pied de page -->
        <div class="invoice-footer">
            <p class="footer-note">
                Facture générée le {{ now()->format('d/m/Y à H:i') }}<br>
                Pour toute question concernant cette facture, veuillez contacter notre service comptable.
            </p>
        </div>
    </div>
</body>
</html>