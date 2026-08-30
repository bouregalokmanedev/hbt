<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('quiz_id')
                ->constrained('quizzes')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
    ->constrained('users')
    ->cascadeOnDelete();

            $table->unsignedInteger('attempt_number');

            $table->string('status')->default('in_progress');

            $table->unsignedInteger('score')->default(0);

            $table->unsignedInteger('total_points')->default(0);

            $table->unsignedInteger('percentage')->default(0);

            $table->boolean('passed')->default(false);

            $table->timestamp('started_at')->nullable();

            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            $table->unique([
                'quiz_id',
                'user_id',
                'attempt_number',
            ]);

            $table->index([
                'quiz_id',
                'user_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};