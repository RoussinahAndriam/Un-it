<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre Facture UN-IT</title>
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
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .email-header {
            background: linear-gradient(135deg, #2c5aa0, #3a6bc5);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .email-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
        }
        
        .email-body {
            padding: 40px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2c5aa0;
            margin-bottom: 20px;
        }
        
        .message {
            margin-bottom: 30px;
            color: #475569;
        }
        
        .amount-card {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
            border-left: 4px solid #2c5aa0;
        }
        
        .amount-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .amount-value {
            font-size: 28px;
            font-weight: 700;
            color: #2c5aa0;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        
        .detail-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .detail-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2c5aa0, #3a6bc5);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(44, 90, 160, 0.3);
        }
        
        .attachments {
            background: #fff7ed;
            border: 1px solid #fdba74;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .attachments h4 {
            color: #ea580c;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .footer-note {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .contact-info {
            margin-top: 15px;
            font-size: 14px;
            color: #64748b;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .email-body {
                padding: 30px 20px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- En-tête de l'email -->
        <div class="email-header">
            <div class="logo">UN-IT</div>
            <h1 class="email-title">Votre Facture</h1>
            <div class="invoice-number">N° {{ $invoice->invoice_number }}</div>
        </div>
        
        <!-- Corps de l'email -->
        <div class="email-body">
            <div class="greeting">Bonjour {{ $invoice->thirdParty->name }},</div>
            
            <div class="message">
                <p>Votre facture <strong>#{{ $invoice->invoice_number }}</strong> a été émise le <strong>{{ $invoice->issue_date->format('d/m/Y') }}</strong>.</p>
                
                <p>Vous trouverez ci-joint le détail de votre facture au format PDF.</p>
            </div>
            
            <!-- Montant principal -->
            <div class="amount-card">
                <div class="amount-label">MONTANT TOTAL</div>
                <div class="amount-value">{{ number_format($invoice->total_amount, 2, ',', ' ') }} Ar</div>
            </div>
            
            <!-- Détails importants -->
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Date d'émission</div>
                    <div class="detail-value">{{ $invoice->issue_date->format('d/m/Y') }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date d'échéance</div>
                    <div class="detail-value">{{ $invoice->due_date->format('d/m/Y') }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Statut</div>
                    <div class="detail-value" style="color: 
                        @if($invoice->status === 'paid') #16a34a
                        @elseif($invoice->status === 'pending') #d97706
                        @elseif($invoice->status === 'overdue') #dc2626
                        @else #6b7280
                        @endif">
                        {{ ucfirst($invoice->status) }}
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Solde dû</div>
                    <div class="detail-value" style="color: #dc2626;">
                        {{ number_format($invoice->total_amount - $invoice->amount_paid, 2, ',', ' ') }} Ar
                    </div>
                </div>
            </div>
            
            <!-- Bouton d'action -->
            <div style="text-align: center;">
                <a href="#" class="cta-button">Télécharger la facture</a>
            </div>
            
            <!-- Conditions de paiement -->
            @if($invoice->payment_terms)
            <div class="attachments">
                <h4>📋 Conditions de Paiement</h4>
                <p>{{ $invoice->payment_terms }}</p>
            </div>
            @endif
            
            <!-- Informations de paiement -->
            <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="color: #2c5aa0; margin-bottom: 15px;">💳 Modalités de Paiement</h4>
                <p style="margin-bottom: 10px; color: #475569;">
                    <strong>Virement bancaire:</strong><br>
                    IBAN: FR76 XXXX XXXX XXXX XXXX XXXX XXX<br>
                    BIC: XXXXXXXX
                </p>
                <p style="color: #475569; margin-bottom: 0;">
                    <strong>Chèque:</strong> À l'ordre de UN-IT
                </p>
            </div>
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
            <p class="footer-note">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.<br>
                Votre facture est disponible en pièce jointe au format PDF.
            </p>
            
            <div class="contact-info">
                <strong>UN-IT</strong><br>
                Service Facturation<br>
                Email: 	contact@unityfianar.site<br>
                Téléphone: +261388456158
            </div>
        </div>
    </div>
</body>
</html>