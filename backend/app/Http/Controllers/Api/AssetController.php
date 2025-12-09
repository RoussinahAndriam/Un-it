<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Account; // <-- Ajouté
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;

class AssetController extends Controller
{
    /**
     * Affiche l'inventaire des actifs matériels.
     */
    public function index(Request $request)
    {
        try {
            $query = Asset::with('account'); // <-- Ajouté 'account'
            
            if ($request->has('status')) $query->where('status', $request->status);
            if ($request->has('location')) $query->where('location', $request->location);
            if ($request->has('account_id')) $query->where('account_id', $request->account_id);
            
            $assets = $query->get();
            return response()->json(['data' => $assets], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Enregistre un nouvel actif.
     */
    public function store(StoreAssetRequest $request)
    {
        try {
            $validatedData = $request->validated();
            
            // Gestion de la mise à jour du solde du compte
            if (!empty($validatedData['account_id']) && !empty($validatedData['acquisition_value'])) {
                $account = Account::find($validatedData['account_id']);
                
                if ($account) {
                    // Vérifier si le compte a suffisamment de fonds
                    if ($account->balance < $validatedData['acquisition_value']) {
                        return response()->json([
                            'message' => 'Solde insuffisant sur le compte sélectionné.'
                        ], 400);
                    }
                    
                    // Décrémenter le solde du compte
                    $account->decrement('balance', $validatedData['acquisition_value']);
                    
                    // Optionnel : Enregistrer une transaction
                    // Vous pouvez créer un modèle Transaction ici si nécessaire
                }
            }
            
            $asset = Asset::create($validatedData);
            
            return response()->json([
                'data' => $asset->load('account'),
                'message' => 'Actif créé avec succès.'
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche un actif spécifique.
     */
    public function show(Asset $asset)
    {
        try {
            $asset->load(['loans', 'loans.user', 'account']); // <-- Ajouté 'account'
            return response()->json(['data' => $asset], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Actif non trouvé.'], 404);
        }
    }

    /**
     * Met à jour un actif.
     */
   public function update(UpdateAssetRequest $request, Asset $asset)
{
    try {
        $validatedData = $request->validated();
        $oldAccountId = $asset->account_id;
        $oldAcquisitionValue = $asset->acquisition_value ?? 0;
        
        // DEBUG: Log les données reçues
        \Log::info('Update Asset Data', [
            'asset_id' => $asset->id,
            'old_account_id' => $oldAccountId,
            'old_value' => $oldAcquisitionValue,
            'new_data' => $validatedData
        ]);
        
        // Gestion des changements de compte et de valeur
        if (isset($validatedData['account_id']) || isset($validatedData['acquisition_value'])) {
            
            // Convertir account_id en null si vide
            if (isset($validatedData['account_id']) && $validatedData['account_id'] === '') {
                $validatedData['account_id'] = null;
            }
            
            // Si l'ancien actif avait un compte, restaurer le solde
            if ($oldAccountId && $oldAcquisitionValue > 0) {
                $oldAccount = Account::find($oldAccountId);
                if ($oldAccount) {
                    $oldAccount->increment('balance', $oldAcquisitionValue);
                    \Log::info('Ancien compte crédité', [
                        'account_id' => $oldAccountId,
                        'montant' => $oldAcquisitionValue
                    ]);
                }
            }
            
            // Appliquer la nouvelle valeur au nouveau compte
            $newAccountId = $validatedData['account_id'] ?? $oldAccountId;
            $newAcquisitionValue = $validatedData['acquisition_value'] ?? $oldAcquisitionValue;
            
            // DEBUG
            \Log::info('Nouvelles valeurs', [
                'new_account_id' => $newAccountId,
                'new_acquisition_value' => $newAcquisitionValue
            ]);
            
            if ($newAccountId && $newAcquisitionValue > 0) {
                $newAccount = Account::find($newAccountId);
                
                if ($newAccount) {
                    // Vérifier le solde
                    if ($newAccount->balance < $newAcquisitionValue) {
                        // Re-créditer l'ancien compte si existant
                        if ($oldAccountId && $oldAcquisitionValue > 0) {
                            $oldAccount = Account::find($oldAccountId);
                            if ($oldAccount) {
                                $oldAccount->decrement('balance', $oldAcquisitionValue);
                            }
                        }
                        
                        return response()->json([
                            'message' => 'Solde insuffisant sur le nouveau compte sélectionné.'
                        ], 400);
                    }
                    
                    // Débiter le nouveau compte
                    $newAccount->decrement('balance', $newAcquisitionValue);
                    \Log::info('Nouveau compte débité', [
                        'account_id' => $newAccountId,
                        'montant' => $newAcquisitionValue
                    ]);
                }
            }
        }
        
        // DEBUG avant mise à jour
        \Log::info('Avant mise à jour asset', [
            'validated_data' => $validatedData
        ]);
        
        // Mettre à jour l'actif
        $asset->update($validatedData);
        
        // DEBUG après mise à jour
        \Log::info('Après mise à jour asset', [
            'asset_id' => $asset->id,
            'account_id' => $asset->account_id,
            'fresh_account_id' => $asset->fresh()->account_id
        ]);
        
        // Recharger les relations pour la réponse
        $asset->load('account');
        
        return response()->json([
            'data' => $asset,
            'message' => 'Actif mis à jour avec succès.'
        ], 200);
        
    } catch (ModelNotFoundException $e) {
        return response()->json(['message' => 'Actif non trouvé.'], 404);
    } catch (\Exception $e) {
        \Log::error('Erreur mise à jour asset', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'message' => 'Erreur lors de la mise à jour.',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Supprime un actif.
     */
    public function destroy(Asset $asset)
    {
        try {
            if ($asset->loans()->where('status', 'en_cours')->exists()) {
                return response()->json([
                    'message' => 'Impossible de supprimer un actif en cours de prêt.'
                ], 400);
            }
            
            // Restaurer le solde du compte si l'actif a une valeur
            if ($asset->account_id && $asset->acquisition_value) {
                $account = Account::find($asset->account_id);
                if ($account) {
                    $account->increment('balance', $asset->acquisition_value);
                }
            }
            
            $asset->delete();
            
            return response()->json([
                'message' => 'Actif supprimé avec succès. Le solde du compte a été restauré.'
            ], 200);
            
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Actif non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Méthode optionnelle pour récupérer les comptes disponibles
     */
    public function getAvailableAccounts()
    {
        try {
            $accounts = Account::select('id', 'name', 'type', 'balance', 'currency')
                ->orderBy('name')
                ->get();
            
            return response()->json(['data' => $accounts], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }
}