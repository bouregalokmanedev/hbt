<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_assessment_scenario_paths', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('scenario_id')->constrained('diagnostic_scenarios')->cascadeOnDelete();
            $table->foreignUuid('step_id')->constrained('diagnostic_scenario_steps')->cascadeOnDelete();
            $table->json('chosen_option')->nullable(); // Store chosen action/data as JSON
            $table->foreignUuid('next_step_id')->nullable()->constrained('diagnostic_scenario_steps')->nullOnDelete();
            $table->unsignedInteger('order')->default(0);
            $table->unsignedInteger('points_earned')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(
                ['attempt_id', 'scenario_id', 'order'],
                'sasp_attempt_scenario_order_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assessment_scenario_paths');
    }
};