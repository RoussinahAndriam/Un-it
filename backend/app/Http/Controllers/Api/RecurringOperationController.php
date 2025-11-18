<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringOperation;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreRecurringOperationRequest;
use App\Http\Requests\UpdateRecurringOperationRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RecurringOperationController extends Controller
{
    /**
     * Affiche la liste des opérations récurrentes. (Fct 2.3)
     */
    public function index()
    {
        try {
            $operations = RecurringOperation::with(['account', 'category'])->get();
            return response()->json(['data' => $operations], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Crée une opération récurrente. (Fct 2.3)
     */
    public function store(StoreRecurringOperationRequest $request)
    {
        try {
            $operation = RecurringOperation::create($request->validated());
            return response()->json(['data' => $operation, 'message' => 'Opération récurrente créée.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création.'], 500);
        }
    }

    /**
     * Affiche une opération récurrente.
     */
    public function show(RecurringOperation $recurringOperation)
    {
        try {
            return response()->json(['data' => $recurringOperation->load(['account', 'category'])], 200);
        } catch (ModelNotFoundException $e) {
             return response()->json(['message' => 'Opération non trouvée.'], 404);
        }
    }

    /**
     * Met à jour une opération récurrente.
     */
    public function update(UpdateRecurringOperationRequest $request, RecurringOperation $recurringOperation)
    {
        try {
            $recurringOperation->update($request->validated());
            return response()->json(['data' => $recurringOperation, 'message' => 'Opération mise à jour.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Opération non trouvée.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Supprime une opération récurrente.
     */
    public function destroy(RecurringOperation $recurringOperation)
    {
        try {
            $recurringOperation->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Opération non trouvée.'], 404);
        }
    }

    /**
     * Exécute une opération récurrente et crée la transaction correspondante.
     */
    public function execute($id)
    {
        DB::beginTransaction();
        
        try {
            // Récupérer l'opération récurrente
            $operation = RecurringOperation::with(['account', 'category'])->findOrFail($id);

            // Vérifier si l'opération est active
            if (!$operation->is_active) {
                return response()->json([
                    'message' => 'Cette opération récurrente n\'est pas active.'
                ], 400);
            }

            // Vérifier si un compte est associé
            if (!$operation->account_id) {
                return response()->json([
                    'message' => 'Aucun compte associé à cette opération récurrente.'
                ], 400);
            }

            // Vérifier que le compte existe
            $account = Account::find($operation->account_id);
            if (!$account) {
                return response()->json([
                    'message' => 'Le compte associé à cette opération n\'existe pas.'
                ], 400);
            }

            // Date de la transaction (aujourd'hui)
            $transactionDate = Carbon::now()->toDateString();

            // Créer la transaction
            $transaction = Transaction::create([
                'account_id' => $operation->account_id,
                'transaction_category_id' => $operation->transaction_category_id,
                'type' => $operation->type,
                'amount' => $operation->amount,
                'description' => $operation->description . ' (Opération récurrente)',
                'transaction_date' => $transactionDate,
            ]);

            // Mettre à jour le solde du compte
            if ($operation->type === 'revenu') {
                $account->balance += $operation->amount;
            } else {
                $account->balance -= $operation->amount;
            }
            $account->save();

            // Calculer la prochaine date d'échéance
            $nextDueDate = $this->calculateNextDueDate($operation, $transactionDate);

            // Mettre à jour la date de prochaine échéance
            $operation->update([
                'next_due_date' => $nextDueDate,
                'last_executed_at' => Carbon::now(),
            ]);

            DB::commit();

            return response()->json([
                'data' => [
                    'transaction' => $transaction->load(['account', 'category']),
                    'updated_operation' => $operation,
                    'updated_account' => $account
                ],
                'message' => 'Opération exécutée avec succès. Transaction créée et compte mis à jour.'
            ], 200);

        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json(['message' => 'Opération récurrente non trouvée.'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'exécution de l\'opération récurrente: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de l\'exécution de l\'opération récurrente.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Calcule la prochaine date d'échéance en fonction de la fréquence.
     */
    private function calculateNextDueDate(RecurringOperation $operation, string $currentDate): string
    {
        $date = Carbon::parse($currentDate);

        switch ($operation->frequency) {
            case 'mensuel':
                return $date->addMonth()->day($operation->due_day)->toDateString();
            
            case 'trimestriel':
                return $date->addMonths(3)->day($operation->due_day)->toDateString();
            
            case 'annuel':
                return $date->addYear()->day($operation->due_day)->toDateString();
            
            default:
                return $date->addMonth()->day($operation->due_day)->toDateString();
        }
    }

    /**
     * Exécute automatiquement les opérations récurrentes dues (pour les tâches cron).
     */
    public function executeDueOperations()
    {
        DB::beginTransaction();
        
        try {
            $today = Carbon::now()->toDateString();
            $dueOperations = RecurringOperation::where('next_due_date', '<=', $today)
                ->where('is_active', true)
                ->whereNotNull('account_id')
                ->with(['account', 'category'])
                ->get();

            $executedCount = 0;
            $errors = [];

            foreach ($dueOperations as $operation) {
                try {
                    // Vérifier que le compte existe et est actif
                    $account = Account::find($operation->account_id);
                    if (!$account) {
                        $errors[] = "Compte non trouvé pour l'opération: {$operation->description}";
                        continue;
                    }

                    // Créer la transaction
                    $transaction = Transaction::create([
                        'account_id' => $operation->account_id,
                        'transaction_category_id' => $operation->transaction_category_id,
                        'type' => $operation->type,
                        'amount' => $operation->amount,
                        'description' => $operation->description . ' (Opération récurrente automatique)',
                        'transaction_date' => $today,
                    ]);

                    // Mettre à jour le solde du compte
                    if ($operation->type === 'revenu') {
                        $account->balance += $operation->amount;
                    } else {
                        $account->balance -= $operation->amount;
                    }
                    $account->save();

                    // Calculer la prochaine date d'échéance
                    $nextDueDate = $this->calculateNextDueDate($operation, $today);

                    // Mettre à jour l'opération
                    $operation->update([
                        'next_due_date' => $nextDueDate,
                        'last_executed_at' => Carbon::now(),
                    ]);

                    $executedCount++;

                } catch (\Exception $e) {
                    $errors[] = "Erreur avec l'opération {$operation->description}: " . $e->getMessage();
                    continue;
                }
            }

            DB::commit();

            return response()->json([
                'message' => "Exécution automatique terminée.",
                'executed_count' => $executedCount,
                'total_due' => $dueOperations->count(),
                'errors' => $errors
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'exécution automatique des opérations: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de l\'exécution automatique.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}