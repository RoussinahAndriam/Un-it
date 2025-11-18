<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
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
        $invoiceId = $this->route('invoice')?->id;
        return [
            'type' => ['required', Rule::in(['client', 'depense'])],
            'third_party_id' => 'required|exists:third_parties,id',
            'invoice_number' => ['nullable','string', Rule::unique('invoices')->ignore($invoiceId)],
            'issue_date' => 'required|date_format:Y-m-d',
            'due_date' => 'required|date_format:Y-m-d|after_or_equal:issue_date',
            'status' => ['required', Rule::in(['brouillon', 'envoye', 'partiellement_paye', 'paye', 'en_retard', 'annule'])],
            'payment_terms' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.designation' => 'required|string|max:255',
            'lines.*.quantity' => 'required|numeric|min:0.01',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'lines.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'lines.*.discount' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
