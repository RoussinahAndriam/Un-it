<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SecurityController extends Controller
{
    






    /**
     * Récupérer les logs de sécurité
     */
    public function getLogs()
    {
        // Logs des connexions - adaptez selon votre structure
        $logs = DB::table('personal_access_tokens')
            ->select('tokenable_id', 'name', 'last_used_at', 'created_at')
            ->where('tokenable_type', 'App\Models\User')
            ->orderBy('last_used_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $logs
        ]);
    }

    /**
     * Mettre à jour la politique de mots de passe
     */
    public function updatePasswordPolicy(Request $request)
    {
        $request->validate([
            'password_min_length' => 'sometimes|integer|min:6',
            'password_requires_numbers' => 'sometimes|boolean',
            'password_requires_special_chars' => 'sometimes|boolean',
            'max_login_attempts' => 'sometimes|integer|min:1',
            'session_timeout' => 'sometimes|integer|min:1',
        ]);

        // Pour l'instant, on retourne simplement les données
        // Vous pouvez les sauvegarder dans une table settings ou dans le cache

        return response()->json([
            'message' => 'Politique de mot de passe mise à jour',
            'data' => $request->all()
        ]);
    }

}
