<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'serial_number',
        'acquisition_date',
        'acquisition_value',
        'status',
        'location',
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'acquisition_value' => 'decimal:2',
    ];

    /**
     * Get the loans for the asset.
     * (Fonctionnalité 2.5)
     */
    public function loans()
    {
        return $this->hasMany(AssetLoan::class);
    }
}