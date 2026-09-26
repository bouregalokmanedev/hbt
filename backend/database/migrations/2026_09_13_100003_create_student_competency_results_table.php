<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_competency_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('result_id')->constrained('student_assessment_results')->cascadeOnDelete();
            $table->uuid('competency_id')->nullable();
            $table->string('competency_name')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->string('proficiency_level')->nullable();
            $table->string('confidence')->nullable();
            $table->unsignedInteger('evidence_count')->default(0);
            $table->string('strength_level')->nullable(); // strong, developing, weak
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_competency_results');
    }
};
