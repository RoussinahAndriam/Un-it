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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['client', 'depense']); // Facture client ou fournisseur
            $table->foreignId('third_party_id')->constrained('third_parties')->cascadeOnDelete();
            $table->string('invoice_number')->unique()->nullable(); // Numérotation séquentielle
            $table->date('issue_date'); // Date d'émission
            $table->date('due_date'); // Date d'échéance
            $table->decimal('subtotal', 15, 2)->default(0.00); // Montant HT
            $table->decimal('tax_amount', 15, 2)->default(0.00); // Montant TVA
            $table->decimal('total_amount', 15, 2)->default(0.00); // Montant Total
            $table->decimal('amount_paid', 15, 2)->default(0.00); // Montant payé
            $table->enum('status', ['brouillon', 'envoye', 'partiellement_paye', 'paye', 'en_retard', 'annule']);
            $table->text('payment_terms')->nullable(); // Conditions de paiement
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
