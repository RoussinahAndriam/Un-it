<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
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
            'description' => 'nullable|string',
            'serial_number' => 'nullable|string|max:100|unique:assets,serial_number',
            'acquisition_date' => 'nullable|date_format:Y-m-d',
            'acquisition_value' => 'nullable|numeric|min:0',
            'status' => ['required', Rule::in(['neuf', 'en_service', 'en_maintenance', 'hors_service'])],
            'location' => 'required|string|max:100',
            'account_id' => 'nullable|exists:accounts,id',
        ];
    }
     public function prepareForValidation()
    {
        // Convertir account_id en null si vide
        if ($this->has('account_id') && $this->account_id === '') {
            $this->merge([
                'account_id' => null
            ]);
        }

        // Convertir acquisition_value en float
        if ($this->has('acquisition_value')) {
            $this->merge([
                'acquisition_value' => floatval($this->acquisition_value)
            ]);
        }
    }
}

