<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_assessment_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained('quiz_questions')->cascadeOnDelete();
            $table->string('response_type')->default('multiple_choice');
            $table->json('answer')->nullable();
            $table->json('answer_metadata')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->unsignedInteger('time_spent_seconds')->default(0);
            $table->string('confidence_level')->nullable(); // guessing, somewhat_confident, confident, very_confident
            $table->boolean('is_flagged')->default(false);
            $table->string('status')->default('answered'); // not_started, in_progress, answered, flagged, skipped
            $table->unsignedInteger('points_awarded')->default(0);
            $table->boolean('is_correct')->default(false);
            $table->string('evaluation_status')->default('pending');
            $table->text('feedback')->nullable();
            $table->timestamps();
            $table->unique(['attempt_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessment_responses');
    }
};
