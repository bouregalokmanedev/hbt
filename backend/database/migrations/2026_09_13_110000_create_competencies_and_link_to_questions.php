<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('competencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->timestamps();
        });

        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->foreignUuid('competency_id')->nullable()->after('quiz_question_id')
                ->constrained('competencies')->nullOnDelete();
        });

        Schema::create('assessment_competencies', function (Blueprint $table) {
            $table->uuid('assessment_id');
            $table->uuid('competency_id');
            $table->unsignedInteger('position')->default(0);
            $table->decimal('weight', 3, 2)->default(1.0);
            $table->timestamps();
            $table->primary(['assessment_id', 'competency_id']);
            $table->foreign('assessment_id')->references('id')->on('assessments')->cascadeOnDelete();
            $table->foreign('competency_id')->references('id')->on('competencies')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('competency_id');
        });
        Schema::dropIfExists('assessment_competencies');
        Schema::dropIfExists('competencies');
    }
};