<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attached_documents', function (Blueprint $table) {
            $table->id();
            // Lié aux factures (principalement dépenses)
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('file_path'); // Chemin vers le fichier (ex: S3 ou /storage)
            $table->string('file_name');
            $table->string('file_type')->nullable(); // pdf, png, jpg
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attached_documents');
    }
};
