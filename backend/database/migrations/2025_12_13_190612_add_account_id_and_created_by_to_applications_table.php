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
        Schema::table('applications', function (Blueprint $table) {
             $table->foreignId('account_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('accounts')
                  ->nullOnDelete();
            
            // Ajouter created_by
            $table->string('created_by')
                  ->default('company')
                  ->after('license_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['account_id']);
            
            // Supprimer les colonnes
            $table->dropColumn(['account_id', 'created_by']);
        });
    }
};
