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
       Schema::create('assessment_results', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->foreignUuid('assessment_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->foreignUuid('assessment_attempt_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->foreignId('user_id')
    ->constrained('users')
    ->cascadeOnDelete();

    $table->decimal('score', 5, 2);

    $table->boolean('passed');

    $table->unsignedInteger('attempt_number');

    $table->timestamp('completed_at');

    $table->json('evidence')->nullable();

    $table->json('results')->nullable();

    $table->timestamps();

    $table->unique('assessment_attempt_id');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_results');
    }
};
