<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddPaymentRequest extends FormRequest
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
        // Récupère la facture depuis la route pour valider le montant max
        $invoice = $this->route('invoice');
        $maxPayment = $invoice->total_amount - $invoice->amount_paid;

        return [
            'account_id' => 'required|exists:accounts,id', // Le compte qui reçoit/émet le paiement
            'amount' => "required|numeric|min:0.01|max:{$maxPayment}", // Ne peut pas surpayer
            'payment_date' => 'required|date_format:Y-m-d',
            'payment_method' => 'nullable|string|max:100',
            'transaction_category_id' => 'nullable|exists:transaction_categories,id',
            'description' => 'nullable|string'
        ];
    }
}
