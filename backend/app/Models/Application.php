<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * (Basé sur votre exemple)
     */
    protected $fillable = [
        'name',
        'cost',
        'user_id',
        'license_type',
        'current_users',
        'max_users',
        'purchase_date',
        'renewal_date',
        'status',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'current_users' => 'integer',
        'max_users' => 'integer',
        'purchase_date' => 'date',
        'renewal_date' => 'date',
    ];

    /**
     * Get the user who manages this application.
     * (Relation 'id_user')
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}