<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecurringOperationRequest extends FormRequest
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
            'description' => 'sometimes|required|string|max:255',
            'type' => ['sometimes', 'required', Rule::in(['revenu', 'depense'])],
            'amount' => 'sometimes|required|numeric|min:0.01',
            'frequency' => ['sometimes', 'required', Rule::in(['mensuel', 'trimestriel', 'annuel'])],
            'due_day' => 'sometimes|required|integer|min:1|max:31',
            'account_id' => 'sometimes|nullable|exists:accounts,id',
            'transaction_category_id' => 'sometimes|nullable|exists:transaction_categories,id',
            'next_due_date' => 'sometimes|nullable|date_format:Y-m-d',
        ];
    }
}
