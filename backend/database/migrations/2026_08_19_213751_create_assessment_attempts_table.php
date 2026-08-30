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
        Schema::create('assessment_attempts', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->foreignUuid('assessment_id')
        ->constrained()
        ->cascadeOnDelete();

   $table->foreignId('user_id')
    ->constrained('users')
    ->cascadeOnDelete();

    $table->unsignedInteger('attempt_number');

    $table->string('status')
        ->default('in_progress');

    $table->decimal('score', 5, 2)->nullable();

    $table->boolean('passed')->nullable();

    $table->timestamp('started_at')->nullable();
    $table->timestamp('submitted_at')->nullable();
    $table->timestamp('completed_at')->nullable();

    $table->timestamps();

    $table->unique([
        'assessment_id',
        'user_id',
        'attempt_number',
    ]);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_attempts');
    }
};
