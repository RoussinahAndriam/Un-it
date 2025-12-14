<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;

class ApplicationController extends Controller
{
    /**
     * Affiche l'inventaire des applications. (Fct 2.6)
     */
    public function index(Request $request)
    {
        try {
            $query = Application::with(['owner', 'account']); // Ajout de 'account'

            // Filtre par date d'expiration
            if ($request->has('expires_soon')) {
                $query->where('renewal_date', '>', now())
                      ->where('renewal_date', '<=', now()->addDays(30));
            }

            // Filtre par type de création
            if ($request->has('created_by')) {
                $query->where('created_by', $request->created_by);
            }

            // Filtre par compte
            if ($request->has('account_id')) {
                $query->where('account_id', $request->account_id);
            }

            // Filtre par type de licence (avec ou sans)
            if ($request->has('has_license')) {
                if ($request->has_license) {
                    $query->whereNotNull('license_type');
                } else {
                    $query->whereNull('license_type');
                }
            }

            $applications = $query->get();
            return response()->json(['data' => $applications], 200);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des applications: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Enregistre une nouvelle application/licence. (Fct 2.6)
     */
    public function store(StoreApplicationRequest $request)
    {
        try {
            $data = $request->validated();
            
            // Récupérer l'utilisateur connecté
            $user = Auth::user();
            
            // S'assurer que user_id est défini (responsable)
            if (empty($data['user_id'])) {
                $data['user_id'] = $user->id;
            }
            
            // Vérifier et définir created_by automatiquement
            if (empty($data['license_type'])) {
                $data['created_by'] = 'company';
                $data['license_type'] = null;
            } else {
                $data['created_by'] = 'external';
            }
            
            // Liaison automatique au compte si non spécifié
            if (empty($data['account_id'])) {
                // Chercher le compte par défaut de l'utilisateur ou le premier compte
                $defaultAccount = $user->account_id ?? Account::first()?->id;
                
                if ($defaultAccount) {
                    $data['account_id'] = $defaultAccount;
                } else {
                    return response()->json([
                        'message' => 'Aucun compte disponible. Veuillez d\'abord créer un compte.'
                    ], 400);
                }
            }
            
            // Créer l'application
            $application = Application::create($data);
            
            // Mettre à jour le solde du compte si coût spécifié
            if ($application->cost && $application->cost > 0) {
                $this->updateAccountBalance($application->account_id, -$application->cost);
            }
            
            // Charger les relations pour la réponse
            $application->load(['owner', 'account']);
            
            return response()->json([
                'data' => $application, 
                'message' => 'Application créée et liée au compte avec succès.'
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la création d\'application: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la création.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Affiche une application spécifique.
     */
    public function show(Application $application)
    {
        try {
            return response()->json([
                'data' => $application->load(['owner', 'account'])
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Application non trouvée.'], 404);
        }
    }

    /**
     * Met à jour une application/licence.
     */
    public function update(UpdateApplicationRequest $request, Application $application)
    {
        try {
            $data = $request->validated();
            
            // Sauvegarder les anciennes valeurs pour ajustements
            $oldCost = $application->cost;
            $oldAccountId = $application->account_id;
            
            // Gérer la logique de licence si modifiée
            if (array_key_exists('license_type', $data)) {
                if (empty($data['license_type'])) {
                    $data['created_by'] = 'company';
                    $data['license_type'] = null;
                } else {
                    $data['created_by'] = 'external';
                }
            }
            
            // Mettre à jour l'application
            $application->update($data);
            
            // Ajuster les soldes des comptes si coût ou compte modifié
            if (array_key_exists('cost', $data) || array_key_exists('account_id', $data)) {
                // Rembourser l'ancien compte
                if ($oldAccountId && $oldCost && $oldCost > 0) {
                    $this->updateAccountBalance($oldAccountId, $oldCost);
                }
                
                // Déduire du nouveau compte
                if ($application->cost && $application->cost > 0 && $application->account_id) {
                    $this->updateAccountBalance($application->account_id, -$application->cost);
                }
            }
            
            // Recharger les relations
            $application->load(['owner', 'account']);
            
            return response()->json([
                'data' => $application,
                'message' => 'Application mise à jour avec succès.'
            ], 200);
            
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Application non trouvée.'], 404);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour d\'application: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Supprime une application de l'inventaire.
     */
    public function destroy(Application $application)
    {
        try {
            // Rembourser le compte si l'application a un coût
            if ($application->cost && $application->cost > 0 && $application->account_id) {
                $this->updateAccountBalance($application->account_id, $application->cost);
            }
            
            $application->delete();
            
            return response()->json([
                'message' => 'Application supprimée avec succès.'
            ], 204);
            
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Application non trouvée.'], 404);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la suppression d\'application: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression.'], 500);
        }
    }

    /**
     * Méthode pour lier une application existante à un compte
     */
    public function linkToAccount(Request $request, Application $application)
    {
        try {
            $request->validate([
                'account_id' => 'required|exists:accounts,id'
            ]);
            
            $oldAccountId = $application->account_id;
            $newAccountId = $request->account_id;
            
            // Rembourser l'ancien compte si coût existant
            if ($application->cost && $application->cost > 0 && $oldAccountId) {
                $this->updateAccountBalance($oldAccountId, $application->cost);
            }
            
            // Mettre à jour le compte
            $application->update(['account_id' => $newAccountId]);
            
            // Déduire du nouveau compte
            if ($application->cost && $application->cost > 0) {
                $this->updateAccountBalance($newAccountId, -$application->cost);
            }
            
            return response()->json([
                'data' => $application->load('account'),
                'message' => 'Application liée au compte avec succès.'
            ], 200);
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la liaison au compte: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la liaison.'], 500);
        }
    }

    /**
     * Méthode pour changer le type de création (company/external)
     */
    public function updateCreationType(Request $request, Application $application)
    {
        try {
            $request->validate([
                'created_by' => 'required|in:company,external'
            ]);
            
            // Si on passe à 'company', supprimer la licence
            if ($request->created_by === 'company') {
                $application->update([
                    'created_by' => 'company',
                    'license_type' => null
                ]);
            } else {
                // Si on passe à 'external', s'assurer qu'il y a une licence
                $request->validate([
                    'license_type' => 'required|string|max:100'
                ]);
                
                $application->update([
                    'created_by' => 'external',
                    'license_type' => $request->license_type
                ]);
            }
            
            return response()->json([
                'data' => $application,
                'message' => 'Type de création mis à jour avec succès.'
            ], 200);
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du type de création: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Méthode utilitaire pour mettre à jour le solde d'un compte
     */
    private function updateAccountBalance($accountId, $amount)
    {
        try {
            $account = Account::find($accountId);
            if ($account) {
                $account->balance += $amount;
                $account->save();
                
                // Log de la transaction
                \Log::info('Solde du compte mis à jour', [
                    'account_id' => $accountId,
                    'montant' => $amount,
                    'nouveau_solde' => $account->balance
                ]);
                
                return true;
            }
            return false;
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du solde: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Statistiques des applications
     */
    public function stats()
    {
        try {
            $stats = [
                'total' => Application::count(),
                'company_created' => Application::where('created_by', 'company')->count(),
                'external_licensed' => Application::where('created_by', 'external')->count(),
                'total_cost' => Application::sum('cost'),
                'by_account' => Application::with('account')
                    ->get()
                    ->groupBy('account.name')
                    ->map(function ($applications) {
                        return [
                            'count' => $applications->count(),
                            'total_cost' => $applications->sum('cost')
                        ];
                    })
            ];
            
            return response()->json(['data' => $stats], 200);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des stats: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }
}