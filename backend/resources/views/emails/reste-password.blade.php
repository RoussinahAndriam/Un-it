<!DOCTYPE html>
<html>
<head>
    <title>Resetpassword</title>
</head>
<body>
    <a href="// env('FRONTEND_URL') . '/reset-password?token=' . $token .">Reinitialiser</a>
    <p>Ce code expire dans 15 minutes.</p>
    <p>Si vous n'avez pas demandé ce code, ignorez cet e-mail.</p>
</body>
</html>