<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
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
            'cost' => 'sometimes|nullable|numeric|min:0',
            'user_id' => 'sometimes|nullable|exists:users,id',
            'license_type' => 'sometimes|nullable|string|max:100',
            'current_users' => 'sometimes|nullable|integer|min:0',
            'max_users' => 'sometimes|nullable|integer|min:1',
            'purchase_date' => 'sometimes|nullable|date_format:Y-m-d',
            'renewal_date' => 'sometimes|nullable|date_format:Y-m-d',
            'status' => 'sometimes|nullable|string|max:100',
        ];
    }
}
