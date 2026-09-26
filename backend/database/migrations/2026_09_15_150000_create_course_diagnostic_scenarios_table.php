<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_diagnostic_scenarios', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->unsignedInteger('position')->default(1);

            $table->boolean('is_required')->default(true);

            // Minimum score to count as complete for this course.
            $table->unsignedTinyInteger('min_score')->default(70);

            // Null = unlimited.
            $table->unsignedInteger('max_attempts')->nullable();

            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();

            $table->timestamps();

            $table->unique(['course_id', 'diagnostic_scenario_id'], 'cds_course_scenario_unique');
            $table->unique(['course_id', 'position'], 'cds_course_position_unique');
            $table->index(['course_id', 'is_required']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_diagnostic_scenarios');
    }
};
