<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code de Vérification</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Inter', Arial, sans-serif;
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .email-container {
            max-width: 500px;
            width: 100%;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .email-container:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .header {
            background: linear-gradient(135deg, #1a73e8, #4285f4);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header-icon {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 36px;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .header p {
            font-size: 16px;
            font-weight: 400;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .otp-display {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            border: 1px solid #e3e8f0;
            position: relative;
            overflow: hidden;
        }
        
        .otp-display::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #1a73e8, #4285f4);
        }
        
        .otp-code {
            font-size: 48px;
            font-weight: 700;
            color: #1a73e8;
            letter-spacing: 12px;
            text-align: center;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(26, 115, 232, 0.1);
            margin: 10px 0;
        }
        
        .instruction {
            font-size: 16px;
            color: #5f6368;
            text-align: center;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        
        .timer-warning {
            display: inline-flex;
            align-items: center;
            background: #fff3cd;
            color: #856404;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            margin: 20px 0;
            border: 1px solid #ffeaa7;
        }
        
        .timer-warning::before {
            content: '⏰';
            margin-right: 8px;
            font-size: 16px;
        }
        
        .security-note {
            background: #f8f9fa;
            border-left: 4px solid #1a73e8;
            padding: 16px 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        
        .security-note h3 {
            color: #1a73e8;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .security-note p {
            color: #5f6368;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-top: 1px solid #e3e8f0;
        }
        
        .footer p {
            color: #8a8d91;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 8px;
        }
        
        .support-link {
            color: #1a73e8;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        
        .support-link:hover {
            color: #1557b0;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #1a73e8, #4285f4);
            color: white;
            padding: 14px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(26, 115, 232, 0.4);
        }
        
        @media (max-width: 480px) {
            body {
                padding: 20px 10px;
            }
            
            .email-container {
                border-radius: 16px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .otp-code {
                font-size: 36px;
                letter-spacing: 8px;
            }
            
            .header-icon {
                width: 60px;
                height: 60px;
                font-size: 28px;
            }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.4);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(26, 115, 232, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(26, 115, 232, 0);
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- En-tête -->
        <div class="header">
            <div class="header-icon">🔒</div>
            <h1>Vérification de Sécurité</h1>
            <p>Code de vérification à usage unique</p>
        </div>
        
        <!-- Contenu principal -->
        <div class="content">
            <p class="instruction">
                Bonjour,<br>
                Utilisez le code ci-dessous pour compléter votre vérification de sécurité.
            </p>
            
            <!-- Code OTP -->
            <div class="otp-display pulse">
                <div class="otp-code">{{ $otp }}</div>
            </div>
            
            <!-- Timer d'expiration -->
            <div class="timer-warning">
                Ce code expire dans <strong style="margin: 0 4px;">10 minutes</strong>
            </div>
            
            <!-- Note de sécurité -->
            <div class="security-note">
                <h3>🛡️ Conseils de Sécurité</h3>
                <p>
                    Ne partagez jamais ce code avec qui que ce soit. Notre équipe de support ne vous le demandera jamais.
                    Si vous n'avez pas initié cette demande, veuillez ignorer cet email.
                </p>
            </div>
            
            <!-- Bouton d'action (optionnel) -->
            <div style="text-align: center;">
                <a href="#" class="button">Vérifier mon compte</a>
            </div>
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
            <p>
                <strong>Besoin d'aide ?</strong><br>
                Contactez notre support à 
                <a href="mailto:support@votreentreprise.com" class="support-link">.com</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #a8aaad;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.<br>
                © 2024 UN-IT. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>