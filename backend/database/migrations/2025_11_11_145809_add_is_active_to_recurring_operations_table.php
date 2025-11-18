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
        Schema::table('recurring_operations', function (Blueprint $table) {
                       $table->boolean('is_active')->default(true);
            $table->timestamp('last_executed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recurring_operations', function (Blueprint $table) {
             $table->dropColumn(['is_active', 'last_executed_at']);
        });
    }
};
