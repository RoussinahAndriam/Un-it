<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttachedDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'file_path',
        'file_name',
        'file_type',
    ];

    /**
     * Get the invoice for the document.
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}