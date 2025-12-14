<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

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
     */
    public function rules(): array
    {
        $rules = [
            'name' => 'sometimes|required|string|max:100',
            'cost' => 'sometimes|nullable|numeric|min:0',
            'user_id' => 'sometimes|nullable|exists:users,id',
            'current_users' => 'sometimes|nullable|integer|min:0',
            'max_users' => 'sometimes|nullable|integer|min:1',
            'purchase_date' => 'sometimes|nullable|date_format:Y-m-d',
            'renewal_date' => 'sometimes|nullable|date_format:Y-m-d|after_or_equal:purchase_date',
            'status' => 'sometimes|nullable|string|max:100',
            'account_id' => 'sometimes|required|exists:accounts,id',
            'has_license' => 'sometimes|nullable|boolean',
        ];

        // Règles conditionnelles pour license_type
        if ($this->has('has_license') && $this->input('has_license')) {
            $rules['license_type'] = 'sometimes|required|string|max:100';
        } else {
            $rules['license_type'] = 'sometimes|nullable|string|max:100';
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Gérer la logique de licence lors de la mise à jour
        if ($this->has('license_type') || $this->has('has_license')) {
            $hasLicense = $this->has('has_license') ? $this->input('has_license') : 
                         (!empty($this->input('license_type')));
            
            if (!$hasLicense || empty($this->license_type)) {
                $this->merge([
                    'created_by' => 'company',
                    'license_type' => null,
                ]);
            } else {
                $this->merge([
                    'created_by' => 'external',
                ]);
            }
        }
    }
}