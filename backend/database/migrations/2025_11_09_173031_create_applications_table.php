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
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // 'nom_application' dans votre exemple
            $table->decimal('cost', 10, 2)->nullable(); // 'cout'
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // 'id_user' (responsable)
            $table->string('license_type')->nullable(); // 'type_licence'
            $table->integer('current_users')->default(0); // 'utilisateur_actuel'
            $table->integer('max_users')->nullable(); // 'utilisateur_max'
            $table->date('purchase_date')->nullable(); // 'date_achat'
            $table->date('renewal_date')->nullable(); // 'date_renouvellement' / 'date d'expiration'
            $table->string('status')->nullable(); // 'statut'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
