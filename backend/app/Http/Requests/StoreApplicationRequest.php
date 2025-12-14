<?php

namespace App\Http\Requests;

use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

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
     */
    public function rules(): array
    {
        $rules = [
            'name' => 'required|string|max:100',
            'cost' => 'nullable|numeric|min:0',
            'user_id' => 'nullable|exists:users,id',
            'current_users' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:1',
            'purchase_date' => 'nullable|date_format:Y-m-d',
            'renewal_date' => 'nullable|date_format:Y-m-d|after_or_equal:purchase_date',
            'status' => 'nullable|string|max:100',
            'account_id' => 'required|exists:accounts,id',
            'has_license' => 'nullable|boolean', // Champ pour checkbox
        ];

        // Règles conditionnelles pour license_type
        if ($this->has('has_license') && $this->input('has_license')) {
            $rules['license_type'] = 'required|string|max:100';
        } else {
            $rules['license_type'] = 'nullable|string|max:100';
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Si pas de license_type, définir created_by à 'company'
        if (!$this->has('license_type') || empty($this->license_type)) {
            $this->merge([
                'created_by' => 'company',
                'license_type' => null,
            ]);
        } else {
            $this->merge([
                'created_by' => 'external',
            ]);
        }

        // Lier automatiquement au compte si non spécifié
        if (!$this->has('account_id')) {
            // Récupérer le compte de l'utilisateur connecté
            $user = Auth::user();
            $defaultAccount = $user->account_id ?? 
                            Account::first()?->id ?? 
                            null;
            
            if ($defaultAccount) {
                $this->merge([
                    'account_id' => $defaultAccount
                ]);
            }
        }
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'account_id.required' => 'Veuillez sélectionner un compte.',
            'account_id.exists' => 'Le compte sélectionné n\'existe pas.',
            'license_type.required' => 'Le type de licence est requis lorsque vous indiquez que l\'application a une licence.',
        ];
    }
}