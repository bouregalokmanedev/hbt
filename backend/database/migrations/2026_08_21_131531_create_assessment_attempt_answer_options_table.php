<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_attempt_answer_options', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('answer_id')
                ->constrained('assessment_attempt_answers')
                ->cascadeOnDelete();

            $table->foreignUuid('option_id')
                ->constrained('quiz_question_options')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique([
                'answer_id',
                'option_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_attempt_answer_options');
    }
};