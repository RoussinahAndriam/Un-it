<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringOperationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'description' => 'required|string|max:255',
            'type' => ['required', Rule::in(['revenu', 'depense'])],
            'amount' => 'required|numeric|min:0.01',
            'frequency' => ['required', Rule::in(['mensuel', 'trimestriel', 'annuel'])],
            'due_day' => 'required|integer|min:1|max:31',
            'account_id' => 'nullable|exists:accounts,id',
            'transaction_category_id' => 'nullable|exists:transaction_categories,id',
            'next_due_date' => 'nullable|date_format:Y-m-d',
        ];
    }
}
