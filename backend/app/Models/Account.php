<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'balance',
        'currency',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * Get the transactions for the account.
     * (Fonctionnalité 2.2)
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the recurring operations for the account.
     * (Fonctionnalité 2.3)
     */
    public function recurringOperations()
    {
        return $this->hasMany(RecurringOperation::class);
    }

     public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
}