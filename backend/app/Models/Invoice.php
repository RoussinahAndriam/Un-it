<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'third_party_id',
        'invoice_number',
        'issue_date',
        'due_date',
        'subtotal',
        'tax_amount',
        'total_amount',
        'amount_paid',
        'status',
        'payment_terms',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    /**
     * Get the third party (client or supplier) for the invoice.
     */
    public function thirdParty()
    {
        return $this->belongsTo(ThirdParty::class);
    }

    /**
     * Get the lines for the invoice.
     */
    public function lines()
    {
        return $this->hasMany(InvoiceLine::class);
    }

    /**
     * Get the payments for the invoice.
     */
    public function payments()
    {
        return $this->hasMany(InvoicePayment::class);
    }

    /**
     * Get the attached documents for the invoice.
     */
    public function documents()
    {
        return $this->hasMany(AttachedDocument::class);
    }
}