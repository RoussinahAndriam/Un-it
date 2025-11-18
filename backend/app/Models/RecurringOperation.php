<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecurringOperation extends Model
{
    use HasFactory;

    protected $fillable = [
        'description',
        'type',
        'amount',
        'frequency',
        'due_day',
        'account_id',
        'transaction_category_id',
        'next_due_date',
        'is_active',
        'last_executed_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_day' => 'integer',
        'is_active' => 'boolean',
        'next_due_date' => 'date',
        'last_executed_at' => 'datetime'
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function category()
    {
        return $this->belongsTo(TransactionCategory::class, 'transaction_category_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'recurring_operation_id');
    }

    // Scope pour les opérations actives
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope pour les opérations dues
    public function scopeDue($query)
    {
        return $query->where('next_due_date', '<=', now()->toDateString())
                    ->active();
    }
}