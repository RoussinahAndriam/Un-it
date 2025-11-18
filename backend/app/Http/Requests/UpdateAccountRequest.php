<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
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
            'name' => 'sometimes|required|string|max:100',
            'type' => ['sometimes', 'required', Rule::in(['bancaire', 'mobile_money', 'especes', 'autre'])],
            'currency' => 'sometimes|nullable|string|max:10',
            'balance' => 'sometimes|numeric|min:0',
            
        ];
    }
}
