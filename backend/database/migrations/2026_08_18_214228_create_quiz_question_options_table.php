<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('quiz_question_options', function (Blueprint $table) {
        $table->uuid('id')->primary();

        $table->uuid('quiz_question_id');

        $table->text('option');

        $table->unsignedInteger('position');

        $table->boolean('is_correct')->default(false);

        $table->timestamps();

        $table->foreign('quiz_question_id')
            ->references('id')
            ->on('quiz_questions')
            ->cascadeOnDelete();

        $table->unique([
            'quiz_question_id',
            'position',
        ]);

        $table->index('quiz_question_id');
    });
}

    /**
     * Reverse the migrations.
     */
   public function down(): void
{
    Schema::dropIfExists('quiz_question_options');
}
};
