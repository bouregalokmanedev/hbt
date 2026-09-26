<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_diagnostic_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Best submitted score across attempts (null until first submit).
            $table->unsignedTinyInteger('best_score')->nullable();

            $table->unsignedInteger('attempts_count')->default(0);

            // Complete = best_score >= assignment min_score (or scenario passing_score for legacy).
            $table->boolean('passed')->default(false);

            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['course_id', 'diagnostic_scenario_id', 'user_id'],
                'cdp_course_scenario_user_unique'
            );

            $table->index(['course_id', 'user_id']);
            $table->index(['user_id', 'passed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_diagnostic_progress');
    }
};
