<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class Application extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
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
        'account_id',
        'created_by',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'current_users' => 'integer',
        'max_users' => 'integer',
        'purchase_date' => 'date',
        'renewal_date' => 'date',
    ];

    protected $attributes = [
        'created_by' => 'company',
    ];

    /**
     * Get the user who manages this application.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the account linked to this application.
     */
    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    /**
     * Check if application has a license.
     */
    public function hasLicense(): bool
    {
        return !empty($this->license_type);
    }

    /**
     * Check if application is created by company.
     */
    public function isCompanyCreated(): bool
    {
        return $this->created_by === 'company' || !$this->hasLicense();
    }

    /**
     * Scope for applications created by company.
     */
    public function scopeCompanyCreated($query)
    {
        return $query->where('created_by', 'company')
                    ->orWhereNull('license_type');
    }

    /**
     * Scope for applications with external license.
     */
    public function scopeWithLicense($query)
    {
        return $query->whereNotNull('license_type')
                    ->where('created_by', 'external');
    }

    /**
     * Bootstrap the model and its traits.
     */
    protected static function boot()
    {
        parent::boot();

        // Avant la sauvegarde, s'assurer que created_by est cohérent avec license_type
        static::saving(function ($application) {
            if (empty($application->license_type)) {
                $application->created_by = 'company';
            } else {
                $application->created_by = 'external';
            }
        });

        // Après la création, logger l'événement
        static::created(function ($application) {
            Log::info('Nouvelle application créée', [
                'id' => $application->id,
                'name' => $application->name,
                'account_id' => $application->account_id,
                'created_by' => $application->created_by
            ]);
        });
    }
}