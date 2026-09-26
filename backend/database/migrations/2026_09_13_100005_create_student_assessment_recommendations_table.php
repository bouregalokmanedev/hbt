<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_assessment_recommendations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('attempt_id')->nullable()->constrained('assessment_attempts')->nullOnDelete();
            $table->foreignUuid('assessment_result_id')->nullable()->constrained('student_assessment_results')->nullOnDelete();
            $table->uuid('competency_id')->nullable();
            $table->string('competency_name')->nullable();
            $table->foreignUuid('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->foreignUuid('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->foreignUuid('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->string('recommendation_type')->default('lesson_review');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority')->default('medium'); // low, medium, high
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // pending, in_progress, completed, dismissed
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessment_recommendations');
    }
};
