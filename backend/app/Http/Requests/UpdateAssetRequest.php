<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetRequest extends FormRequest
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
        $assetId = $this->route('asset')->id;
        return [
            'name' => 'sometimes|required|string|max:100',
            'description' => 'sometimes|nullable|string',
            'serial_number' => ['sometimes','nullable','string','max:100', Rule::unique('assets')->ignore($assetId)],
            'acquisition_date' => 'sometimes|nullable|date_format:Y-m-d',
            'acquisition_value' => 'sometimes|nullable|numeric|min:0',
            'status' => ['sometimes', 'required', Rule::in(['neuf', 'en_service', 'en_maintenance', 'hors_service'])],
            'location' => 'sometimes|required|string|max:100',
        ];
    }
}
