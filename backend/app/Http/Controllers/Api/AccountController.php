<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;

class AccountController extends Controller
{
    /**
     * Affiche la liste des comptes. (Fct 2.1)
     */
    public function index()
    {
        try {
            $accounts = Account::all();
            return response()->json(['data' => $accounts], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Crée un nouveau compte. (Fct 2.1)
     */
    public function store(StoreAccountRequest $request) // <-- Utilisation de Form Request
    {
        try {
            $account = Account::create($request->validated());
            return response()->json(['data' => $account, 'message' => 'Compte créé avec succès.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création du compte.'], 500);
        }
    }
    /**
     * Affiche un compte spécifique. (Fct 2.1)
     */
    public function show(Account $account)
    {
        try {
            $account->load(['transactions' => function ($query) {
                $query->latest()->limit(50);
            }]);
            return response()->json(['data' => $account], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Compte non trouvé.'], 404);
        }
    }

    /**
     * Met à jour un compte. (Fct 2.1)
     */
    public function update(UpdateAccountRequest $request, Account $account) // <-- Utilisation de Form Request
    {
        try {
            $account->update($request->validated());
            return response()->json(['data' => $account, 'message' => 'Compte mis à jour.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Compte non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Supprime un compte. (Fct 2.1)
     */
    public function destroy(Account $account)
    {
        try {
            // if ($account->balance != 0) {
            //     return response()->json(['message' => 'Impossible de supprimer un compte avec un solde non nul.'], 400);
            // }
            
            $account->delete();
            return response()->json(null, 204); 
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Compte non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression.'], 500);
        }
    }
}