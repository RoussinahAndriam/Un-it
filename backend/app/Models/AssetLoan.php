<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetLoan extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'user_id',
        'loan_date',
        'due_date',
        'return_date',
        'status',
        'signature',
    ];

    protected $casts = [
        'loan_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
    ];

    /**
     * Get the asset being loaned.
     */
    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the user (employé) borrowing the asset.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}