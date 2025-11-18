<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransactionCategory;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Http\Requests\StoreTransactionCategoryRequest; // <-- Utilisation de Form Request

class TransactionCategoryController extends Controller
{
    /**
     * Affiche la liste des catégories. (Fct 2.2)
     */
    public function index(Request $request)
    {
        try {
            $query = TransactionCategory::query();

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            $categories = $query->get();
            return response()->json(['data' => $categories], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Crée une nouvelle catégorie. (Fct 2.2)
     */
    public function store(StoreTransactionCategoryRequest $request) // <-- Utilisation de Form Request
    {
        try {
            $category = TransactionCategory::create($request->validated());
            return response()->json(['data' => $category, 'message' => 'Catégorie créée.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création.'], 500);
        }
    }

    /**
     * Affiche une catégorie spécifique. (apiResource → show)
     */
    public function show(TransactionCategory $transactionCategory)
    {
        try {
            return response()->json(['data' => $transactionCategory], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération de la catégorie.'], 500);
        }
    }


    /**
     * Met à jour une catégorie.
     */
    public function update(StoreTransactionCategoryRequest $request, TransactionCategory $transactionCategory) // <-- Utilisation de Form Request
    {
        try {
            $transactionCategory->update($request->validated());
            return response()->json(['data' => $transactionCategory, 'message' => 'Catégorie mise à jour.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    /**
     * Supprime une catégorie.
     */
    public function destroy(TransactionCategory $transactionCategory)
    {
        try {
            $transactionCategory->delete();
            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Catégorie non trouvée.'], 404);
        }
    }
}