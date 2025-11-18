<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ThirdParty;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreThirdPartyRequest; // <-- Utilisation de Form Request

class ThirdPartyController extends Controller
{
    /**
     * Affiche la liste des tiers (clients/fournisseurs). (Fct 2.7)
     */
    public function index(Request $request)
    {
        try {
            $query = ThirdParty::query();
            if ($request->has('type')) $query->where('type', $request->type);
            $parties = $query->get();
            return response()->json(['data' => $parties], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e], 500);
        }
    }

    /**
     * Crée un nouveau tiers.
     */
    public function store(StoreThirdPartyRequest $request) // <-- Utilisation de Form Request
    {
        try {
            $party = ThirdParty::create($request->validated());
            return response()->json(['data' => $party, 'message' => 'Tiers créé.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création.'], 500);
        }
    }

    /**
     * Affiche un tiers spécifique (avec ses factures).
     */
    public function show(ThirdParty $thirdParty)
    {
        try {
            $thirdParty->load('invoices'); 
            return response()->json(['data' => $thirdParty], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tiers non trouvé.'], 404);
        }
    }

    /**
     * Met à jour un tiers.
     */
    public function update(StoreThirdPartyRequest $request, ThirdParty $thirdParty) // <-- Utilisation de Form Request
    {
        try {
            $thirdParty->update($request->validated());
            return response()->json(['data' => $thirdParty, 'message' => 'Tiers mis à jour.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tiers non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Supprime un tiers.
     */
    public function destroy(ThirdParty $thirdParty)
    {
        try {
            $thirdParty->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tiers non trouvé.'], 404);
        }
    }
}