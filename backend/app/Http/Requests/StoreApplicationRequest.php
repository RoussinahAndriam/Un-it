<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
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
            'name' => 'required|string|max:100',
            'cost' => 'nullable|numeric|min:0',
            'user_id' => 'nullable|exists:users,id',
            'license_type' => 'nullable|string|max:100',
            'current_users' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:1',
            'purchase_date' => 'nullable|date_format:Y-m-d',
            'renewal_date' => 'nullable|date_format:Y-m-d',
            'status' => 'nullable|string|max:100',
        ];
    }
}
