<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
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
            'account_id' => 'sometimes|required|exists:accounts,id',
            'transaction_category_id' => 'sometimes|nullable|exists:transaction_categories,id',
            'type' => ['sometimes', 'required', Rule::in(['revenu', 'depense'])],
            'amount' => 'sometimes|required|numeric|min:0.01',
            'description' => 'sometimes|nullable|string|max:1000',
            'transaction_date' => 'sometimes|required|date_format:Y-m-d',
        ];
    }
}
