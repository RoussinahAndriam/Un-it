<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreAssetRequest; // <-- Utilisation de Form Request
use App\Http\Requests\UpdateAssetRequest; // <-- Utilisation de Form Request

class AssetController extends Controller
{
    /**
     * Affiche l'inventaire des actifs matériels. (Fct 2.4)
     */
    public function index(Request $request)
    {
        try {
            $query = Asset::query();
            if ($request->has('status')) $query->where('status', $request->status);
            if ($request->has('location')) $query->where('location', $request->location);
            $assets = $query->get();
            return response()->json(['data' => $assets], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Enregistre un nouvel actif. (Fct 2.4)
     */
    public function store(StoreAssetRequest $request) // <-- Utilisation de Form Request
    {
        try {
            $asset = Asset::create($request->validated());
            return response()->json(['data' => $asset, 'message' => 'Actif créé.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création.'], 500);
        }
    }

    /**
     * Affiche un actif spécifique.
     */
    public function show(Asset $asset)
    {
        try {
            $asset->load(['loans', 'loans.user']);
            return response()->json(['data' => $asset], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Actif non trouvé.'], 404);
        }
    }

    /**
     * Met à jour un actif.
     */
    public function update(UpdateAssetRequest $request, Asset $asset) // <-- Utilisation de Form Request
    {
        try {
            $asset->update($request->validated());
            return response()->json(['data' => $asset, 'message' => 'Actif mis à jour.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Actif non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Supprime un actif.
     */
    public function destroy(Asset $asset)
    {
        try {
            if ($asset->loans()->where('status', 'en_cours')->exists()) {
                 return response()->json(['message' => 'Impossible de supprimer un actif en cours de prêt.'], 400);
            }
            $asset->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Actif non trouvé.'], 404);
        }
    }
}