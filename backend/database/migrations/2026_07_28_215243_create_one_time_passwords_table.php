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
        Schema::create('one_time_passwords', function (Blueprint $table) {

    $table->uuid('id')->primary();

    $table->foreignId('user_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->string('purpose');

    $table->string('code');

    $table->timestamp('expires_at');

    $table->timestamp('verified_at')->nullable();

    $table->unsignedTinyInteger('attempts')->default(0);

    $table->json('metadata')->nullable();

    $table->timestamps();

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('one_time_passwords');
    }
};
