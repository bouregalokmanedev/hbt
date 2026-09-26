<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_step_results', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('diagnostic_scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_attempt_id')
                ->constrained('diagnostic_scenario_attempts')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_step_id')
                ->constrained('diagnostic_scenario_steps')
                ->cascadeOnDelete();

            $table->unsignedInteger('points_earned')->default(0);
            $table->unsignedInteger('points_possible')->default(0);

            $table->boolean('is_correct')->default(false);

            // Per-criterion breakdown from DiagnosticStepGradingService.
            $table->json('criteria_breakdown')->nullable();

            $table->timestamp('graded_at')->nullable();

            $table->timestamps();

            $table->unique([
                'diagnostic_scenario_attempt_id',
                'diagnostic_scenario_step_id',
            ], 'dssr_attempt_step_unique');

            $table->index('diagnostic_scenario_attempt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenario_step_results');
    }
};
