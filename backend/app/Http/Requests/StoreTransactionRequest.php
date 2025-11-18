<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Règles de validation pour la création d'une transaction.
     */
    public function rules(): array
    {
        return [
            'account_id' => 'required|exists:accounts,id',
            'transaction_category_id' => 'nullable|exists:transaction_categories,id',
            'type' => ['required', Rule::in(['revenu', 'depense'])],
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'transaction_date' => 'required|date',
        ];
    }
}
