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
        Schema::create('recurring_operations', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->enum('type', ['revenu', 'depense']);
            $table->decimal('amount', 15, 2);
            $table->enum('frequency', ['mensuel', 'trimestriel', 'annuel']);
            $table->integer('due_day'); // Jour du mois (ex: 5)
            $table->foreignId('account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('transaction_category_id')->nullable()->constrained('transaction_categories')->nullOnDelete();
            $table->date('next_due_date')->nullable(); // Géré par le système pour les alertes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurring_operations');
    }
};
