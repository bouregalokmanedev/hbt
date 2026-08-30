<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_quizzes', function (Blueprint $table) {
            $table->uuid('assessment_id');
            $table->uuid('quiz_id');

            $table->unsignedInteger('position');

            $table->boolean('is_required')
                ->default(true);

            $table->timestamps();

            $table->foreign('assessment_id')
                ->references('id')
                ->on('assessments')
                ->cascadeOnDelete();

            $table->foreign('quiz_id')
                ->references('id')
                ->on('quizzes')
                ->cascadeOnDelete();

            $table->primary([
                'assessment_id',
                'quiz_id',
            ]);

            $table->unique([
                'assessment_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_quizzes');
    }
};