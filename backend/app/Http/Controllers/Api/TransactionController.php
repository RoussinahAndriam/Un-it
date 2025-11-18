<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreTransactionRequest; // <-- Utilisation de Form Request
use App\Http\Requests\UpdateTransactionRequest; // <-- Utilisation de Form Request

class TransactionController extends Controller
{
    /**
     * Affiche la liste des transactions. (Fct 2.2)
     */
    public function index(Request $request)
    {
        try {
            $transactions = Transaction::with(['account', 'category'])
                ->orderBy('transaction_date', 'desc')
                ->get();

            return response()->json([
                'data' => $transactions,
                'message' => 'Liste complète des transactions récupérée avec succès.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des transactions.',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Crée une nouvelle transaction. (Fct 2.2)
     */
    public function store(StoreTransactionRequest $request) // <-- Utilisation de Form Request
    {
        $validated = $request->validated();

        try {
            $transaction = null;
            
            DB::transaction(function () use ($validated, &$transaction) {
                $account = Account::findOrFail($validated['account_id']);
                $amount = $validated['amount'];

                if ($validated['type'] == 'depense') $account->balance -= $amount;
                else $account->balance += $amount;
                $account->save();

                $transaction = Transaction::create($validated);
            });

            return response()->json(['data' => $transaction, 'message' => 'Transaction enregistrée.'], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Le compte spécifié n\'existe pas.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création de la transaction.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Affiche une transaction.
     */
    public function show(Transaction $transaction)
    {
        try {
            return response()->json(['data' => $transaction->load(['account', 'category'])], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Transaction non trouvée.'], 404);
        }
    }

    /**
     * Met à jour une transaction.
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction) // <-- Utilisation de Form Request
    {
        $validated = $request->validated();

        try {
            DB::transaction(function () use ($validated, $transaction, $request) {
                
                $oldAccount = Account::findOrFail($transaction->account_id);
                if ($transaction->type == 'depense') $oldAccount->balance += $transaction->amount;
                else $oldAccount->balance -= $transaction->amount;
                $oldAccount->save();

                $newAmount = $validated['amount'] ?? $transaction->amount;
                $newType = $validated['type'] ?? $transaction->type;
                $newAccountId = $validated['account_id'] ?? $transaction->account_id;

                $newAccount = Account::findOrFail($newAccountId);
                if ($newType == 'depense') $newAccount->balance -= $newAmount;
                else $newAccount->balance += $newAmount;
                $newAccount->save();

                $transaction->update($validated);
            });

            return response()->json(['data' => $transaction->fresh(), 'message' => 'Transaction mise à jour.'], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Compte ou transaction non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprime une transaction.
     */
    public function destroy(Transaction $transaction)
    {
        try {
            DB::transaction(function () use ($transaction) {
                $account = Account::findOrFail($transaction->account_id);
                if ($transaction->type == 'depense') $account->balance += $transaction->amount;
                else $account->balance -= $transaction->amount;
                $account->save();
                
                $transaction->delete();
            });

            return response()->json(null, 204);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Compte ou transaction non trouvé.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()], 500);
        }
    }
}