<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThirdParty extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'details',
        'email',
    ];

    /**
     * Get the invoices for the third party.
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}