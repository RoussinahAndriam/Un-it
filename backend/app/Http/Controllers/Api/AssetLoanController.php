<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssetLoan;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreAssetLoanRequest;
use Carbon\Carbon;

class AssetLoanController extends Controller
{
    /**
     * Affiche tous les prêts. (Fct 2.5)
     */
    public function index(Request $request)
    {
        try {
            $query = AssetLoan::with(['asset', 'user']);
            if ($request->has('status')) $query->where('status', $request->status);
            if ($request->has('user_id')) $query->where('user_id', $request->user_id);
            $loans = $query->get();
            return response()->json(['data' => $loans], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Crée un nouveau prêt (attribution). (Fct 2.5)
     */
    public function store(StoreAssetLoanRequest $request)
    {
        $validated = $request->validated();

        try {
            $loan = null;
            DB::transaction(function () use ($validated, &$loan) {
                $asset = Asset::findOrFail($validated['asset_id']);

                if ($asset->status !== 'en_service' || $asset->location !== 'en_stock') {
                    throw new \Exception('Cet actif n\'est pas disponible pour le prêt.');
                }

                $asset->status = 'en_service';
                $asset->location = 'Prete (Employe ' . $validated['user_id'] . ')';
                $asset->save();

                $loan = AssetLoan::create($validated + ['status' => 'en_cours']);
            });

            return response()->json(['data' => $loan, 'message' => 'Prêt enregistré.'], 201);
        
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Actif ou utilisateur non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du prêt.', 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Affiche un prêt spécifique.
     */
    public function show(AssetLoan $assetLoan)
    {
        try {
            return response()->json(['data' => $assetLoan->load(['asset', 'user'])], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Prêt non trouvé.'], 404);
        }
    }

    /**
     * Met à jour un prêt (ex: enregistrer le retour). (Fct 2.5)
     */
    public function update(Request $request, AssetLoan $assetLoan)
    {
        $validated = $request->validate([
            'return_date' => 'sometimes|required|date_format:Y-m-d',
            'status' => 'sometimes|required|in:en_cours,termine'
        ]);

        if (isset($validated['status']) && $validated['status'] == 'termine') {
            try {
                DB::transaction(function () use ($assetLoan, $validated) {
                    $assetLoan->status = 'termine';
                    $assetLoan->return_date = $validated['return_date'] ?? now()->format('Y-m-d');
                    $assetLoan->save();

                    $asset = $assetLoan->asset;
                    $asset->status = 'en_service';
                    $asset->location = 'en_stock';
                    $asset->save();
                });
                return response()->json(['data' => $assetLoan, 'message' => 'Retour de matériel enregistré.'], 200);

            } catch (\Exception $e) {
                return response()->json(['message' => 'Erreur lors du retour.', 'error' => $e->getMessage()], 500);
            }
        }
        
        $assetLoan->update($validated);
        return response()->json(['data' => $assetLoan, 'message' => 'Prêt mis à jour.'], 200);
    }

    /**
     * Enregistre le retour d'un matériel prêté. (Fct 2.5)
     */
    public function returnLoan(Request $request, $id)
    {
        $validated = $request->validate([
            'return_date' => 'sometimes|date_format:Y-m-d',
            'notes' => 'sometimes|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            // Récupérer le prêt avec ses relations
            $loan = AssetLoan::with(['asset'])->findOrFail($id);

            // Vérifier que le prêt est en cours
            if ($loan->status === 'termine') {
                return response()->json([
                    'message' => 'Ce matériel a déjà été retourné.'
                ], 400);
            }

            // Date de retour (aujourd'hui par défaut)
            $returnDate = $validated['return_date'] ?? Carbon::now()->toDateString();

            // Marquer le prêt comme terminé
            $loan->update([
                'status' => 'termine',
                'return_date' => $returnDate,
                'notes' => $validated['notes'] ?? $loan->notes
            ]);

            // Remettre l'actif en stock
            $asset = $loan->asset;
            $asset->update([
                'status' => 'en_service',
                'location' => 'en_stock'
            ]);

            DB::commit();

            // Recharger les relations pour la réponse
            $loan->load(['asset', 'user']);

            return response()->json([
                'data' => $loan,
                'message' => 'Retour de matériel enregistré avec succès. L\'actif est à nouveau disponible.'
            ], 200);

        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json(['message' => 'Prêt non trouvé.'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors du retour du matériel: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement du retour.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Supprime un prêt (annulation). (Fct 2.5)
     */
    public function destroy(AssetLoan $assetLoan)
    {
        try {
            DB::transaction(function () use ($assetLoan) {
                // Si le prêt est en cours, remettre l'actif en stock
                if ($assetLoan->status === 'en_cours') {
                    $asset = $assetLoan->asset;
                    $asset->status = 'en_service';
                    $asset->location = 'en_stock';
                    $asset->save();
                }

                $assetLoan->delete();
            });

            return response()->json(null, 204);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Prêt non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression.'], 500);
        }
    }
}