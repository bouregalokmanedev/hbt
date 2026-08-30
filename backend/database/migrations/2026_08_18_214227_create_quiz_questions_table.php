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
    Schema::create('quiz_questions', function (Blueprint $table) {
        $table->uuid('id')->primary();

        $table->uuid('quiz_id');

        $table->text('question');

        $table->string('type');

        $table->unsignedInteger('position');

        $table->unsignedInteger('points')->default(1);

        $table->boolean('required')->default(true);

        $table->timestamps();

        $table->foreign('quiz_id')
            ->references('id')
            ->on('quizzes')
            ->cascadeOnDelete();

        $table->unique([
            'quiz_id',
            'position',
        ]);

        $table->index('quiz_id');
    });
}

    /**
     * Reverse the migrations.
     */
   public function down(): void
{
    Schema::dropIfExists('quiz_questions');
}
};
