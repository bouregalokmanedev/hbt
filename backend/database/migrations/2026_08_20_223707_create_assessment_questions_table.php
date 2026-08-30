<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_questions', function (Blueprint $table) {
            $table->id();

            $table->foreignUuid('assessment_id')
                ->constrained('assessments')
                ->cascadeOnDelete();

            $table->foreignUuid('quiz_question_id')
                ->constrained('quiz_questions')
                ->cascadeOnDelete();

            $table->unsignedInteger('position');

            $table->unsignedInteger('points')->default(1);

            $table->timestamps();

            $table->unique([
                'assessment_id',
                'quiz_question_id',
            ]);

            $table->unique([
                'assessment_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_questions');
    }
};