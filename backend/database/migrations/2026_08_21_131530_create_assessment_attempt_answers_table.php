<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_attempt_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('assessment_attempt_id')
                ->constrained('assessment_attempts')
                ->cascadeOnDelete();

            $table->foreignUuid('question_id')
                ->constrained('quiz_questions')
                ->cascadeOnDelete();

            $table->boolean('is_correct')->default(false);

            $table->unsignedInteger('points_earned')->default(0);

            $table->timestamps();

            $table->unique([
                'assessment_attempt_id',
                'question_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_attempt_answers');
    }
};