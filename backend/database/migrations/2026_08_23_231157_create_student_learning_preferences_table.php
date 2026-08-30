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
    Schema::create('student_learning_preferences', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')
            ->unique()
            ->constrained('users')
            ->cascadeOnDelete();

        $table->string('preferred_content_language', 5)
            ->default('en');

        $table->string('difficulty_preference', 30)
            ->default('adaptive');

        $table->boolean('autoplay_lessons')->default(true);
        $table->boolean('resume_last_position')->default(true);
        $table->boolean('show_completed_lessons')->default(true);
        $table->boolean('show_quiz_explanations')->default(true);
        $table->boolean('confirm_before_quiz_submit')->default(true);

        $table->unsignedSmallInteger('daily_learning_goal_minutes')
            ->default(30);

        $table->unsignedSmallInteger('weekly_learning_goal_minutes')
            ->default(180);

        $table->json('preferred_learning_days')
            ->nullable();

        $table->time('preferred_learning_start_time')
            ->nullable();

        $table->time('preferred_learning_end_time')
            ->nullable();

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('student_learning_preferences');
}
};
