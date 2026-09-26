<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_assessment_evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('result_id')->nullable()->constrained('student_assessment_results')->nullOnDelete();
            $table->foreignUuid('question_id')->nullable()->constrained('quiz_questions')->nullOnDelete();
            $table->uuid('competency_id')->nullable();
            $table->string('evidence_type')->default('question_response');
            $table->json('response')->nullable();
            $table->text('expected_behavior')->nullable();
            $table->text('observed_behavior')->nullable();
            $table->unsignedInteger('points')->default(0);
            $table->decimal('quality_score', 5, 2)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessment_evidence');
    }
};
