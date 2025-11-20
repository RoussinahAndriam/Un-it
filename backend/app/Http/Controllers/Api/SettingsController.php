<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Récupérez les paramètres depuis la base de données ou utilisez des valeurs par défaut
        $settings = $this->getSettings();

        return response()->json([
            'data' => $settings
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $request->validate([
            'site_name' => 'sometimes|string|max:255',
            'maintenance_mode' => 'sometimes|boolean',
            'max_users' => 'sometimes|integer|min:1',
            'email_notifications' => 'sometimes|boolean',
        ]);

        try {
            // Si vous avez une table settings, utilisez-la
            // Sinon, utilisez le cache ou retournez simplement les données
            $this->saveSettings($request->all());

            return response()->json([
                'message' => 'Paramètres mis à jour avec succès',
                'data' => $request->all()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les paramètres depuis la base ou le cache
     */
    private function getSettings()
    {
        // Vérifiez si vous avez une table settings
        if ($this->settingsTableExists()) {
            return $this->getSettingsFromDatabase();
        }

        // Sinon, utilisez des valeurs par défaut
        return [
            'site_name' => config('app.name', 'Mon Application'),
            'maintenance_mode' => false,
            'max_users' => 100,
            'email_notifications' => true,
        ];
    }

    /**
     * Sauvegarde les paramètres
     */
    private function saveSettings(array $settings)
    {
        // Si vous avez une table settings, implémentez la sauvegarde
        if ($this->settingsTableExists()) {
            $this->saveSettingsToDatabase($settings);
        } else {
            // Sinon, utilisez le cache
            foreach ($settings as $key => $value) {
                Cache::put('setting_' . $key, $value, now()->addDays(30));
            }
        }
    }

    /**
     * Vérifie si la table settings existe
     */
    private function settingsTableExists(): bool
    {
        try {
            return DB::getSchemaBuilder()->hasTable('settings');
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Récupère les paramètres depuis la base de données
     */
    private function getSettingsFromDatabase()
    {
        // Implémentez la logique pour récupérer depuis votre table settings
        // Exemple basique :
        $settings = DB::table('settings')->pluck('value', 'key')->toArray();

        return array_merge([
            'site_name' => config('app.name', 'Mon Application'),
            'maintenance_mode' => false,
            'max_users' => 100,
            'email_notifications' => true,
        ], $settings);
    }

    /**
     * Sauvegarde les paramètres dans la base de données
     */
    private function saveSettingsToDatabase(array $settings)
    {
        // Implémentez la logique de sauvegarde
        foreach ($settings as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }
    }
}