<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_responses', function (Blueprint $table) {
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

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Nth submission for this step within this attempt (1 = first).
            $table->unsignedInteger('response_number')->default(1);

            // Tool used for this response, e.g. scanner, multimeter, oscilloscope, location, schematic.
            $table->string('tool')->nullable();

            // Raw student action: choice, measurement, probe placement, selected component, etc.
            $table->json('payload');

            $table->unsignedInteger('points_earned')->default(0);
            $table->unsignedInteger('points_possible')->default(0);

            $table->boolean('is_correct')->nullable();

            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            $table->unique([
                'diagnostic_scenario_attempt_id',
                'diagnostic_scenario_step_id',
                'response_number',
            ], 'dsr_attempt_step_number_unique');

            $table->index([
                'diagnostic_scenario_attempt_id',
                'diagnostic_scenario_step_id',
            ], 'dsr_attempt_step_index');

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenario_responses');
    }
};
