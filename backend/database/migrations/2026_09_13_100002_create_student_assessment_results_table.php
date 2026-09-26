<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_assessment_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('assessment_id')->constrained('assessments')->cascadeOnDelete();
            $table->decimal('score', 5, 2);
            $table->decimal('percentage', 5, 2);
            $table->boolean('passed');
            $table->string('proficiency_level')->nullable();
            $table->decimal('knowledge_score', 5, 2)->nullable();
            $table->decimal('application_score', 5, 2)->nullable();
            $table->decimal('decision_score', 5, 2)->nullable();
            $table->decimal('problem_solving_score', 5, 2)->nullable();
            $table->decimal('confidence_score', 5, 2)->nullable();
            $table->decimal('time_efficiency_score', 5, 2)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('result_status')->default('completed');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            $table->unique('attempt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessment_results');
    }
};
